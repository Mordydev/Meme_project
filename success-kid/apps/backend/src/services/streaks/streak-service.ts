/**
 * Streak Service
 * 
 * Manages user activity streaks and milestone rewards
 */
import { Pool } from 'pg';
import { Streak, StreakType } from '../../models/streak';
import { StreakRepository } from '../../repositories/streak-repository';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { PointsService } from '../points';
import { NotificationService } from '../notifications';
import { getUserTimezone, getCurrentDateInTimezone, getPreviousDay, isSameDay, isWithinGracePeriod } from '../../lib/date-utils';

export interface StreakUpdate {
  currentStreak: number;
  streakUpdated: boolean;
  lastActivityDate: Date;
  milestoneReached?: number;
  gracePeriodUsed?: boolean;
}

export interface StreakStatus {
  streakId: string;
  userId: string;
  activityType: StreakType;
  currentCount: number;
  longestCount: number;
  lastActivityDate: Date | null;
  nextMilestone: number;
  milestoneProgress: number;
  streakBonuses: Record<number, number>;
}

export class StreakService {
  private repository: StreakRepository;
  private pointsService: PointsService;
  private eventBus: EventBus;
  private notificationService: NotificationService;
  private db: Pool;
  
  // Streak milestone definitions
  private readonly STREAK_MILESTONES = [3, 5, 7, 14, 21, 30, 60, 90, 180, 365];
  
  // Streak bonus points by streak length
  private readonly STREAK_BONUSES: Record<number, number> = {
    3: 30,   // 3 days: 30 points
    5: 50,   // 5 days: 50 points
    7: 100,  // 7 days: 100 points
    14: 200, // 14 days: 200 points
    21: 300, // 21 days: 300 points
    30: 500, // 30 days: 500 points
    60: 1000, // 60 days: 1000 points
    90: 1500, // 90 days: 1500 points
    180: 3000, // 180 days: 3000 points
    365: 10000 // 365 days: 10000 points
  };
  
  // Grace period in hours
  private readonly GRACE_PERIOD_HOURS = 12;
  
  constructor(
    db: Pool,
    repository: StreakRepository,
    pointsService: PointsService,
    eventBus: EventBus,
    notificationService: NotificationService
  ) {
    this.db = db;
    this.repository = repository;
    this.pointsService = pointsService;
    this.eventBus = eventBus;
    this.notificationService = notificationService;
  }
  
  /**
   * Get all active streaks for a user
   */
  async getUserStreaks(userId: string): Promise<StreakStatus[]> {
    try {
      const streaks = await this.repository.getUserStreaks(userId);
      
      // If no streaks are found, initialize them
      if (streaks.length === 0) {
        await this.initializeUserStreaks(userId);
        return this.getUserStreaks(userId);
      }
      
      // Enhance streaks with milestone info
      return streaks.map(streak => {
        const nextMilestone = this.getNextMilestone(streak.current_count);
        
        return {
          streakId: streak.id,
          userId: streak.user_id,
          activityType: streak.activity_type,
          currentCount: streak.current_count,
          longestCount: streak.longest_count,
          lastActivityDate: streak.last_activity_date,
          nextMilestone,
          milestoneProgress: nextMilestone ? 
            Math.round((streak.current_count / nextMilestone) * 100) : 100,
          streakBonuses: this.STREAK_BONUSES
        };
      });
    } catch (error) {
      logger.error('Error getting user streaks', { error, userId });
      throw error;
    }
  }
  
  /**
   * Initialize streaks for a new user
   */
  async initializeUserStreaks(userId: string): Promise<void> {
    try {
      // Initialize common streak types
      await this.repository.initializeUserStreak(userId, StreakType.DAILY_LOGIN);
      await this.repository.initializeUserStreak(userId, StreakType.CONTENT_CREATION);
      await this.repository.initializeUserStreak(userId, StreakType.ENGAGEMENT);
      
      logger.info('Initialized user streaks', { userId });
    } catch (error) {
      logger.error('Error initializing user streaks', { error, userId });
      throw error;
    }
  }
  
  /**
   * Record activity to update user streak
   */
  async recordActivity(
    userId: string, 
    activityType: StreakType
  ): Promise<StreakUpdate> {
    try {
      logger.debug('Recording activity for streak', { userId, activityType });
      
      return this.repository.executeTransaction(async (client) => {
        // Get the user's streak for this activity type
        const streak = await this.repository.getUserStreakWithClient(
          client, 
          userId, 
          activityType
        );
        
        if (!streak) {
          // Initialize streak if it doesn't exist
          const newStreak = await this.repository.initializeUserStreakWithClient(
            client,
            userId,
            activityType
          );
          
          // Create first activity
          const now = new Date();
          await this.repository.updateStreakWithClient(client, {
            id: newStreak.id,
            currentCount: 1,
            longestCount: 1,
            lastActivityDate: now
          });
          
          return {
            currentStreak: 1,
            streakUpdated: true,
            lastActivityDate: now
          };
        }
        
        // Get user's timezone preference
        const userTimezone = await getUserTimezone(userId);
        
        // Get current date in user's timezone
        const today = getCurrentDateInTimezone(userTimezone);
        
        // Get previous day
        const yesterdayDate = getPreviousDay(today, userTimezone);
        
        // Check if already recorded today
        if (streak.last_activity_date && isSameDay(streak.last_activity_date, today)) {
          // Already recorded today, no streak change
          return {
            currentStreak: streak.current_count,
            streakUpdated: false,
            lastActivityDate: today
          };
        }
        
        // Check if continuing streak (last activity was yesterday)
        const continuingStreak = streak.last_activity_date && 
                                 isSameDay(streak.last_activity_date, yesterdayDate);
        
        // Apply grace period logic if configured
        const gracePeriodActive = !continuingStreak && 
                                  isWithinGracePeriod(
                                    streak.last_activity_date, 
                                    today, 
                                    this.GRACE_PERIOD_HOURS
                                  );
        
        // Update streak
        const newStreakCount = (continuingStreak || gracePeriodActive) ? 
                              streak.current_count + 1 : 1;
        
        // Update longest streak if needed
        const newLongestStreak = Math.max(streak.longest_count, newStreakCount);
        
        // Update streak record
        await this.repository.updateStreakWithClient(client, {
          id: streak.id,
          currentCount: newStreakCount,
          longestCount: newLongestStreak,
          lastActivityDate: today
        });
        
        // Check for milestone
        const reachedMilestone = this.isStreakMilestone(newStreakCount);
        if (reachedMilestone) {
          await this.processStreakMilestone(
            client,
            userId,
            activityType,
            newStreakCount
          );
        }
        
        return {
          currentStreak: newStreakCount,
          streakUpdated: true,
          lastActivityDate: today,
          milestoneReached: reachedMilestone ? newStreakCount : undefined,
          gracePeriodUsed: gracePeriodActive
        };
      });
    } catch (error) {
      logger.error('Error recording activity for streak', { error, userId, activityType });
      throw error;
    }
  }
  
  /**
   * Check if the current streak count is a milestone
   */
  private isStreakMilestone(streakCount: number): boolean {
    return this.STREAK_MILESTONES.includes(streakCount);
  }
  
  /**
   * Get next milestone based on current streak
   */
  private getNextMilestone(currentStreak: number): number | null {
    const nextMilestone = this.STREAK_MILESTONES.find(m => m > currentStreak);
    return nextMilestone || null;
  }
  
  /**
   * Process streak milestone rewards
   */
  private async processStreakMilestone(
    client: any,
    userId: string,
    activityType: StreakType,
    streakCount: number
  ): Promise<void> {
    try {
      // Get bonus points for this milestone
      const bonusPoints = this.STREAK_BONUSES[streakCount] || 0;
      
      if (bonusPoints > 0) {
        // Award bonus points
        await this.pointsService.awardPointsWithTransaction(client, {
          userId,
          amount: bonusPoints,
          source: 'streak_milestone',
          referenceId: `${activityType}_${streakCount}`,
          description: `${streakCount}-day streak bonus (${activityType})`
        });
        
        // Create notification
        await this.notificationService.createNotificationWithTransaction(client, {
          userId,
          type: 'streak_milestone',
          title: 'Streak Milestone!',
          message: `You've maintained a ${streakCount}-day streak! Earned ${bonusPoints} bonus points.`,
          data: {
            streakType: activityType,
            streakCount,
            bonusPoints
          }
        });
        
        // Emit streak milestone event after transaction commits
        setTimeout(() => {
          this.eventBus.publish('streak:milestone', {
            userId,
            streakType: activityType,
            streakCount,
            bonusPoints,
            timestamp: new Date().toISOString()
          });
        }, 0);
      }
    } catch (error) {
      logger.error('Error processing streak milestone', { 
        error, 
        userId, 
        streakCount, 
        activityType 
      });
      throw error;
    }
  }
  
  /**
   * Get streak status for a specific activity type
   */
  async getStreakStatus(
    userId: string, 
    activityType: StreakType
  ): Promise<StreakStatus | null> {
    try {
      const streak = await this.repository.getUserStreak(userId, activityType);
      
      if (!streak) {
        return null;
      }
      
      const nextMilestone = this.getNextMilestone(streak.current_count);
      
      return {
        streakId: streak.id,
        userId: streak.user_id,
        activityType: streak.activity_type,
        currentCount: streak.current_count,
        longestCount: streak.longest_count,
        lastActivityDate: streak.last_activity_date,
        nextMilestone,
        milestoneProgress: nextMilestone ? 
          Math.round((streak.current_count / nextMilestone) * 100) : 100,
        streakBonuses: this.STREAK_BONUSES
      };
    } catch (error) {
      logger.error('Error getting streak status', { error, userId, activityType });
      throw error;
    }
  }
  
  /**
   * Reset streaks that have been broken (scheduled job)
   * Should be run daily at midnight
   */
  async resetBrokenStreaks(): Promise<number> {
    try {
      logger.info('Resetting broken streaks');
      
      return this.repository.executeTransaction(async (client) => {
        // Get all active streaks
        const activeStreaks = await this.repository.getAllActiveStreaksWithClient(client);
        
        let resetCount = 0;
        
        for (const streak of activeStreaks) {
          // Skip streaks with no last activity date
          if (!streak.last_activity_date) {
            continue;
          }
          
          // Get user's timezone
          const userTimezone = await getUserTimezone(streak.user_id);
          
          // Get current date in user's timezone
          const today = getCurrentDateInTimezone(userTimezone);
          
          // Get yesterday's date
          const yesterday = getPreviousDay(today, userTimezone);
          
          // Check if streak is broken (last activity not yesterday)
          const isStreakBroken = !isSameDay(streak.last_activity_date, yesterday) &&
                                 !isSameDay(streak.last_activity_date, today);
          
          if (isStreakBroken) {
            // Consider the grace period
            const isWithinGrace = isWithinGracePeriod(
              streak.last_activity_date,
              today,
              this.GRACE_PERIOD_HOURS
            );
            
            if (!isWithinGrace) {
              // Reset streak
              await this.repository.updateStreakWithClient(client, {
                id: streak.id,
                currentCount: 0,
                // Keep longest count
                longestCount: streak.longest_count,
                // Keep last activity date for reference
                lastActivityDate: streak.last_activity_date
              });
              
              resetCount++;
              
              // Notify user if streak was significant
              if (streak.current_count >= 3) {
                await this.notificationService.createNotificationWithTransaction(client, {
                  userId: streak.user_id,
                  type: 'streak_broken',
                  title: 'Streak Broken',
                  message: `Your ${streak.current_count}-day ${streak.activity_type} streak has been broken. Start a new streak today!`,
                  data: {
                    streakType: streak.activity_type,
                    streakCount: streak.current_count
                  }
                });
              }
            }
          }
        }
        
        logger.info('Reset broken streaks completed', { resetCount });
        return resetCount;
      });
    } catch (error) {
      logger.error('Error resetting broken streaks', { error });
      throw error;
    }
  }
}
