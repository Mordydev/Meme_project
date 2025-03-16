/**
 * Verification Service
 * 
 * Verifies the legitimacy of point-earning activities to prevent exploitation
 * and ensure fair distribution of rewards.
 */
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { PointsSource } from '../../models/user-points';
import { logger } from '../../lib/logger';
import { getRedisClient } from '../../lib/db-client';

export interface ActivityContext {
  userId: string;
  source: PointsSource;
  amount: number;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  isValid: boolean;
  confidence: number;
  reason?: string;
  qualityScore?: number;
}

export enum VerificationLevel {
  NEW = 0,
  BASIC = 1,
  TRUSTED = 2,
  VERIFIED = 3
}

/**
 * Strategy interface for verification approaches
 */
interface VerificationStrategy {
  supports(context: ActivityContext): boolean;
  verify(context: ActivityContext): Promise<VerificationResult>;
}

/**
 * Service to verify point-earning activities
 */
export class VerificationService {
  private strategies: VerificationStrategy[] = [];
  private redis = getRedisClient();
  private userTrustCache = new Map<string, { level: VerificationLevel; expiresAt: number }>();
  
  // Cache trust level for 30 minutes
  private readonly TRUST_CACHE_TTL = 30 * 60 * 1000;

  constructor(private userPointsRepository: UserPointsRepository) {
    // Register verification strategies
    this.registerDefaultStrategies();
  }

  /**
   * Register a verification strategy
   */
  registerStrategy(strategy: VerificationStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Verify a point-earning activity
   */
  async verifyActivity(context: ActivityContext): Promise<VerificationResult> {
    try {
      // Apply trust-based verification depth
      const trustLevel = await this.getUserVerificationLevel(context.userId);
      
      // Trusted users get simplified verification
      if (trustLevel >= VerificationLevel.TRUSTED) {
        // For trusted users, only check rate limiting
        const isRateLimited = await this.checkRateLimit(context.userId, context.source);
        if (isRateLimited) {
          return {
            isValid: false,
            confidence: 1.0,
            reason: 'Rate limit exceeded'
          };
        }
        
        return {
          isValid: true,
          confidence: 0.95
        };
      }
      
      // Find applicable verification strategies
      const applicableStrategies = this.strategies.filter(strategy => 
        strategy.supports(context)
      );
      
      if (applicableStrategies.length === 0) {
        logger.warn(`No verification strategy found for source: ${context.source}`);
        // Default to basic rate limiting if no strategy exists
        const isRateLimited = await this.checkRateLimit(context.userId, context.source);
        return {
          isValid: !isRateLimited,
          confidence: 0.7,
          reason: isRateLimited ? 'Rate limit exceeded' : undefined
        };
      }
      
      // Apply all applicable strategies
      const results = await Promise.all(
        applicableStrategies.map(strategy => strategy.verify(context))
      );
      
      // If any strategy determines the activity is invalid, reject it
      const invalidResult = results.find(result => !result.isValid);
      if (invalidResult) {
        return invalidResult;
      }
      
      // Average confidence scores
      const confidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
      
      // Average quality scores if available
      const qualityScores = results.filter(r => r.qualityScore !== undefined).map(r => r.qualityScore);
      const qualityScore = qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score!, 0) / qualityScores.length
        : undefined;
      
      return {
        isValid: true,
        confidence,
        qualityScore
      };
    } catch (error) {
      logger.error('Error in activity verification', { error, context });
      // Default to permissive behavior on system errors to avoid blocking legitimate users
      return {
        isValid: true,
        confidence: 0.5,
        reason: 'Verification system error'
      };
    }
  }

  /**
   * Get user's verification level based on history and reputation
   */
  async getUserVerificationLevel(userId: string): Promise<VerificationLevel> {
    // Check cache first
    const now = Date.now();
    const cached = this.userTrustCache.get(userId);
    if (cached && now < cached.expiresAt) {
      return cached.level;
    }
    
    try {
      // Get user points history volume
      const totalPoints = await this.userPointsRepository.getUserPointsBalance(userId);
      
      // Determine verification level based on points history
      let level = VerificationLevel.NEW;
      
      if (totalPoints > 10000) {
        level = VerificationLevel.VERIFIED;
      } else if (totalPoints > 5000) {
        level = VerificationLevel.TRUSTED;
      } else if (totalPoints > 1000) {
        level = VerificationLevel.BASIC;
      }
      
      // Also check Redis for any manual trust level adjustments
      const manualLevel = await this.redis.get(`user:${userId}:trust_level`);
      if (manualLevel) {
        level = parseInt(manualLevel, 10) as VerificationLevel;
      }
      
      // Cache result
      this.userTrustCache.set(userId, {
        level,
        expiresAt: now + this.TRUST_CACHE_TTL
      });
      
      return level;
    } catch (error) {
      logger.error('Error getting user verification level', { error, userId });
      return VerificationLevel.NEW; // Default to lowest trust level on error
    }
  }

  /**
   * Check if an activity exceeds rate limits
   */
  private async checkRateLimit(userId: string, source: PointsSource): Promise<boolean> {
    const key = `ratelimit:${userId}:${source}`;
    
    try {
      const count = await this.redis.incr(key);
      
      // First time seeing this key, set expiry
      if (count === 1) {
        await this.redis.expire(key, 60); // 1 minute rate limit window
      }
      
      // Define limits based on activity type
      const limits: Record<PointsSource, number> = {
        content_creation: 5,      // 5 posts per minute max
        comment: 10,              // 10 comments per minute max
        upvote_received: 20,      // 20 upvotes per minute max (received)
        daily_login: 1,           // 1 login per minute (should be 1 per day)
        achievement: 5,           // 5 achievements per minute max
        referral: 5,              // 5 referrals per minute max
        profile_completion: 1,    // 1 profile completion per minute
        wallet_connection: 1,     // 1 wallet connection per minute
        streak_bonus: 1,          // 1 streak bonus per minute
        transfer_in: 5,           // 5 transfers in per minute max
        transfer_out: 5,          // 5 transfers out per minute max
        redemption: 1,            // 1 redemption per minute
        special_event: 5,         // 5 special events per minute
        admin_adjustment: 10      // 10 admin adjustments per minute
      };
      
      const limit = limits[source] || 10; // Default to 10 per minute
      
      return count > limit;
    } catch (error) {
      logger.error('Error checking rate limit', { error, userId, source });
      return false; // Allow the action on Redis error
    }
  }

  /**
   * Register default verification strategies
   */
  private registerDefaultStrategies(): void {
    // Content creation verification
    this.registerStrategy({
      supports(context: ActivityContext): boolean {
        return context.source === 'content_creation';
      },
      
      async verify(context: ActivityContext): Promise<VerificationResult> {
        // Implement content verification logic
        // This would include duplicate content detection, spam detection, etc.
        
        // For now, implement a simple mock that just does rate limiting
        const isRateLimited = false; // In a real implementation, this would be a real check
        
        return {
          isValid: !isRateLimited,
          confidence: 0.9,
          reason: isRateLimited ? 'Rate limit exceeded' : undefined
        };
      }
    });
    
    // Comment verification
    this.registerStrategy({
      supports(context: ActivityContext): boolean {
        return context.source === 'comment';
      },
      
      async verify(context: ActivityContext): Promise<VerificationResult> {
        // Similar to content creation but for comments
        return {
          isValid: true,
          confidence: 0.9
        };
      }
    });
    
    // Generic strategy for all other sources
    this.registerStrategy({
      supports(context: ActivityContext): boolean {
        return true; // Fallback for any source
      },
      
      async verify(context: ActivityContext): Promise<VerificationResult> {
        // Basic verification that just checks rate limits
        const isRateLimited = false; // In a real implementation, this would be a real check
        
        return {
          isValid: !isRateLimited,
          confidence: 0.8,
          reason: isRateLimited ? 'Rate limit exceeded' : undefined
        };
      }
    });
  }
}
