/**
 * Points Service
 * 
 * Core service for managing Success Points - the platform's engagement currency.
 * Handles awarding, tracking, and redeeming points while enforcing business rules.
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { PointsRepository } from '../../repositories/points-repository';
import { 
  PointsAwardData, 
  PointsDeductionData, 
  PointsSource, 
  POINTS_CAPS, 
  POINTS_VALUES 
} from '../../models/entities/points.model';
import { EventBus, EventType } from '../../lib/event-bus';
import { PointsVerifier } from './verification/points-verifier';
import { 
  PointsCapExceededError, 
  InsufficientPointsError, 
  ValidationError,
  SuspiciousActivityError
} from '../../errors';

export interface DailyCap {
  source: PointsSource;
  limit: number;
  current: number;
  remaining: number;
  resetsAt: Date;
}

/**
 * Core service for managing the Success Points system
 */
export class PointsService {
  /**
   * Create a new PointsService
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

    // Get the source-specific daily cap
    const dailyCap = await this.getDailyCap(data.userId, data.source);
    
    // Check if daily cap would be exceeded
    if (dailyCap.remaining < data.amount) {
      logger.info(`Daily cap exceeded for ${data.userId} on ${data.source}`);
      return { success: false, amount: 0, total: await this.getUserBalance(data.userId) };
    }

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
          await this.recordSuspiciousActivity(data.userId, data.source, verificationResult.reason);
          throw new SuspiciousActivityError('Suspicious activity detected');
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

    // Create a transaction with the repository
    try {
      const transaction = await this.pointsRepository.addPointsTransaction({
        userId: data.userId,
        amount: data.amount,
        source: data.source,
        referenceId: data.referenceId,
        description: data.description || this.getDefaultDescription(data.source)
      });

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

      // Check for level up based on new total (implementation depends on level system)
      this.checkForLevelUp(data.userId, newTotal);

      logger.info(`Awarded ${data.amount} points to ${data.userId} for ${data.source}`);
      return { success: true, amount: data.amount, total: newTotal };
    } catch (error) {
      logger.error('Error awarding points', { userId: data.userId, source: data.source, error });
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

    // Create a deduction transaction
    try {
      const transaction = await this.pointsRepository.deductPoints({
        userId: data.userId,
        amount: data.amount,
        source: data.source,
        referenceId: data.referenceId,
        description: data.description || `Points deduction for ${data.source}`
      });

      // Get updated balance
      const newTotal = await this.getUserBalance(data.userId);

      // If this is a redemption, emit a specific event
      if (data.source === 'redemption') {
        await this.eventBus.publish(EventType.POINTS_REDEEMED, {
          userId: data.userId,
          amount: data.amount,
          total: newTotal,
          transactionId: transaction.id,
          referenceId: data.referenceId
        });
      }

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
    return this.pointsRepository.getUserPointsTotal(userId);
  }

  /**
   * Get a user's points transactions
   * 
   * @param userId User ID
   * @param limit Maximum number of transactions
   * @param offset Number of transactions to skip (for pagination)
   * @returns Array of points transactions
   */
  async getUserTransactions(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    return this.pointsRepository.getUserPointsTransactions(userId, limit, offset);
  }

  /**
   * Get a user's daily points cap for a specific source
   * 
   * @param userId User ID
   * @param source Points source
   * @returns Daily cap information
   */
  async getDailyCap(userId: string, source: PointsSource): Promise<DailyCap> {
    // Get the limit for this source
    const limit = POINTS_CAPS[source] || 0;
    
    // If no cap, return unlimited
    if (limit === 0) {
      return {
        source,
        limit: 0,
        current: 0,
        remaining: Number.MAX_SAFE_INTEGER,
        resetsAt: this.getEndOfDay()
      };
    }

    // Get points earned today for this source
    const current = await this.pointsRepository.getDailyPointsBySource(userId, source);
    
    // Calculate remaining points
    const remaining = Math.max(0, limit - current);

    return {
      source,
      limit,
      current,
      remaining,
      resetsAt: this.getEndOfDay()
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
    
    // Get caps for each source
    for (const source of Object.keys(POINTS_CAPS) as PointsSource[]) {
      caps.set(source, await this.getDailyCap(userId, source));
    }
    
    return caps;
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

  /**
   * Transfer points between users
   * 
   * @param fromUserId User ID to transfer from
   * @param toUserId User ID to transfer to
   * @param amount Amount to transfer
   * @param description Optional description
   * @returns Result containing success status and transaction info
   */
  async transferPoints(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description?: string
  ): Promise<{ success: boolean; from: any; to: any }> {
    // Validate input
    if (amount <= 0) {
      throw new ValidationError('Transfer amount must be positive');
    }
    
    if (fromUserId === toUserId) {
      throw new ValidationError('Cannot transfer points to yourself');
    }

    // Execute transfer via repository
    try {
      const result = await this.pointsRepository.transferPointsBetweenUsers(
        fromUserId,
        toUserId,
        amount,
        'transfer',
        description
      );

      logger.info(`Transferred ${amount} points from ${fromUserId} to ${toUserId}`);
      return { success: true, from: result.from, to: result.to };
    } catch (error) {
      logger.error('Error transferring points', { 
        fromUserId, 
        toUserId, 
        amount, 
        error 
      });
      throw error;
    }
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
      'content_featured'
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
      'competition_prize': 'Competition prize'
    };
    
    return descriptions[source] || `Points awarded for ${source}`;
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
   * Record suspicious activity for further review
   * 
   * @param userId User ID
   * @param source Points source
   * @param reason Reason for suspicion
   */
  private async recordSuspiciousActivity(userId: string, source: PointsSource, reason: string): Promise<void> {
    // This would typically write to a separate table for review
    // For now, we'll just log it
    logger.warn('Suspicious activity recorded', { 
      userId, 
      source, 
      reason,
      timestamp: new Date().toISOString()
    });
    
    // In a real implementation, this might trigger admin notifications
    // or automatic restrictions based on severity
  }

  /**
   * Check if user has leveled up based on points
   * 
   * @param userId User ID
   * @param total Current points total
   */
  private async checkForLevelUp(userId: string, total: number): Promise<void> {
    // This is a simplified implementation
    // A real implementation would fetch current level and check level thresholds
    
    // Level thresholds (simplified example)
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
    
    // In a real implementation, we would check the current level and update if needed
    // For now, just log the potential level
    logger.debug(`User ${userId} qualifies for level ${newLevel} with ${total} points`);
    
    // TODO: Implement actual level update and event emission
  }
}
