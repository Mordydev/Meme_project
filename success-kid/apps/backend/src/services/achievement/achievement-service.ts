/**
 * Achievement Service
 * 
 * Service for managing achievements, achievement rules, and user achievement tracking.
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { AchievementRepository } from '../../repositories/achievement/achievement-repository';
import { EnhancedPointsService } from '../points/points-service-enhanced';
import { NotificationService } from '../notifications/notification-service';
import { 
  Achievement, 
  AchievementFilter, 
  AchievementProgress,
  UserAchievement,
  AchievementUnlockedEvent,
  AchievementCriteria
} from '../../models/entities/achievement/achievement.model';
import { AchievementRulesEngine } from './rules/achievement-rules-engine';
import { NotFoundError } from '../../errors';

/**
 * Service for managing achievement functionality
 */
export class AchievementService {
  private rulesEngine: AchievementRulesEngine;

  /**
   * Create a new AchievementService
   * 
   * @param achievementRepository Repository for achievement data access
   * @param eventBus Event bus for publishing events
   * @param pointsService Service for awarding points
   * @param notificationService Service for sending notifications
   */
  constructor(
    private achievementRepository: AchievementRepository,
    private eventBus: EventBus,
    private pointsService: EnhancedPointsService,
    private notificationService: NotificationService
  ) {
    this.rulesEngine = new AchievementRulesEngine();
    this.subscribeToEvents();
  }

  /**
   * Subscribe to relevant events that may trigger achievements
   */
  private subscribeToEvents(): void {
    // Common events that may trigger achievements
    const events = [
      'content.created',
      'content.commented',
      'points.awarded',
      'profile.updated',
      'wallet.connected',
      'streak.milestone',
      'user.levelUp',
      'referral.completed'
    ];

    // Subscribe to each event
    events.forEach(eventType => {
      this.eventBus.subscribe(eventType, (eventData) => {
        // Process the event
        this.processEvent(eventType, eventData).catch(error => {
          logger.error(`Error processing event ${eventType} for achievements`, { error });
        });
      });
    });

    // Listen for explicit achievement check requests
    this.eventBus.subscribe('achievement.check', (eventData) => {
      const { userId, eventType, data } = eventData;
      this.checkAchievementsForUser(userId, eventType, data).catch(error => {
        logger.error('Error checking achievements', { userId, eventType, error });
      });
    });
  }

  /**
   * Process an event and check for achievement unlocks
   * 
   * @param eventType Type of event
   * @param eventData Event data
   */
  private async processEvent(eventType: string, eventData: any): Promise<void> {
    // Extract user ID from event data
    const userId = eventData.userId;
    if (!userId) {
      logger.warn(`No user ID in event data for ${eventType}`, { eventData });
      return;
    }

    // Check achievements for this user and event
    await this.checkAchievementsForUser(userId, eventType, eventData);
  }

  /**
   * Check if a user has unlocked any achievements based on an event
   * 
   * @param userId User ID
   * @param eventType Type of event
   * @param eventData Event data
   * @returns Array of unlocked achievements
   */
  async checkAchievementsForUser(
    userId: string,
    eventType: string,
    eventData: any
  ): Promise<Achievement[]> {
    try {
      // Find achievements that could be triggered by this event type
      const achievements = await this.achievementRepository.findByEventType(eventType);
      
      if (achievements.length === 0) {
        return [];
      }

      logger.debug(`Checking ${achievements.length} achievements for event ${eventType}`, { userId });
      
      const unlockedAchievements: Achievement[] = [];

      // Process each achievement
      for (const achievement of achievements) {
        // Check if already unlocked
        const isUnlocked = await this.achievementRepository.isAchievementUnlocked(userId, achievement.id);
        if (isUnlocked) {
          continue;
        }

        // Evaluate achievement rules
        const progress = await this.evaluateAchievementProgress(userId, achievement, eventType, eventData);
        
        // Update progress
        await this.achievementRepository.updateAchievementProgress(userId, achievement.id, {
          currentValue: progress.currentValue,
          targetValue: progress.targetValue,
          percentComplete: progress.percentComplete,
          lastUpdated: new Date()
        });

        // Check if achievement is complete
        if (progress.isComplete) {
          await this.unlockAchievement(userId, achievement);
          unlockedAchievements.push(achievement);
        }
      }

      return unlockedAchievements;
    } catch (error) {
      logger.error('Error checking achievements for user', { userId, eventType, error });
      return [];
    }
  }

  /**
   * Evaluate a user's progress for an achievement
   * 
   * @param userId User ID
   * @param achievement Achievement to evaluate
   * @param eventType Current event type
   * @param eventData Current event data
   * @returns Achievement progress
   */
  private async evaluateAchievementProgress(
    userId: string,
    achievement: Achievement,
    eventType: string,
    eventData: any
  ): Promise<AchievementProgress> {
    // Get current progress
    const currentProgress = await this.achievementRepository.getAchievementProgress(userId, achievement.id);
    
    if (!currentProgress) {
      // No progress yet, initialize with default values
      return {
        currentValue: 0,
        targetValue: this.getTargetValueFromRequirements(achievement.requirements),
        percentComplete: 0,
        isComplete: false
      };
    }

    // Use rules engine to evaluate progress
    const updatedProgress = await this.rulesEngine.evaluateProgress(
      userId,
      achievement,
      currentProgress,
      eventType,
      eventData
    );

    return updatedProgress;
  }

  /**
   * Get target value from achievement requirements
   * 
   * @param requirements Achievement requirements
   * @returns Target value for progress tracking
   */
  private getTargetValueFromRequirements(requirements: AchievementCriteria[]): number {
    // For count-based requirements, use the target value
    const countRequirement = requirements.find(r => r.type === 'count');
    if (countRequirement && countRequirement.targetValue) {
      return countRequirement.targetValue;
    }

    // For aggregate requirements, use the target value
    const aggregateRequirement = requirements.find(r => r.type === 'aggregate');
    if (aggregateRequirement && aggregateRequirement.targetValue) {
      return aggregateRequirement.targetValue;
    }

    // For streak requirements, use the target value
    const streakRequirement = requirements.find(r => r.type === 'streak');
    if (streakRequirement && streakRequirement.targetValue) {
      return streakRequirement.targetValue;
    }

    // For boolean requirements, target is 1 (done or not done)
    const booleanRequirement = requirements.find(r => r.type === 'boolean');
    if (booleanRequirement) {
      return 1;
    }

    // Default target value
    return 1;
  }

  /**
   * Unlock an achievement for a user
   * 
   * @param userId User ID
   * @param achievement Achievement to unlock
   */
  private async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    try {
      // Create record of achievement unlock
      const userAchievement = await this.achievementRepository.unlockAchievement(userId, achievement.id);

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

      // Emit achievement unlocked event
      const event: AchievementUnlockedEvent = {
        userId,
        achievementId: achievement.id,
        achievement: {
          name: achievement.name,
          description: achievement.description,
          imageUrl: achievement.image_url,
          difficulty: achievement.difficulty,
          pointsRewarded: achievement.points_reward,
          category: achievement.category
        },
        unlockedAt: new Date()
      };

      await this.eventBus.publish(EventType.ACHIEVEMENT_UNLOCKED, event);

      logger.info(`Achievement unlocked for user`, { 
        userId, 
        achievementId: achievement.id, 
        name: achievement.name 
      });
    } catch (error) {
      logger.error('Error unlocking achievement', { userId, achievementId: achievement.id, error });
      throw error;
    }
  }

  /**
   * Get all achievements
   * 
   * @param filter Optional filter criteria
   * @returns Array of achievements
   */
  async getAchievements(filter?: AchievementFilter): Promise<Achievement[]> {
    try {
      if (filter) {
        return this.achievementRepository.findByFilter(filter);
      } else {
        return this.achievementRepository.findByFilter({});
      }
    } catch (error) {
      logger.error('Error getting achievements', { filter, error });
      throw error;
    }
  }

  /**
   * Get achievement by ID
   * 
   * @param id Achievement ID
   * @returns Achievement or null if not found
   */
  async getAchievementById(id: string): Promise<Achievement | null> {
    try {
      return this.achievementRepository.findById(id);
    } catch (error) {
      logger.error('Error getting achievement by ID', { id, error });
      throw error;
    }
  }

  /**
   * Get user's achievements
   * 
   * @param userId User ID
   * @param includeProgress Whether to include progress for incomplete achievements
   * @returns Array of user achievements
   */
  async getUserAchievements(userId: string, includeProgress: boolean = false): Promise<any[]> {
    try {
      return this.achievementRepository.getUserAchievements(userId, includeProgress);
    } catch (error) {
      logger.error('Error getting user achievements', { userId, error });
      throw error;
    }
  }

  /**
   * Get achievement progress for a user
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns Achievement progress or null if not found
   */
  async getAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<AchievementProgress | null> {
    try {
      return this.achievementRepository.getAchievementProgress(userId, achievementId);
    } catch (error) {
      logger.error('Error getting achievement progress', { userId, achievementId, error });
      throw error;
    }
  }

  /**
   * Create a new achievement
   * 
   * @param data Achievement data
   * @returns Created achievement
   */
  async createAchievement(
    data: Omit<Achievement, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Achievement> {
    try {
      return this.achievementRepository.createAchievement(data);
    } catch (error) {
      logger.error('Error creating achievement', { data, error });
      throw error;
    }
  }

  /**
   * Manually unlock an achievement for a user (admin function)
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns Unlocked user achievement
   */
  async manuallyUnlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    try {
      // Check if achievement exists
      const achievement = await this.achievementRepository.findById(achievementId);
      if (!achievement) {
        throw new NotFoundError('Achievement not found');
      }

      // Unlock the achievement
      const userAchievement = await this.achievementRepository.unlockAchievement(userId, achievementId);

      // Award points
      if (achievement.points_reward > 0) {
        await this.pointsService.awardPoints({
          userId,
          amount: achievement.points_reward,
          source: 'achievement',
          referenceId: achievement.id,
          description: `Achievement (manual): ${achievement.name}`
        });
      }

      // Emit event
      const event: AchievementUnlockedEvent = {
        userId,
        achievementId: achievement.id,
        achievement: {
          name: achievement.name,
          description: achievement.description,
          imageUrl: achievement.image_url,
          difficulty: achievement.difficulty,
          pointsRewarded: achievement.points_reward,
          category: achievement.category
        },
        unlockedAt: new Date()
      };

      await this.eventBus.publish(EventType.ACHIEVEMENT_UNLOCKED, event);

      return userAchievement;
    } catch (error) {
      logger.error('Error manually unlocking achievement', { userId, achievementId, error });
      throw error;
    }
  }

  /**
   * Check if a user has a specific achievement
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns True if user has the achievement, false otherwise
   */
  async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      return this.achievementRepository.isAchievementUnlocked(userId, achievementId);
    } catch (error) {
      logger.error('Error checking if user has achievement', { userId, achievementId, error });
      throw error;
    }
  }

  /**
   * Count achievements unlocked by a user
   * 
   * @param userId User ID
   * @returns Number of unlocked achievements
   */
  async countUserAchievements(userId: string): Promise<number> {
    try {
      return this.achievementRepository.countUserAchievements(userId);
    } catch (error) {
      logger.error('Error counting user achievements', { userId, error });
      throw error;
    }
  }
}
