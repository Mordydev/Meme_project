/**
 * Streak Service
 * 
 * Service for managing user activity streaks, streak rewards, and streak tracking.
 */
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { StreakRepository } from '../../repositories/achievement/streak-repository';
import { PointsService } from '../points/points-service';
import {
  StreakDefinition,
  UserStreak,
  StreakUpdate,
  StreakStatus,
  StreakActivityType,
  ActivityData,
  StreakMilestoneEvent,
  DEFAULT_STREAK_THRESHOLDS
} from '../../models/entities/achievement/streak.model';
import { NotFoundError } from '../../errors';

/**
 * Service for managing user streaks
 */
export class StreakService {
  /**
   * Create a new StreakService
   * 
   * @param streakRepository Repository for streak data access
   * @param pointsService Service for awarding points
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private streakRepository: StreakRepository,
    private pointsService: PointsService,
    private eventBus: EventBus
  ) {
    this.initializeStreaks().catch(error => {
      logger.error('Failed to initialize streak definitions', { error });
    });
    
    // Schedule streak reset job
    this.scheduleStreakReset();
  }

  /**
   * Initialize streak definitions if they don't exist
   */
  private async initializeStreaks(): Promise<void> {
    await this.streakRepository.initializeStreakDefinitions();
  }

  /**
   * Schedule daily job to reset expired streaks
   */
  private scheduleStreakReset(): void {
    // Run every day at midnight
    const resetInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    const resetStreaks = async () => {
      try {
        const resetCount = await this.streakRepository.resetExpiredStreaks();
        logger.info(`Reset ${resetCount} expired streaks`);
      } catch (error) {
        logger.error('Error resetting expired streaks', { error });
      }
      
      // Schedule next reset
      setTimeout(resetStreaks, resetInterval);
    };
    
    // Calculate time until midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    
    // Schedule first reset
    setTimeout(resetStreaks, timeUntilMidnight);
    
    logger.info(`Scheduled streak reset job, first run in ${timeUntilMidnight / (60 * 1000)} minutes`);
  }

  /**
   * Get all streak definitions
   * 
   * @returns Array of streak definitions
   */
  async getStreakDefinitions(): Promise<StreakDefinition[]> {
    try {
      return this.streakRepository.getAllStreakDefinitions();
    } catch (error) {
      logger.error('Error getting streak definitions', { error });
      throw error;
    }
  }

  /**
   * Get streak definition by ID
   * 
   * @param id Streak definition ID
   * @returns Streak definition
   */
  async getStreakDefinition(id: string): Promise<StreakDefinition | null> {
    try {
      return this.streakRepository.getStreakDefinition(id);
    } catch (error) {
      logger.error('Error getting streak definition', { id, error });
      throw error;
    }
  }

  /**
   * Get user's streaks
   * 
   * @param userId User ID
   * @returns Array of user streaks with streak definitions
   */
  async getUserStreaks(userId: string): Promise<any[]> {
    try {
      return this.streakRepository.getUserStreaks(userId);
    } catch (error) {
      logger.error('Error getting user streaks', { userId, error });
      throw error;
    }
  }

  /**
   * Get user's streaks for a specific activity type
   * 
   * @param userId User ID
   * @param activityType Activity type
   * @returns Array of user streaks for the activity type
   */
  async getUserStreaksByActivity(
    userId: string,
    activityType: StreakActivityType
  ): Promise<any[]> {
    try {
      return this.streakRepository.getUserStreaksByActivity(userId, activityType);
    } catch (error) {
      logger.error('Error getting user streaks by activity', { userId, activityType, error });
      throw error;
    }
  }

  /**
   * Get status of a user's streak
   * 
   * @param userId User ID
   * @param streakId Streak definition ID
   * @returns Streak status
   */
  async getStreakStatus(userId: string, streakId: string): Promise<StreakStatus | null> {
    try {
      // Get the streak definition
      const streakDef = await this.streakRepository.getStreakDefinition(streakId);
      if (!streakDef) {
        throw new NotFoundError('Streak definition not found');
      }
      
      // Get the user's streak
      const userStreak = await this.streakRepository.getUserStreak(userId, streakId);
      if (!userStreak) {
        // User hasn't started this streak yet
        return {
          userId,
          streakId,
          activityType: streakDef.activity_type,
          currentCount: 0,
          longestCount: 0,
          lastActivityDate: null,
          nextMilestone: DEFAULT_STREAK_THRESHOLDS[0]?.count,
          pointsForNextMilestone: DEFAULT_STREAK_THRESHOLDS[0]?.bonus_points,
          isActiveToday: false
        };
      }
      
      // Check if streak is active today
      const isActiveToday = userStreak.last_activity_date ? 
        this.isSameDay(userStreak.last_activity_date, new Date()) : 
        false;
      
      // Find next milestone
      const nextMilestone = streakDef.thresholds.find(
        t => t.count > userStreak.current_count
      );
      
      return {
        userId,
        streakId,
        activityType: streakDef.activity_type,
        currentCount: userStreak.current_count,
        longestCount: userStreak.longest_count,
        lastActivityDate: userStreak.last_activity_date,
        nextMilestone: nextMilestone?.count,
        pointsForNextMilestone: nextMilestone?.bonus_points,
        isActiveToday
      };
    } catch (error) {
      logger.error('Error getting streak status', { userId, streakId, error });
      throw error;
    }
  }

  /**
   * Record user activity for streak tracking
   * 
   * @param data Activity data
   * @returns Object with streak update information
   */
  async recordActivity(data: ActivityData): Promise<StreakUpdate> {
    try {
      const { userId, activityType } = data;
      
      // Record the activity and get update info
      const result = await this.streakRepository.recordActivity(data);
      
      // If a milestone was reached, award points and emit event
      if (result.newMilestoneReached) {
        // Get the streak definition
        const streakDefs = await this.streakRepository.getStreakDefinitionsByActivity(activityType);
        
        if (streakDefs.length > 0) {
          // Find the streak definition with this milestone
          const streakDef = streakDefs.find(def => 
            def.thresholds.some(t => t.count === result.newMilestoneReached)
          );
          
          if (streakDef) {
            // Find the milestone threshold
            const threshold = streakDef.thresholds.find(
              t => t.count === result.newMilestoneReached
            );
            
            if (threshold) {
              // Award bonus points
              await this.pointsService.awardPoints({
                userId,
                amount: threshold.bonus_points,
                source: 'streak_bonus',
                referenceId: `${streakDef.id}_${result.newMilestoneReached}`,
                description: `${result.newMilestoneReached}-day streak bonus`
              });
              
              // Emit streak milestone event
              const milestoneEvent: StreakMilestoneEvent = {
                userId,
                streakId: streakDef.id,
                activityType,
                streakCount: result.newMilestoneReached,
                bonusPoints: threshold.bonus_points,
                timestamp: new Date()
              };
              
              await this.eventBus.publish('streak.milestone', milestoneEvent);
              
              logger.info(`Streak milestone reached`, {
                userId,
                activityType,
                milestone: result.newMilestoneReached,
                bonusPoints: threshold.bonus_points
              });
            }
          }
        }
      }
      
      return {
        currentStreak: result.currentCount,
        streakUpdated: result.streakUpdated,
        lastActivityDate: new Date(),
        milestoneReached: result.newMilestoneReached,
        gracePeriodUsed: result.gracePeriodUsed
      };
    } catch (error) {
      logger.error('Error recording activity', { data, error });
      throw error;
    }
  }

  /**
   * Create a new streak definition
   * 
   * @param data Streak definition data
   * @returns Created streak definition
   */
  async createStreakDefinition(
    data: Omit<StreakDefinition, 'id' | 'created_at' | 'updated_at'>
  ): Promise<StreakDefinition> {
    try {
      return this.streakRepository.createStreakDefinition(data);
    } catch (error) {
      logger.error('Error creating streak definition', { data, error });
      throw error;
    }
  }

  /**
   * Check if two dates are on the same day
   * 
   * @param date1 First date
   * @param date2 Second date
   * @returns True if dates are on the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}
