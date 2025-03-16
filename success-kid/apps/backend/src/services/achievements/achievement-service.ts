/**
 * Achievement Service
 * 
 * Core service for managing achievements, unlocking, and tracking progress
 */
import { Pool } from 'pg';
import { 
  Achievement, 
  AchievementTrigger,
} from '../../models/achievement';
import { UserAchievement } from '../../models/user-achievement';
import { AchievementRepository } from '../../repositories/achievement-repository';
import { AchievementRulesEngine } from './rules/engine';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { PointsService } from '../points';
import { NotificationService } from '../notifications';

export interface AchievementProgress {
  isComplete: boolean;
  progress: number; // 0-100 percentage
  criteriaProgress: Record<string, { current: number; target: number; complete: boolean }>;
}

export class AchievementService {
  private repository: AchievementRepository;
  private rulesEngine: AchievementRulesEngine;
  private pointsService: PointsService;
  private eventBus: EventBus;
  private notificationService: NotificationService;
  
  constructor(
    db: Pool,
    repository: AchievementRepository,
    rulesEngine: AchievementRulesEngine,
    pointsService: PointsService,
    eventBus: EventBus,
    notificationService: NotificationService
  ) {
    this.repository = repository;
    this.rulesEngine = rulesEngine;
    this.pointsService = pointsService;
    this.eventBus = eventBus;
    this.notificationService = notificationService;
    
    // Subscribe to relevant events
    this.subscribeToEvents();
  }
  
  /**
   * Subscribe to events that may trigger achievements
   */
  private subscribeToEvents(): void {
    // Content-related events
    this.eventBus.subscribe(EventType.CONTENT_CREATED, (data) => {
      this.processEvent(AchievementTrigger.CONTENT_CREATED, data);
    });
    
    this.eventBus.subscribe(EventType.CONTENT_COMMENTED, (data) => {
      this.processEvent(AchievementTrigger.CONTENT_COMMENTED, data);
    });
    
    this.eventBus.subscribe(EventType.COMMENT_CREATED, (data) => {
      this.processEvent(AchievementTrigger.COMMENT_CREATED, data);
    });
    
    // User-related events
    this.eventBus.subscribe(EventType.WALLET_CONNECTED, (data) => {
      this.processEvent(AchievementTrigger.WALLET_CONNECTED, data);
    });
    
    this.eventBus.subscribe(EventType.LEVEL_UP, (data) => {
      this.processEvent(AchievementTrigger.LEVEL_UP, data);
    });
    
    // Points-related events
    this.eventBus.subscribe(EventType.POINTS_AWARDED, (data) => {
      this.processEvent(AchievementTrigger.POINTS_AWARDED, data);
    });
    
    this.eventBus.subscribe(EventType.POINTS_REDEEMED, (data) => {
      this.processEvent(AchievementTrigger.POINTS_REDEEMED, data);
    });
    
    // Market-related events
    this.eventBus.subscribe(EventType.MARKET_MILESTONE_REACHED, (data) => {
      this.processEvent(AchievementTrigger.MARKET_MILESTONE, data);
    });
  }
  
  /**
   * Process event and check for achievement unlocks
   */
  async processEvent(
    triggerEvent: AchievementTrigger, 
    eventData: any
  ): Promise<void> {
    try {
      logger.debug('Processing event for achievements', { triggerEvent });
      
      // Extract user ID from event data
      const userId = eventData.userId;
      if (!userId) {
        logger.warn('No user ID found in event data', { triggerEvent, eventData });
        return;
      }
      
      // Find achievements that might be triggered by this event
      const achievements = await this.repository.findByEventType(triggerEvent);
      
      logger.debug('Found potential achievements', { 
        triggerEvent, 
        achievementCount: achievements.length 
      });
      
      // Process each achievement
      for (const achievement of achievements) {
        await this.checkAndUnlockAchievement(userId, achievement, triggerEvent, eventData);
      }
    } catch (error) {
      logger.error('Error processing event for achievements', { 
        error, 
        triggerEvent, 
        eventData 
      });
    }
  }
  
  /**
   * Check and unlock a single achievement if criteria are met
   */
  async checkAndUnlockAchievement(
    userId: string,
    achievement: Achievement,
    triggerEvent: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    try {
      // Check if achievement is already unlocked
      const isUnlocked = await this.repository.isAchievementUnlocked(userId, achievement.id);
      
      if (isUnlocked) {
        logger.debug('Achievement already unlocked', { 
          userId, 
          achievementId: achievement.id 
        });
        return false;
      }
      
      // Check if achievement criteria are met
      const isComplete = await this.rulesEngine.evaluateAchievement(
        userId,
        achievement,
        triggerEvent,
        eventData
      );
      
      if (isComplete) {
        await this.unlockAchievement(userId, achievement);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking achievement', { 
        error, 
        userId, 
        achievementId: achievement.id 
      });
      return false;
    }
  }
  
  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(
    userId: string, 
    achievement: Achievement
  ): Promise<UserAchievement> {
    try {
      logger.info('Unlocking achievement', { 
        userId, 
        achievementId: achievement.id,
        name: achievement.name
      });
      
      // Record the achievement unlock
      const userAchievement = await this.repository.createUserAchievement({
        user_id: userId,
        achievement_id: achievement.id,
        unlocked_at: new Date()
      });
      
      // Award points if applicable
      if (achievement.points_reward > 0) {
        await this.pointsService.awardPoints({
          userId,
          amount: achievement.points_reward,
          source: 'achievement',
          referenceId: achievement.id,
          description: `Achievement: ${achievement.name}`
        });
      }
      
      // Send notification
      await this.notificationService.createNotification({
        userId,
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked!',
        message: `You earned the "${achievement.name}" achievement`,
        data: {
          achievementId: achievement.id,
          name: achievement.name,
          description: achievement.description,
          imageUrl: achievement.image_url,
          pointsAwarded: achievement.points_reward,
          difficulty: achievement.difficulty
        }
      });
      
      // Emit achievement unlocked event
      this.eventBus.publish(EventType.ACHIEVEMENT_UNLOCKED, {
        userId,
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          imageUrl: achievement.image_url,
          difficulty: achievement.difficulty,
          category: achievement.category,
          pointsAwarded: achievement.points_reward
        },
        unlockedAt: userAchievement.unlocked_at
      });
      
      return userAchievement;
    } catch (error) {
      logger.error('Error unlocking achievement', { 
        error, 
        userId, 
        achievementId: achievement.id 
      });
      throw error;
    }
  }
  
  /**
   * Get all achievements
   */
  async getAchievements(): Promise<Achievement[]> {
    try {
      return this.repository.findAll();
    } catch (error) {
      logger.error('Error getting achievements', { error });
      throw error;
    }
  }
  
  /**
   * Get a specific achievement by ID
   */
  async getAchievement(id: string): Promise<Achievement | null> {
    try {
      return this.repository.findById(id);
    } catch (error) {
      logger.error('Error getting achievement', { error, id });
      throw error;
    }
  }
  
  /**
   * Get all achievements with progress for a user
   */
  async getUserAchievementsWithProgress(userId: string): Promise<{
    achievement: Achievement;
    unlocked: boolean;
    progress: AchievementProgress;
    unlockedAt?: Date;
  }[]> {
    try {
      const achievementsWithProgress = await this.repository.getAllAchievementsWithProgress(userId);
      
      // Enhance with detailed progress information
      const result = await Promise.all(
        achievementsWithProgress.map(async ({ achievement, unlocked, unlockedAt }) => {
          const progress = unlocked 
            ? {
                isComplete: true,
                progress: 100,
                criteriaProgress: {}
              }
            : await this.rulesEngine.getAchievementProgress(userId, achievement);
          
          return {
            achievement,
            unlocked,
            progress,
            unlockedAt
          };
        })
      );
      
      return result;
    } catch (error) {
      logger.error('Error getting user achievements with progress', { error, userId });
      throw error;
    }
  }
  
  /**
   * Get a user's achievement summary
   */
  async getUserAchievementSummary(userId: string): Promise<{
    total: number;
    byDifficulty: Record<string, number>;
    byCategory: Record<string, number>;
    recentlyUnlocked: {
      id: string;
      name: string;
      difficulty: string;
      unlockedAt: Date;
    }[];
  }> {
    try {
      return this.repository.getUserAchievementSummary(userId);
    } catch (error) {
      logger.error('Error getting user achievement summary', { error, userId });
      throw error;
    }
  }
  
  /**
   * Get achievement stats for the platform
   */
  async getAchievementStats(): Promise<{
    achievementId: string;
    name: string;
    category: string;
    unlockCount: number;
    unlockRate: number;
  }[]> {
    try {
      return this.repository.getAchievementStats();
    } catch (error) {
      logger.error('Error getting achievement stats', { error });
      throw error;
    }
  }
  
  /**
   * Reset achievement for testing or admin purposes
   */
  async resetAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      return this.repository.deleteUserAchievement(userId, achievementId);
    } catch (error) {
      logger.error('Error resetting achievement', { error, userId, achievementId });
      throw error;
    }
  }
}
