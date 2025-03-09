import { PointsRepository } from '../repositories/points-repository';
import { EventEmitter, EventType } from '../lib/events';
import { TransactionManager } from '../lib/transaction';
import { 
  PointTransaction, 
  PointsSource, 
  DAILY_POINTS_LIMITS, 
  POINTS_VALUES 
} from '../models/points';
import { logger } from '../lib/logger';
import { ValidationError } from '../lib/errors';

/**
 * Service for handling points operations
 */
export class PointsService {
  constructor(
    private pointsRepository: PointsRepository,
    private eventEmitter: EventEmitter,
    private transactionManager: TransactionManager
  ) {
    // Register event handlers
    this.registerEventHandlers();
  }

  /**
   * Award points to a user
   */
  async awardPoints(
    userId: string,
    amount: number,
    source: PointsSource | string,
    options: {
      detail?: string;
      multiplier?: number;
      referenceId?: string;
      referenceType?: string;
    } = {}
  ): Promise<PointTransaction> {
    try {
      return await this.transactionManager.execute(async (transaction) => {
        // Validate amount
        if (amount <= 0) {
          throw new ValidationError('Points amount must be greater than zero');
        }

        // Check for daily limits to prevent abuse
        await this.enforcePointLimits(userId, source, amount, transaction);

        // Create transaction record
        const pointTransaction = await this.pointsRepository.createTransaction({
          userId,
          amount,
          source,
          detail: options.detail,
          multiplier: options.multiplier,
          referenceId: options.referenceId,
          referenceType: options.referenceType
        }, transaction);

        // Update user's total points
        await this.pointsRepository.updateUserPoints(userId, amount, transaction);

        // Get updated points balance
        const newBalance = await this.pointsRepository.getUserPointsBalance(userId, transaction);

        // Emit point awarded event
        await this.eventEmitter.emit(EventType.POINTS_AWARDED, {
          userId,
          amount,
          source,
          multiplier: options.multiplier || 1,
          totalPoints: newBalance.totalPoints,
          level: newBalance.level,
          timestamp: new Date().toISOString()
        });

        return pointTransaction;
      });
    } catch (error) {
      logger.error({ error, userId, amount, source }, 'Error awarding points');
      throw error;
    }
  }

  /**
   * Award points for a specific event type
   */
  async awardPointsForEvent(
    eventType: EventType,
    data: any
  ): Promise<void> {
    try {
      // Extract user ID from event data
      const userId = data.userId || data.creatorId || data.followerId;

      if (!userId) {
        logger.warn({ eventType, data }, 'No userId found in event data for points award');
        return;
      }

      // Determine points source based on event type
      let source: PointsSource;
      let pointAmount: number;
      let referenceId: string | undefined;
      let referenceType: string | undefined;
      let detail: string | undefined;

      switch (eventType) {
        case EventType.BATTLE_ENTRY_SUBMITTED:
          source = PointsSource.BATTLE_PARTICIPATION;
          pointAmount = POINTS_VALUES[PointsSource.BATTLE_PARTICIPATION];
          referenceId = data.battleId;
          referenceType = 'battle';
          detail = `Participated in battle ${data.battleId}`;
          break;

        case EventType.BATTLE_COMPLETED:
          // Points for winning
          if (data.winnerId === userId) {
            source = PointsSource.BATTLE_WIN;
            pointAmount = POINTS_VALUES[PointsSource.BATTLE_WIN];
            referenceId = data.battleId;
            referenceType = 'battle';
            detail = `Won battle ${data.battleId}`;
          } else {
            // No points for non-winners in this event
            return;
          }
          break;

        case EventType.CONTENT_CREATED:
          source = PointsSource.CONTENT_CREATION;
          pointAmount = POINTS_VALUES[PointsSource.CONTENT_CREATION];
          referenceId = data.contentId;
          referenceType = 'content';
          detail = `Created content ${data.contentId}`;
          break;

        case EventType.CONTENT_REACTION_ADDED:
          source = PointsSource.CONTENT_ENGAGEMENT;
          pointAmount = POINTS_VALUES[PointsSource.CONTENT_ENGAGEMENT];
          referenceId = data.contentId;
          referenceType = 'content';
          detail = `Reacted to content ${data.contentId}`;
          break;

        case EventType.CONTENT_COMMENT_ADDED:
          source = PointsSource.CONTENT_ENGAGEMENT;
          pointAmount = POINTS_VALUES[PointsSource.CONTENT_ENGAGEMENT];
          referenceId = data.commentId;
          referenceType = 'comment';
          detail = `Commented on content ${data.contentId}`;
          break;

        case EventType.ACHIEVEMENT_UNLOCKED:
          // Points for achievements are awarded with the achievement itself
          // This is handled separately in the AchievementService
          return;

        case EventType.USER_REGISTERED:
          source = PointsSource.PROFILE_COMPLETION;
          pointAmount = POINTS_VALUES[PointsSource.PROFILE_COMPLETION] / 2; // Half for registration
          detail = 'Account creation';
          break;

        case EventType.WALLET_CONNECTED:
          source = PointsSource.WALLET_CONNECTION;
          pointAmount = POINTS_VALUES[PointsSource.WALLET_CONNECTION];
          referenceId = data.walletAddress;
          referenceType = 'wallet';
          detail = 'Connected wallet';
          break;

        default:
          // No points for other event types
          return;
      }

      // Award points
      await this.awardPoints(userId, pointAmount, source, {
        detail,
        referenceId,
        referenceType
      });
    } catch (error) {
      logger.error({ error, eventType, data }, 'Error awarding points for event');
    }
  }

  /**
   * Get user's points balance
   */
  async getUserPointsBalance(userId: string) {
    return this.pointsRepository.getUserPointsBalance(userId);
  }

  /**
   * Get user's points transactions
   */
  async getUserTransactions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      source?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    return this.pointsRepository.getUserTransactions(userId, options);
  }

  /**
   * Enforce daily point limits for a source
   */
  private async enforcePointLimits(
    userId: string,
    source: string,
    amount: number,
    transaction?: any
  ): Promise<void> {
    // Get source-specific daily limit
    const limit = DAILY_POINTS_LIMITS[source as PointsSource];

    // If no limit defined or it's infinite, no need to check
    if (!limit || limit === Infinity) {
      return;
    }

    // Get points awarded today for this source
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pointsToday = await this.pointsRepository.sumPointsBySourceAndDate(
      userId, source, today, transaction
    );

    // Check if this would exceed the daily limit
    if (pointsToday + amount > limit) {
      const allowed = Math.max(0, limit - pointsToday);
      
      if (allowed > 0) {
        // Can award partial points
        logger.info({
          userId,
          source,
          partialAward: true,
          requestedAmount: amount,
          allowedAmount: allowed
        }, 'Partial points award due to daily limit');

        // This will be used instead of the original amount
        return;
      } else {
        // Cannot award any points
        throw new ValidationError(
          `Daily limit reached for ${source}`,
          { 
            limit, 
            awarded: pointsToday,
            requested: amount
          }
        );
      }
    }
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers() {
    // Battle events
    this.eventEmitter.on(EventType.BATTLE_ENTRY_SUBMITTED, data => 
      this.awardPointsForEvent(EventType.BATTLE_ENTRY_SUBMITTED, data));
    
    this.eventEmitter.on(EventType.BATTLE_COMPLETED, data => 
      this.awardPointsForEvent(EventType.BATTLE_COMPLETED, data));

    // Content events
    this.eventEmitter.on(EventType.CONTENT_CREATED, data => 
      this.awardPointsForEvent(EventType.CONTENT_CREATED, data));
    
    this.eventEmitter.on(EventType.CONTENT_REACTION_ADDED, data => 
      this.awardPointsForEvent(EventType.CONTENT_REACTION_ADDED, data));
    
    this.eventEmitter.on(EventType.CONTENT_COMMENT_ADDED, data => 
      this.awardPointsForEvent(EventType.CONTENT_COMMENT_ADDED, data));

    // User events
    this.eventEmitter.on(EventType.USER_REGISTERED, data => 
      this.awardPointsForEvent(EventType.USER_REGISTERED, data));
    
    this.eventEmitter.on(EventType.WALLET_CONNECTED, data => 
      this.awardPointsForEvent(EventType.WALLET_CONNECTED, data));
  }
}
