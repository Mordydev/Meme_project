/**
 * Enhanced Points Service
 *
 * Core service for managing Success Points with Redis-based cap enforcement,
 * improved verification, and advanced anti-exploitation measures.
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { PointsRepository, PointsTransactionModel } from '../../repositories/points-repository'; // Import model type
import {
  PointsAwardData,
  PointsDeductionData,
  PointsSource,
  POINTS_CAPS,
  POINTS_VALUES,
  DailyCap
} from '../../models/entities/points.model';
// Import NewUserPoints and UserPoints (as PointsEntity) types
import { NewUserPoints, UserPoints as PointsEntity } from '../../database/schema/points';
import { EventBus, EventType } from '../../lib/event-bus';
import { PointsVerifier } from './verification/points-verifier';
import {
  PointsLimitExceededError, // Corrected name
  InsufficientPointsError,
  ValidationError,
  SuspiciousActivityError
} from '../../errors';
import { redisCapTracker, CapType } from './rate-limiting/redis-cap-tracker';
import { redisClient } from '../../lib/redis-client'; // Corrected import path if needed
import { WalletService } from '../wallet/wallet-service'; // Import class
import { ProfileService } from '../profiles/profile-service'; // Import class
import { TrendsQueryParams, TrendDataPoint } from '../../api/points/types'; // Import Trend types
// Import service instances needed internally if not passed via constructor
import { walletService, profileService } from '../../services';
import { cacheService } from '../../lib/cache'; // Import cache service

/**
 * Interface for suspicious activity report
 */
interface SuspiciousActivityReport {
  userId: string;
  source: PointsSource;
  amount: number;
  reason: string;
  timestamp: Date;
  confidenceScore: number;
  metadata?: Record<string, any>;
}

/**
 * Enhanced service for managing the Success Points system
 */
export class EnhancedPointsService {
  // Key prefix for suspicious activity tracking
  private readonly SUSPICIOUS_ACTIVITY_KEY = 'suspicious:activity';

  // Pattern matching throttling
  private readonly PATTERN_MATCH_THRESHOLD = 3;
  private readonly PATTERN_WATCH_PERIOD = 24 * 60 * 60; // 24 hours in seconds

  /**
   * Create a new EnhancedPointsService
   *
   * @param pointsRepository Repository for points data access
   * @param eventBus Event bus for publishing events
   * @param pointsVerifier Service for verifying points-earning activities
   */
  constructor(
    private pointsRepository: PointsRepository,
    private eventBus: EventBus,
    private pointsVerifier: PointsVerifier
  ) {}

  /**
   * Award points to a user for an activity
   *
   * @param data Points award data
   * @returns Result containing success status, amount, and new total
   */
  async awardPoints(data: PointsAwardData): Promise<{ success: boolean; amount: number; total: number }> {
    // Validate the award data
    if (data.amount <= 0) {
      throw new ValidationError('Points amount must be positive');
    }

    // Check for suspicious patterns before processing
    const isSuspicious = await this.checkSuspiciousPatterns(data.userId, data.source);
    if (isSuspicious) {
      logger.warn('Suspicious activity pattern detected', {
        userId: data.userId,
        source: data.source
      });

      await this.recordSuspiciousActivity({
        userId: data.userId,
        source: data.source,
        amount: data.amount,
        reason: 'SUSPICIOUS_PATTERN',
        timestamp: new Date(),
        confidenceScore: 0.85
      });

      // Throttle the user for this activity type
      await this.applyThrottling(data.userId, data.source);

      return { success: false, amount: 0, total: await this.getUserBalance(data.userId) };
    }

    // --- Cap Check/Increment (Atomic Approach) ---
    // Get cap limits first (handles case where source has no defined cap)
    const dailyLimit = (POINTS_CAPS as Record<PointsSource, number>)[data.source] ?? 0;
    const weeklyLimit = dailyLimit; // Assuming weekly limit is same as daily for now, adjust if needed

    let dailyIncremented = false;
    let weeklyIncremented = false;

    try {
      // 1. Attempt to increment Daily Cap
      if (dailyLimit > 0) {
        const newDailyValue = await redisCapTracker.incrementCap(data.userId, data.source, data.amount, CapType.DAILY);
        dailyIncremented = true; // Mark as incremented
        if (newDailyValue > dailyLimit) {
          // Cap exceeded, decrement to compensate
          await redisCapTracker.decrementCap(data.userId, data.source, data.amount, CapType.DAILY);
          dailyIncremented = false; // Mark as no longer incremented
          logger.info(`Daily cap exceeded for ${data.userId} on ${data.source}`, { attempted: newDailyValue, limit: dailyLimit });
          return { success: false, amount: 0, total: await this.getUserBalance(data.userId) };
        }
      }

      // 2. Attempt to increment Weekly Cap (only if daily passed or had no limit)
      if (weeklyLimit > 0) {
         const newWeeklyValue = await redisCapTracker.incrementCap(data.userId, data.source, data.amount, CapType.WEEKLY);
         weeklyIncremented = true; // Mark as incremented
         if (newWeeklyValue > weeklyLimit) {
           // Cap exceeded, decrement to compensate
           await redisCapTracker.decrementCap(data.userId, data.source, data.amount, CapType.WEEKLY);
           weeklyIncremented = false; // Mark as no longer incremented
           // Also decrement daily cap if it was incremented
           if (dailyIncremented) {
               await redisCapTracker.decrementCap(data.userId, data.source, data.amount, CapType.DAILY);
           }
           logger.info(`Weekly cap exceeded for ${data.userId} on ${data.source}`, { attempted: newWeeklyValue, limit: weeklyLimit });
           return { success: false, amount: 0, total: await this.getUserBalance(data.userId) };
         }
      }

      // --- Verification ---
      // If verification is required for this source, verify the activity
      if (this.requiresVerification(data.source)) {
        const verificationResult = await this.pointsVerifier.verifyActivity({
          userId: data.userId,
          activityType: data.source,
          amount: data.amount,
          referenceId: data.referenceId,
          metadata: data.metadata
        });

        if (!verificationResult.isValid) {
          logger.warn('Activity verification failed', {
            userId: data.userId,
            source: data.source,
            reason: verificationResult.reason
          });

          // If the activity is suspicious, record it and possibly trigger further actions
          if (verificationResult.confidenceScore > 0.8) {
            await this.recordSuspiciousActivity({
              userId: data.userId,
              source: data.source,
              amount: data.amount,
              reason: verificationResult.reason || 'VERIFICATION_FAILED',
              timestamp: new Date(),
              confidenceScore: verificationResult.confidenceScore,
              metadata: data.metadata
            });

            // Apply throttling if confidence is very high
            if (verificationResult.confidenceScore > 0.95) {
              await this.applyThrottling(data.userId, data.source);
            }
          }

          // If verification failed, we need to decrement any caps that were incremented
          if (dailyIncremented) {
              await redisCapTracker.decrementCap(data.userId, data.source, data.amount, CapType.DAILY);
          }
          if (weeklyIncremented) {
              await redisCapTracker.decrementCap(data.userId, data.source, data.amount, CapType.WEEKLY);
          }

          return { success: false, amount: 0, total: await this.getUserBalance(data.userId) };
        }

        // If the activity has a quality score, adjust points accordingly
        if (verificationResult.qualityScore && verificationResult.qualityScore > 1) {
          const originalAmount = data.amount;
          data.amount = Math.floor(data.amount * verificationResult.qualityScore);

          // Add quality bonus explanation to description
          if (!data.description) {
            data.description = `${originalAmount} points with quality bonus`;
          } else {
            data.description += ` (includes quality bonus)`;
          }
        }
      }

      // --- Database Transaction ---
      // Generate ID before calling repository
      const transactionData: NewUserPoints = {
        id: uuidv4(),
        userId: data.userId,
        amount: data.amount,
        source: data.source,
        referenceId: data.referenceId,
        description: data.description || this.getDefaultDescription(data.source),
        // metadata can be added if the schema/type supports it
      };
      const transaction = await this.pointsRepository.addPointsTransaction(transactionData);

      // Caps were already incremented successfully before this point

      // Get updated balance
      const newTotal = await this.getUserBalance(data.userId);

      // Emit event for points awarded
      await this.eventBus.publish(EventType.POINTS_AWARDED, {
        userId: data.userId,
        amount: data.amount,
        source: data.source,
        total: newTotal,
        transactionId: transaction.id
      });

      // Check for level up based on new total
      await this.checkForLevelUp(data.userId, newTotal);

      // Check for achievements
      await this.checkForAchievements(data.userId, data.source, data.amount, newTotal);

      // Invalidate relevant caches
      await this.invalidateUserPointsCache(data.userId);

      logger.info(`Awarded ${data.amount} points to ${data.userId} for ${data.source}`);
      return { success: true, amount: data.amount, total: newTotal };

    } catch (error) {
       // Catch errors from cap incrementing OR verification OR DB transaction
       logger.error('Error during points award process', { userId: data.userId, source: data.source, error });
       // If any cap was incremented, try to decrement it
       if (dailyIncremented) {
           await redisCapTracker.decrementCap(data.userId, data.source, data.amount, CapType.DAILY);
           logger.warn('Compensated daily cap due to error during award process', { userId: data.userId, source: data.source, amount: data.amount });
       }
       if (weeklyIncremented) {
           await redisCapTracker.decrementCap(data.userId, data.source, data.amount, CapType.WEEKLY);
           logger.warn('Compensated weekly cap due to error during award process', { userId: data.userId, source: data.source, amount: data.amount });
       }
       // Rethrow the original error after attempting compensation
       throw error;
    }
  }

  /**
   * Deduct points from a user (for redemptions, etc.)
   *
   * @param data Points deduction data
   * @returns Result containing success status, amount, and new total
   */
  async deductPoints(data: PointsDeductionData): Promise<{ success: boolean; amount: number; total: number }> {
    // Validate the deduction data
    if (data.amount <= 0) {
      throw new ValidationError('Deduction amount must be positive');
    }

    // Check if user has sufficient points
    const currentBalance = await this.getUserBalance(data.userId);
    if (currentBalance < data.amount) {
      throw new InsufficientPointsError(
        `Insufficient points balance: ${currentBalance} available, ${data.amount} required`
      );
    }

    // If this is a redemption, check weekly redemption cap
    if (data.source === 'redemption') {
      const weeklyRedemptions = await this.getWeeklyRedemptionTotal(data.userId);
      const weeklyRedemptionCap = 10000; // 10,000 SP per week (100 SKC)

      if (weeklyRedemptions + data.amount > weeklyRedemptionCap) {
        throw new PointsLimitExceededError( // Corrected error name
          `Weekly redemption cap exceeded: ${weeklyRedemptions} used, ${weeklyRedemptionCap} limit`
        );
      }

      // For redemptions, also check that the user has a connected wallet
      const hasWallet = await walletService.hasConnectedWallet(data.userId);
      if (!hasWallet) {
        throw new ValidationError('Wallet connection required for redemption');
      }

      // Verify minimum redemption amount
      const minRedemption = 1000; // 1,000 SP (10 SKC)
      if (data.amount < minRedemption) {
        throw new ValidationError(`Minimum redemption amount is ${minRedemption} points`);
      }
    }

    // Create a deduction transaction
    try {
      const transaction = await this.pointsRepository.deductPoints({
        userId: data.userId,
        amount: data.amount, // Repository handles making it negative
        source: data.source,
        referenceId: data.referenceId,
        description: data.description || `Points deduction for ${data.source}`
      });

      // Get updated balance
      const newTotal = await this.getUserBalance(data.userId);

      // If this is a redemption, emit a specific event and update the redemption tracking
      if (data.source === 'redemption') {
        await this.eventBus.publish(EventType.POINTS_REDEEMED, {
          userId: data.userId,
          amount: data.amount,
          total: newTotal,
          transactionId: transaction.id,
          referenceId: data.referenceId
        });

        // Update weekly redemption counter in Redis
        await this.incrementWeeklyRedemptionCounter(data.userId, data.amount);
      }

      // Invalidate relevant caches
      await this.invalidateUserPointsCache(data.userId);

      logger.info(`Deducted ${data.amount} points from ${data.userId} for ${data.source}`);
      return { success: true, amount: data.amount, total: newTotal };
    } catch (error) {
      logger.error('Error deducting points', { userId: data.userId, source: data.source, error });
      throw error;
    }
  }

  /**
   * Get a user's current points balance
   *
   * @param userId User ID
   * @returns Current points balance
   */
  async getUserBalance(userId: string): Promise<number> {
    const cacheKey = `balance:${userId}`;
    const cacheOptions = { namespace: 'points', ttl: 5 * 60 }; // Cache for 5 minutes

    try {
        const balance = await cacheService.getOrSet(
            cacheKey,
            () => this.pointsRepository.getUserPointsTotal(userId),
            cacheOptions
        );
        // Handle null case if fetch fails during stale-while-revalidate or initial fetch
        return balance ?? 0;
    } catch (error) {
        logger.error('Failed to get user balance from cache/repository', { userId, cacheKey, error });
        // Fallback to direct fetch on complete cache failure
        try {
            return await this.pointsRepository.getUserPointsTotal(userId);
        } catch (repoError) {
            logger.error('Direct repository fetch for balance also failed', { userId, repoError });
            return 0; // Return 0 if everything fails
        }
    }
  }

  /**
   * Get a user's points transactions
   *
   * @param userId User ID
   * @param limit Maximum number of transactions
   * @param userId User ID
   * @param options Options for limit, offset, and source filtering
   * @returns Object containing transactions list (using the repository's model type) and total count
   */
  async getUserTransactions(
    userId: string,
    options: { limit?: number; offset?: number; source?: string }
  ): Promise<{ transactions: PointsTransactionModel[]; total: number }> { // Use PointsTransactionModel from repository
    const { limit = 20, offset = 0, source } = options;
    // Include options in cache key for uniqueness
    const cacheKey = `transactions:${userId}:l${limit}:o${offset}${source ? ':s' + source : ''}`;
    // Cache transaction history for a shorter duration, maybe disable SWR if freshness is critical
    const cacheOptions = { namespace: 'points', ttl: 2 * 60 }; // Cache for 2 minutes

    try {
        const result = await cacheService.getOrSet(
            cacheKey,
            () => this.pointsRepository.getUserPointsTransactions(userId, { limit, offset, source }),
            cacheOptions
        );
        // Handle null case
        return result ?? { transactions: [], total: 0 };
    } catch (error) {
        logger.error('Failed to get user transactions from cache/repository', { userId, options, cacheKey, error });
        // Fallback to direct fetch
        try {
            return await this.pointsRepository.getUserPointsTransactions(userId, { limit, offset, source });
        } catch (repoError) {
            logger.error('Direct repository fetch for transactions also failed', { userId, options, repoError });
            return { transactions: [], total: 0 }; // Return empty on complete failure
        }
    }
  }

  /**
   * Get a user's daily points cap for a specific source
   *
   * @param userId User ID
   * @param source Points source
   * @returns Daily cap information
   */
  async getDailyCap(userId: string, source: PointsSource): Promise<DailyCap> {
    const cap = await redisCapTracker.checkDailyCap(userId, source, 0);

    return {
      source,
      limit: cap.limit,
      current: cap.current,
      remaining: cap.remaining,
      resetsAt: cap.resetsAt
    };
  }

  /**
   * Get all daily caps for a user
   *
   * @param userId User ID
   * @returns Map of source to daily cap information
   */
  async getAllDailyCaps(userId: string): Promise<Map<PointsSource, DailyCap>> {
    const caps = new Map();
    const allCaps = await redisCapTracker.getAllCaps(userId);

    // Convert from the Redis tracker format to the service format
    allCaps.forEach((cap, source) => {
      caps.set(source, {
        source,
        limit: cap.daily.limit,
        current: cap.daily.current,
        remaining: cap.daily.remaining,
        resetsAt: cap.daily.resetsAt
      });
    });

    return caps;
  }

  /**
   * Get all caps (daily and weekly) for a user
   *
   * @param userId User ID
   * @returns Map of source to cap information
   */
  async getAllCaps(userId: string): Promise<any> {
    return redisCapTracker.getAllCaps(userId);
  }

  /**
   * Get points value for an activity
   *
   * @param source Points source
   * @returns Points value for the activity
   */
  getPointsValue(source: PointsSource): number {
    return POINTS_VALUES[source] || 0;
  }

  // Removed transferPoints method - Service should orchestrate using award/deduct

  /**
   * Get weekly redemption total for a user
   *
   * @param userId User ID
   * @returns Total points redeemed this week
   */
  private async getWeeklyRedemptionTotal(userId: string): Promise<number> {
    const key = this.getWeeklyRedemptionKey(userId);
    const value = await redisClient.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Increment weekly redemption counter
   *
   * @param userId User ID
   * @param amount Amount to increment
   */
  private async incrementWeeklyRedemptionCounter(userId: string, amount: number): Promise<void> {
    const key = this.getWeeklyRedemptionKey(userId);
    const currentValue = await redisClient.get(key) || '0';
    const newValue = parseInt(currentValue, 10) + amount;

    // Set with expiry that matches the end of the week
    const now = new Date();
    const daysUntilMonday = 1 - now.getDay();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (daysUntilMonday <= 0 ? daysUntilMonday + 7 : daysUntilMonday));
    nextMonday.setHours(0, 0, 0, 0);

    const expirySeconds = Math.ceil((nextMonday.getTime() - now.getTime()) / 1000) + 3600; // Add 1 hour buffer
    await redisClient.set(key, newValue.toString(), expirySeconds);
  }

  /**
   * Get the Redis key for weekly redemption tracking
   *
   * @param userId User ID
   * @returns Redis key
   */
  private getWeeklyRedemptionKey(userId: string): string {
    // Get the ISO week
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    // Format: redemption:week:YYYY-WW:userId
    return `redemption:week:${date.getFullYear()}-${String(weekNumber).padStart(2, '0')}:${userId}`;
  }

  /**
   * Check if a source requires verification
   *
   * @param source Points source
   * @returns Whether verification is required
   */
  private requiresVerification(source: PointsSource): boolean {
    // These sources typically need verification to prevent abuse
    const verifiedSources: PointsSource[] = [
      'content_creation',
      'comment',
      'reaction_received',
      'referral',
      'referral_conversion',
      'content_featured',
      'competition_prize'
    ];

    return verifiedSources.includes(source);
  }

  /**
   * Get default description for a points source
   *
   * @param source Points source
   * @returns Default description
   */
  private getDefaultDescription(source: PointsSource): string {
    const descriptions: Record<string, string> = {
      'content_creation': 'Created new content',
      'comment': 'Posted a comment',
      'reaction_received': 'Received reaction on content',
      'daily_login': 'Daily login bonus',
      'streak_bonus': 'Login streak bonus',
      'achievement': 'Achievement unlocked',
      'referral': 'Referred a new user',
      'referral_conversion': 'Referred user completed onboarding',
      'milestone': 'Platform milestone reached',
      'profile_completion': 'Completed profile',
      'wallet_connection': 'Connected wallet',
      'redemption': 'Points redeemed for tokens',
      'admin_award': 'Awarded by administrator',
      'content_featured': 'Content featured by moderators',
      'special_event': 'Participated in special event',
      'competition_prize': 'Competition prize',
      'transfer_in': 'Transfer received from another user',
      'transfer_out': 'Transfer sent to another user'
    };

    return descriptions[source] || `Points awarded for ${source}`;
  }

  /**
   * Record suspicious activity for further review
   *
   * @param activity Suspicious activity report
   */
  private async recordSuspiciousActivity(activity: SuspiciousActivityReport): Promise<void> {
    try {
      // Store in Redis with a unique ID
      const id = uuidv4();
      const key = `${this.SUSPICIOUS_ACTIVITY_KEY}:${id}`;

      // Store as JSON
      await redisClient.set(key, JSON.stringify(activity), 7 * 24 * 60 * 60); // 7 days expiry

      // Add to user's suspicious activity set
      const userKey = `${this.SUSPICIOUS_ACTIVITY_KEY}:user:${activity.userId}`;
      await redisClient.sadd(userKey, id);

      // Add to source's suspicious activity set
      const sourceKey = `${this.SUSPICIOUS_ACTIVITY_KEY}:source:${activity.source}`;
      await redisClient.sadd(sourceKey, id);

      // Set expiry on the sets too
      await redisClient.client.expire(userKey, 30 * 24 * 60 * 60); // 30 days
      await redisClient.client.expire(sourceKey, 30 * 24 * 60 * 60); // 30 days

      // In a real implementation, this would also:
      // 1. Send notifications to administrators for high-confidence reports
      // 2. Trigger automated restrictions based on severity and frequency
      // 3. Log to a more permanent storage solution for long-term auditing

      logger.warn('Suspicious activity recorded', {
        userId: activity.userId,
        source: activity.source,
        reason: activity.reason,
        confidenceScore: activity.confidenceScore,
        timestamp: activity.timestamp.toISOString()
      });
    } catch (error) {
      logger.error('Error recording suspicious activity', { activity, error });
      // Continue even if recording fails - better to allow activity than block users
    }
  }

  /**
   * Check for suspicious activity patterns
   *
   * @param userId User ID
   * @param source Activity source
   * @returns Whether suspicious patterns are detected
   */
  private async checkSuspiciousPatterns(userId: string, source: PointsSource): Promise<boolean> {
    try {
      // Get recent suspicious activities for this user and source
      const recentKey = `${this.SUSPICIOUS_ACTIVITY_KEY}:recent:${userId}:${source}`;
      const count = await redisClient.get(recentKey);

      if (count && parseInt(count, 10) >= this.PATTERN_MATCH_THRESHOLD) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking suspicious patterns', { userId, source, error });
      return false; // Fail open
    }
  }

  /**
   * Apply throttling for suspicious activity
   *
   * @param userId User ID
   * @param source Activity source
   */
  private async applyThrottling(userId: string, source: PointsSource): Promise<void> {
    try {
      // Increment the recent suspicious activity counter
      const recentKey = `${this.SUSPICIOUS_ACTIVITY_KEY}:recent:${userId}:${source}`;
      const currentCount = await redisClient.get(recentKey) || '0';
      const newCount = parseInt(currentCount, 10) + 1;

      // Set with expiry
      await redisClient.set(recentKey, newCount.toString(), this.PATTERN_WATCH_PERIOD);

      // If threshold exceeded, apply a temporary block
      if (newCount >= this.PATTERN_MATCH_THRESHOLD) {
        const blockKey = `${this.SUSPICIOUS_ACTIVITY_KEY}:block:${userId}:${source}`;
        await redisClient.set(blockKey, 'true', this.PATTERN_WATCH_PERIOD);

        logger.warn('Throttling applied to user for suspicious activity', { userId, source });
      }
    } catch (error) {
      logger.error('Error applying throttling', { userId, source, error });
      // Continue even if throttling fails
    }
  }

  /**
   * Check if user is throttled for an activity
   *
   * @param userId User ID
   * @param source Activity source
   * @returns Whether the user is throttled
   */
  async isThrottled(userId: string, source: PointsSource): Promise<boolean> {
    try {
      const blockKey = `${this.SUSPICIOUS_ACTIVITY_KEY}:block:${userId}:${source}`;
      return await redisClient.exists(blockKey);
    } catch (error) {
      logger.error('Error checking throttle status', { userId, source, error });
      return false; // Fail open
    }
  }

  /**
   * Check if user has leveled up based on points
   *
   * @param userId User ID
   * @param total Current points total
   */
  private async checkForLevelUp(userId: string, total: number): Promise<void> {
    try {
      // Level thresholds
      const levelThresholds = [
        0,      // Level 1
        500,    // Level 2
        1000,   // Level 3
        2500,   // Level 4
        5000,   // Level 5
        10000,  // Level 6
        50000,  // Level 7
        75000,  // Level 8
        100000, // Level 9
        150000  // Level 10
      ];

      // Find the highest level the user qualifies for
      let newLevel = 1;
      for (let i = levelThresholds.length - 1; i >= 0; i--) {
        if (total >= levelThresholds[i]) {
          newLevel = i + 1;
          break;
        }
      }

      // Get current level
      const userProfile = await profileService.getProfileByUserId(userId);
      const currentLevel = userProfile?.level || 1;

      // If level has increased, update profile and emit event
      if (newLevel > currentLevel) {
        // Update profile with new level
        await profileService.updateUserLevel(userId, newLevel);

        // Emit level up event
        await this.eventBus.publish(EventType.USER_LEVEL_UP, {
          userId,
          previousLevel: currentLevel,
          newLevel,
          pointsTotal: total
        });

        logger.info(`User ${userId} leveled up from ${currentLevel} to ${newLevel}`);
      }
    } catch (error) {
      logger.error('Error checking for level up', { userId, total, error });
      // Don't throw - level checks shouldn't block point awards
    }
  }

  /**
   * Check for achievements based on points activity
   *
   * @param userId User ID
   * @param source Activity source
   * @param amount Points amount
   * @param total Current total points
   */
  private async checkForAchievements(
    userId: string,
    source: PointsSource,
    amount: number,
    total: number
  ): Promise<void> {
    // This would be implemented in a real achievement system
    // For now, just log that we would check achievements
    logger.debug('Checking for achievements', { userId, source, amount, total });

    // TODO: Integrate with AchievementService (Task 2)
    // This will likely involve:
    // 1. Injecting achievementService into this service's constructor.
    // 2. Calling a method like:
    //    await this.achievementService.checkProgress({
    //      userId,
    //      eventType: 'points_awarded', // Or a more specific event type based on source
    //      data: { source, amount, total, referenceId: data.referenceId } // Pass relevant data
    //    });
    // The AchievementService would then handle evaluating relevant achievements.

    // Example of checking for a points-based achievement (can be removed once integrated):
    if (source === 'content_creation' && total >= 1000) {
      // This could trigger a "Content Creator" achievement
      logger.info('User qualifies for Content Creator achievement', { userId, total });

      // In a real implementation, this would:
      // 1. Check if the user already has the achievement
      // 2. If not, award the achievement
      // 3. Emit an achievement event
      // 4. Award any bonus points for the achievement
    }
  }

  /**
   * Get the end of the current day for cap resets
   *
   * @returns Date representing the end of the day
   */
  private getEndOfDay(): Date {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }

  /**
   * Get points earning trends over a specified period
   * TODO: Implement actual database query and aggregation logic
   *
   * @param userId User ID
   * @param period Time period ('day', 'week', 'month', 'year')
   * @returns Array of trend data points.
   */
  async getTrends(userId: string, period: NonNullable<TrendsQueryParams['period']>): Promise<TrendDataPoint[]> {
    const cacheKey = `trends:${userId}:${period}`;
    // Use a shorter TTL for trends, enable stale-while-revalidate
    const cacheOptions = { namespace: 'points', ttl: 15 * 60, staleWhileRevalidate: true }; // Cache 15 min, stale enabled

    try {
      const trendsData = await cacheService.getOrSet(
        cacheKey,
        async () => {
          logger.info(`Fetching points trends for user ${userId} over period ${period} (cache miss or stale)`, { key: cacheKey });
          // Call the repository method
          const results = await this.pointsRepository.getPointsTrends(userId, period);
          return results;
        },
        cacheOptions
      );

      // Handle potential null return from cacheService if fetch fails during stale-while-revalidate
      return trendsData ?? []; // Return empty array if null
    } catch (error) {
        logger.error('Failed to get or set trends cache', { userId, period, cacheKey, error });
        // Attempt to fetch directly from repository as a fallback if cache fails completely
        try {
            logger.warn(`Falling back to direct repository fetch for trends`, { userId, period });
            return await this.pointsRepository.getPointsTrends(userId, period);
        } catch (repoError) {
            logger.error('Failed to fetch trends directly from repository after cache failure', { userId, period, repoError });
            return []; // Return empty array on complete failure
        }
    }
  }

  /**
   * Invalidates caches related to a user's points data.
   * @param userId The ID of the user whose cache needs invalidation.
   */
  private async invalidateUserPointsCache(userId: string): Promise<void> {
    try {
      // Invalidate dashboard cache
      const dashboardCacheKey = `dashboard:${userId}`; // Assuming this prefix is used in dashboard handler
      await cacheService.delete(dashboardCacheKey, { namespace: 'dashboard' }); // Assuming dashboard uses its own namespace
      logger.debug(`Invalidated dashboard cache for user ${userId}`, { key: dashboardCacheKey });

      // Invalidate balance cache
      const balanceCacheKey = `balance:${userId}`;
      await cacheService.delete(balanceCacheKey, { namespace: 'points' });
      logger.debug(`Invalidated balance cache for user ${userId}`, { key: balanceCacheKey });

      // Invalidate all trends cache entries for the user
      const trendsPattern = `points:trends:${userId}:*`;
      await cacheService.deleteByPattern(trendsPattern); // deleteByPattern likely handles prefix internally if needed
      logger.debug(`Invalidated trends cache for user ${userId}`, { pattern: trendsPattern });

      // Invalidate all transaction history cache entries for the user
      const transactionsPattern = `points:transactions:${userId}:*`;
      await cacheService.deleteByPattern(transactionsPattern);
      logger.debug(`Invalidated transactions cache for user ${userId}`, { pattern: transactionsPattern });

      // TODO: Invalidate other relevant caches (e.g., leaderboards, user profile summaries) if they exist

    } catch (error) {
        logger.error('Failed to invalidate user points cache', { userId, error });
        // Log error but don't block the main operation
    }
  }
}
