/**
 * Referral Protection Service
 * 
 * Service for preventing abuse and exploitation of the referral system
 */
import { Redis } from 'ioredis';
import { ReferralRepository } from '../../../repositories/referral';
import { EventBus } from '../../../lib/event-bus';
import { logger } from '../../../lib/logger';
import { ValidationError } from '../../../errors';

/**
 * Protection result
 */
export interface ProtectionResult {
  allowed: boolean;
  limitExceeded?: boolean;
  suspicious?: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  resetTime?: Date;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limitExceeded?: boolean;
  currentCount?: number;
  limit?: number;
  resetTime?: Date;
}

/**
 * Abuse detection result
 */
export interface AbuseDetectionResult {
  suspicious: boolean;
  signals: string[];
  riskScore: number;
}

/**
 * Protection status
 */
export interface ProtectionStatus {
  rateLimits: {
    type: string;
    current: number;
    limit: number;
    resetTime: Date;
  }[];
  restrictions: {
    type: string;
    reason: string;
    appliedAt: Date;
    expiresAt?: Date;
  }[];
  riskScore: number;
  abuseHistory: {
    date: Date;
    type: string;
    action: string;
  }[];
}

/**
 * Limit configuration
 */
interface LimitConfig {
  id: string;
  actionType: string;
  period: string;
  limit: number;
  blockDuration?: number;
}

/**
 * Service for protecting the referral system from abuse
 */
export class ReferralProtectionService {
  /**
   * Rate limit configurations
   */
  private rateLimits: LimitConfig[] = [
    {
      id: 'create_referral_minute',
      actionType: 'create_referral',
      period: 'minute',
      limit: 5 // 5 referrals per minute
    },
    {
      id: 'create_referral_hour',
      actionType: 'create_referral',
      period: 'hour',
      limit: 20 // 20 referrals per hour
    },
    {
      id: 'create_referral_day',
      actionType: 'create_referral',
      period: 'day',
      limit: 50 // 50 referrals per day
    },
    {
      id: 'track_referral_minute',
      actionType: 'track_referral',
      period: 'minute',
      limit: 10 // 10 tracking events per minute
    },
    {
      id: 'redeem_reward_day',
      actionType: 'redeem_reward',
      period: 'day',
      limit: 100 // 100 reward redemptions per day
    }
  ];

  /**
   * Suspicious patterns to detect
   */
  private suspiciousPatterns = {
    rapidSignups: {
      threshold: 10, // 10 referrals in 10 minutes
      timeWindow: 10 * 60, // 10 minutes in seconds
      severity: 'high'
    },
    highReferralRate: {
      threshold: 30, // 30 referrals in a day
      timeWindow: 24 * 60 * 60, // 24 hours in seconds
      severity: 'medium'
    },
    lowConversionRate: {
      threshold: 0.1, // 10% conversion rate
      minReferrals: 10, // Must have at least 10 referrals
      severity: 'medium'
    },
    multipleIpAddresses: {
      threshold: 5, // 5 different IP addresses
      timeWindow: 24 * 60 * 60, // 24 hours in seconds
      severity: 'high'
    }
  };

  /**
   * Create a new ReferralProtectionService instance
   */
  constructor(
    private referralRepository: ReferralRepository,
    private redis: Redis,
    private eventBus: EventBus
  ) {}

  /**
   * Check referral limits for a user
   * 
   * @param userId User ID
   * @returns Protection result
   */
  async checkReferralLimits(userId: string): Promise<ProtectionResult> {
    try {
      // Check user restrictions
      const isRestricted = await this.isUserRestricted(userId);
      if (isRestricted) {
        return {
          allowed: false,
          reason: 'user_restricted'
        };
      }

      // Check rate limits for creation
      const rateLimitResult = await this.enforceRateLimits(userId, 'create_referral');
      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          limitExceeded: true,
          reason: 'rate_limit_exceeded',
          currentCount: rateLimitResult.currentCount,
          limit: rateLimitResult.limit,
          resetTime: rateLimitResult.resetTime
        };
      }

      // Check for suspicious patterns
      const abuseResult = await this.detectAbusePatterns(userId);
      if (abuseResult.suspicious) {
        // Log suspicious activity
        await this.logSuspiciousActivity(userId, abuseResult.signals);

        // For high-risk scenarios, block immediately
        if (abuseResult.riskScore > 0.7) {
          await this.restrictUser(userId, 'high_risk_activity', 24 * 60 * 60); // 24-hour restriction
          
          return {
            allowed: false,
            suspicious: true,
            reason: 'suspicious_activity_detected'
          };
        }

        // For medium-risk scenarios, allow but flag for review
        if (abuseResult.riskScore > 0.4) {
          await this.flagForReview(userId, 'suspicious_patterns', abuseResult.signals);
          
          // Still allow the referral
          return {
            allowed: true,
            suspicious: true
          };
        }
      }

      // All checks passed
      return { allowed: true };
    } catch (error) {
      logger.error('Failed to check referral limits', { userId, error });
      
      // Default to allowing in case of errors (with monitoring)
      return { allowed: true };
    }
  }

  /**
   * Enforce rate limits for a specific action
   * 
   * @param userId User ID
   * @param actionType Action type
   * @returns Rate limit result
   */
  async enforceRateLimits(userId: string, actionType: string): Promise<RateLimitResult> {
    try {
      // Find applicable limits for this action
      const applicableLimits = this.rateLimits.filter(limit => 
        limit.actionType === actionType
      );

      // If no limits defined, allow the action
      if (applicableLimits.length === 0) {
        return { allowed: true };
      }

      // Check each limit
      for (const limit of applicableLimits) {
        const result = await this.checkRateLimit(userId, limit);
        
        if (!result.allowed) {
          return result;
        }
      }

      // All limits passed
      return { allowed: true };
    } catch (error) {
      logger.error('Failed to enforce rate limits', { userId, actionType, error });
      
      // Default to allowing in case of errors (with monitoring)
      return { allowed: true };
    }
  }

  /**
   * Detect abuse patterns for a user
   * 
   * @param userId User ID
   * @returns Abuse detection result
   */
  async detectAbusePatterns(userId: string): Promise<AbuseDetectionResult> {
    try {
      // Initialize result
      const result: AbuseDetectionResult = {
        suspicious: false,
        signals: [],
        riskScore: 0
      };

      // Check rapid signups
      const rapidSignupsDetected = await this.detectRapidSignups(userId);
      if (rapidSignupsDetected) {
        result.signals.push('rapid_signups');
      }

      // Check high referral rate
      const highRateDetected = await this.detectHighReferralRate(userId);
      if (highRateDetected) {
        result.signals.push('high_referral_rate');
      }

      // Check low conversion rate
      const lowConversionDetected = await this.detectLowConversionRate(userId);
      if (lowConversionDetected) {
        result.signals.push('low_conversion_rate');
      }

      // Calculate risk score based on signals
      if (result.signals.length > 0) {
        result.suspicious = true;
        result.riskScore = this.calculateRiskScore(result.signals);
      }

      return result;
    } catch (error) {
      logger.error('Failed to detect abuse patterns', { userId, error });
      return { suspicious: false, signals: [], riskScore: 0 };
    }
  }

  /**
   * Get protection status for a user
   * 
   * @param userId User ID
   * @returns Protection status
   */
  async getProtectionStatus(userId: string): Promise<ProtectionStatus> {
    try {
      // Get rate limit status
      const rateLimits = await this.getRateLimitStatus(userId);
      
      // Get user restrictions
      const restrictions = await this.getUserRestrictions(userId);
      
      // Get abuse history
      const abuseHistory = await this.getAbuseHistory(userId);
      
      // Calculate current risk score
      const riskScore = await this.calculateUserRiskScore(userId);
      
      return {
        rateLimits,
        restrictions,
        riskScore,
        abuseHistory
      };
    } catch (error) {
      logger.error('Failed to get protection status', { userId, error });
      throw error;
    }
  }

  /**
   * Reset protection status for a user
   * 
   * @param userId User ID
   * @param adminId Admin user ID performing the reset
   * @returns Success status
   */
  async resetProtectionStatus(userId: string, adminId: string): Promise<boolean> {
    try {
      // Clear rate limits
      await this.clearRateLimits(userId);
      
      // Clear restrictions
      await this.clearRestrictions(userId);
      
      // Log the reset
      logger.info(`Protection status reset for user ${userId} by admin ${adminId}`);
      
      // Emit event
      await this.eventBus.publish('referral.protection_reset', {
        userId,
        adminId,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to reset protection status', { userId, adminId, error });
      return false;
    }
  }

  /**
   * Report suspicious activity
   * 
   * @param reportingUserId User ID reporting the activity
   * @param reportedUserId User ID being reported
   * @param reason Reason for the report
   * @param details Additional details
   * @returns Success status
   */
  async reportSuspiciousActivity(
    reportingUserId: string,
    reportedUserId: string,
    reason: string,
    details?: string
  ): Promise<boolean> {
    try {
      // Log the report
      logger.info(`Suspicious activity reported: ${reportedUserId}`, {
        reportingUserId,
        reason,
        details
      });
      
      // Store the report for review
      // In a real implementation, this would be stored in the database
      
      // Emit event
      await this.eventBus.publish('referral.suspicious_activity_reported', {
        reportingUserId,
        reportedUserId,
        reason,
        details,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to report suspicious activity', {
        reportingUserId,
        reportedUserId,
        reason,
        error
      });
      return false;
    }
  }

  /**
   * Check if a user is restricted
   * 
   * @param userId User ID
   * @returns Whether user is restricted
   */
  private async isUserRestricted(userId: string): Promise<boolean> {
    const key = `user:${userId}:restrictions`;
    const restrictions = await this.redis.hgetall(key);
    
    // Check if there are any active restrictions
    return Object.keys(restrictions).length > 0;
  }

  /**
   * Check a specific rate limit
   * 
   * @param userId User ID
   * @param limit Limit configuration
   * @returns Rate limit result
   */
  private async checkRateLimit(
    userId: string, 
    limit: LimitConfig
  ): Promise<RateLimitResult> {
    // Get period key
    const periodKey = this.getPeriodKey(limit.period, userId, limit.actionType);
    
    // Get current count
    const countStr = await this.redis.get(periodKey);
    const currentCount = countStr ? parseInt(countStr, 10) : 0;
    
    // Check if limit exceeded
    if (currentCount >= limit.limit) {
      // Get remaining time
      const ttl = await this.redis.ttl(periodKey);
      const resetTime = new Date(Date.now() + ttl * 1000);
      
      // If this is a severe violation, consider adding a temporary block
      if (limit.blockDuration && currentCount >= limit.limit * 2) {
        await this.restrictUser(
          userId, 
          `rate_limit_violation:${limit.id}`, 
          limit.blockDuration
        );
      }
      
      return {
        allowed: false,
        limitExceeded: true,
        currentCount,
        limit: limit.limit,
        resetTime
      };
    }
    
    // Increment count
    await this.redis.incr(periodKey);
    
    // Set expiry if this is a new key
    if (currentCount === 0) {
      const expirySeconds = this.getPeriodExpirySeconds(limit.period);
      await this.redis.expire(periodKey, expirySeconds);
    }
    
    return {
      allowed: true,
      currentCount: currentCount + 1,
      limit: limit.limit
    };
  }

  /**
   * Get period key for rate limiting
   * 
   * @param period Period ('minute', 'hour', 'day')
   * @param userId User ID
   * @param actionType Action type
   * @returns Redis key
   */
  private getPeriodKey(period: string, userId: string, actionType: string): string {
    // Get current time bucket
    const now = new Date();
    let timeBucket: string;
    
    switch (period) {
      case 'minute':
        timeBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
        break;
      case 'hour':
        timeBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
        break;
      case 'day':
        timeBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
        break;
      default:
        timeBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
    }
    
    return `rate_limit:${userId}:${actionType}:${period}:${timeBucket}`;
  }

  /**
   * Get period expiry seconds
   * 
   * @param period Period ('minute', 'hour', 'day')
   * @returns Expiry seconds
   */
  private getPeriodExpirySeconds(period: string): number {
    switch (period) {
      case 'minute':
        return 60;
      case 'hour':
        return 60 * 60;
      case 'day':
        return 24 * 60 * 60;
      default:
        return 24 * 60 * 60;
    }
  }

  /**
   * Restrict a user
   * 
   * @param userId User ID
   * @param reason Restriction reason
   * @param duration Duration in seconds (0 for permanent)
   */
  private async restrictUser(
    userId: string, 
    reason: string, 
    duration: number = 0
  ): Promise<void> {
    const key = `user:${userId}:restrictions`;
    const now = Math.floor(Date.now() / 1000);
    
    // Set restriction
    await this.redis.hset(key, reason, now.toString());
    
    // Set expiry if duration is non-zero
    if (duration > 0) {
      // We don't expire the hash itself, but we'll check timestamps when validating
      // Add duration to the hash field to indicate when it expires
      await this.redis.hset(key, `${reason}:expires`, (now + duration).toString());
    }
    
    // Log restriction
    logger.warn(`User ${userId} restricted for ${reason}`, {
      userId,
      reason,
      duration,
      expires: duration > 0 ? new Date(now * 1000 + duration * 1000) : 'never'
    });
    
    // Emit event
    await this.eventBus.publish('referral.user_restricted', {
      userId,
      reason,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Log suspicious activity
   * 
   * @param userId User ID
   * @param signals Detected signals
   */
  private async logSuspiciousActivity(
    userId: string, 
    signals: string[]
  ): Promise<void> {
    const key = `user:${userId}:suspicious_activity`;
    const now = Math.floor(Date.now() / 1000);
    
    // Record each signal
    for (const signal of signals) {
      await this.redis.lpush(key, `${now}:${signal}`);
    }
    
    // Keep only the latest 50 records
    await this.redis.ltrim(key, 0, 49);
    
    // Set expiry to 30 days
    await this.redis.expire(key, 30 * 24 * 60 * 60);
    
    // Log suspicious activity
    logger.warn(`Suspicious activity detected for user ${userId}`, {
      userId,
      signals
    });
    
    // Emit event
    await this.eventBus.publish('referral.suspicious_activity', {
      userId,
      signals,
      timestamp: new Date()
    });
  }

  /**
   * Flag a user for review
   * 
   * @param userId User ID
   * @param reason Reason for flagging
   * @param details Additional details
   */
  private async flagForReview(
    userId: string, 
    reason: string, 
    details: any
  ): Promise<void> {
    // In a real implementation, this would store the flag in the database
    // For now, we'll just log it
    logger.warn(`User ${userId} flagged for review: ${reason}`, {
      userId,
      reason,
      details
    });
    
    // Emit event
    await this.eventBus.publish('referral.flagged_for_review', {
      userId,
      reason,
      details,
      timestamp: new Date()
    });
  }

  /**
   * Detect rapid signups
   * 
   * @param userId User ID
   * @returns Whether rapid signups were detected
   */
  private async detectRapidSignups(userId: string): Promise<boolean> {
    try {
      // Get user's recent referrals
      const minuteAgo = new Date();
      minuteAgo.setMinutes(minuteAgo.getMinutes() - 10); // 10 minutes ago
      
      const recentReferrals = await this.referralRepository.findByReferrerId(
        userId,
        100, // Limit
        0    // Offset
      );
      
      // Filter for referrals in the last 10 minutes
      const recentCount = recentReferrals.filter(r => 
        r.created_at >= minuteAgo
      ).length;
      
      return recentCount >= this.suspiciousPatterns.rapidSignups.threshold;
    } catch (error) {
      logger.error('Failed to detect rapid signups', { userId, error });
      return false;
    }
  }

  /**
   * Detect high referral rate
   * 
   * @param userId User ID
   * @returns Whether high referral rate was detected
   */
  private async detectHighReferralRate(userId: string): Promise<boolean> {
    try {
      // Get user's recent referrals
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1); // 1 day ago
      
      const recentReferrals = await this.referralRepository.findByReferrerId(
        userId,
        100, // Limit
        0    // Offset
      );
      
      // Filter for referrals in the last day
      const recentCount = recentReferrals.filter(r => 
        r.created_at >= dayAgo
      ).length;
      
      return recentCount >= this.suspiciousPatterns.highReferralRate.threshold;
    } catch (error) {
      logger.error('Failed to detect high referral rate', { userId, error });
      return false;
    }
  }

  /**
   * Detect low conversion rate
   * 
   * @param userId User ID
   * @returns Whether low conversion rate was detected
   */
  private async detectLowConversionRate(userId: string): Promise<boolean> {
    try {
      // Get user's referral stats
      const stats = await this.referralRepository.getReferralStats(userId);
      
      // Check if user has enough referrals to assess
      if (stats.total < this.suspiciousPatterns.lowConversionRate.minReferrals) {
        return false;
      }
      
      // Calculate conversion rate
      const converted = stats.completed + stats.converted + stats.rewarded;
      const conversionRate = stats.total > 0 ? converted / stats.total : 0;
      
      return conversionRate < this.suspiciousPatterns.lowConversionRate.threshold;
    } catch (error) {
      logger.error('Failed to detect low conversion rate', { userId, error });
      return false;
    }
  }

  /**
   * Calculate risk score based on detected signals
   * 
   * @param signals Detected signals
   * @returns Risk score (0-1)
   */
  private calculateRiskScore(signals: string[]): number {
    if (signals.length === 0) {
      return 0;
    }
    
    // Assign weights to different signals
    const weights: Record<string, number> = {
      'rapid_signups': 0.7,
      'high_referral_rate': 0.5,
      'low_conversion_rate': 0.4,
      'multiple_ip_addresses': 0.8
    };
    
    // Calculate weighted score
    let score = 0;
    for (const signal of signals) {
      score += weights[signal] || 0.3; // Default weight for unknown signals
    }
    
    // Normalize to 0-1 range
    return Math.min(1, score / Math.max(signals.length, 1));
  }

  /**
   * Calculate current risk score for a user
   * 
   * @param userId User ID
   * @returns Risk score (0-1)
   */
  private async calculateUserRiskScore(userId: string): Promise<number> {
    try {
      // Get recent suspicious activity
      const result = await this.detectAbusePatterns(userId);
      
      // Get user's restriction status
      const isRestricted = await this.isUserRestricted(userId);
      const restrictionPenalty = isRestricted ? 0.5 : 0;
      
      // Get abuse history
      const abuseHistory = await this.getAbuseHistory(userId);
      const historyPenalty = Math.min(0.5, abuseHistory.length * 0.1);
      
      // Combine scores (base risk + penalties, capped at 1)
      return Math.min(1, result.riskScore + restrictionPenalty + historyPenalty);
    } catch (error) {
      logger.error('Failed to calculate user risk score', { userId, error });
      return 0;
    }
  }

  /**
   * Get rate limit status for a user
   * 
   * @param userId User ID
   * @returns Rate limit status
   */
  private async getRateLimitStatus(
    userId: string
  ): Promise<{
    type: string;
    current: number;
    limit: number;
    resetTime: Date;
  }[]> {
    const result = [];
    
    // Check each rate limit
    for (const limit of this.rateLimits) {
      const periodKey = this.getPeriodKey(limit.period, userId, limit.actionType);
      
      // Get current count and TTL
      const countStr = await this.redis.get(periodKey);
      const current = countStr ? parseInt(countStr, 10) : 0;
      const ttl = await this.redis.ttl(periodKey);
      
      // Only include non-zero counts
      if (current > 0) {
        result.push({
          type: `${limit.actionType}_${limit.period}`,
          current,
          limit: limit.limit,
          resetTime: new Date(Date.now() + ttl * 1000)
        });
      }
    }
    
    return result;
  }

  /**
   * Get user restrictions
   * 
   * @param userId User ID
   * @returns User restrictions
   */
  private async getUserRestrictions(
    userId: string
  ): Promise<{
    type: string;
    reason: string;
    appliedAt: Date;
    expiresAt?: Date;
  }[]> {
    const key = `user:${userId}:restrictions`;
    const restrictions = await this.redis.hgetall(key);
    const result = [];
    
    const now = Math.floor(Date.now() / 1000);
    
    // Process each restriction
    for (const [field, value] of Object.entries(restrictions)) {
      // Skip expiry fields (they have a different format)
      if (field.endsWith(':expires')) {
        continue;
      }
      
      // Get applied timestamp
      const appliedAt = new Date(parseInt(value) * 1000);
      
      // Check if there's an expiry
      const expiryField = `${field}:expires`;
      let expiresAt: Date | undefined;
      
      if (restrictions[expiryField]) {
        const expiryTimestamp = parseInt(restrictions[expiryField]);
        
        // Skip expired restrictions
        if (expiryTimestamp <= now) {
          continue;
        }
        
        expiresAt = new Date(expiryTimestamp * 1000);
      }
      
      result.push({
        type: 'restriction',
        reason: field,
        appliedAt,
        expiresAt
      });
    }
    
    return result;
  }

  /**
   * Get abuse history for a user
   * 
   * @param userId User ID
   * @returns Abuse history
   */
  private async getAbuseHistory(
    userId: string
  ): Promise<{
    date: Date;
    type: string;
    action: string;
  }[]> {
    // In a real implementation, this would query the database
    // For now, we'll check Redis for suspicious activity
    const key = `user:${userId}:suspicious_activity`;
    const history = await this.redis.lrange(key, 0, -1);
    
    return history.map(entry => {
      const [timestamp, type] = entry.split(':');
      
      return {
        date: new Date(parseInt(timestamp) * 1000),
        type,
        action: 'logged'
      };
    });
  }

  /**
   * Clear rate limits for a user
   * 
   * @param userId User ID
   */
  private async clearRateLimits(userId: string): Promise<void> {
    // Build pattern for keys
    const pattern = `rate_limit:${userId}:*`;
    
    // Get all matching keys
    const keys = await this.redis.keys(pattern);
    
    // Delete all keys (if any)
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Clear restrictions for a user
   * 
   * @param userId User ID
   */
  private async clearRestrictions(userId: string): Promise<void> {
    const key = `user:${userId}:restrictions`;
    await this.redis.del(key);
  }
}
