import { AchievementRepository } from '../repositories/achievement-repository';
import { EventEmitter, EventType } from '../lib/events';
import { TransactionManager } from '../lib/transaction';
import { logger } from '../lib/logger';
import { NotFoundError } from '../lib/errors';

/**
 * Service for handling achievement operations
 */
export class AchievementService {
  private achievementRepository: AchievementRepository;
  
  constructor(
    private repository: AchievementRepository,
    private eventEmitter: EventEmitter,
    private transactionManager?: TransactionManager
  ) {
    this.achievementRepository = repository;
  }

  /**
   * Get all achievements
   */
  async getAllAchievements() {
    return this.achievementRepository.getAllAchievements();
  }

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(category: string) {
    return this.achievementRepository.getAchievementsByCategory(category);
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string) {
    return this.achievementRepository.getUserAchievements(userId);
  }

  /**
   * Get user achievement by id
   */
  async getUserAchievement(userId: string, achievementId: string) {
    return this.achievementRepository.getUserAchievement(userId, achievementId);
  }

  /**
   * Update achievement progress
   */
  async updateAchievementProgress(userId: string, achievementId: string, progress: number) {
    const achievement = await this.achievementRepository.updateAchievementProgress(userId, achievementId, progress);
    
    // Emit progress event
    await this.eventEmitter.emit(EventType.ACHIEVEMENT_PROGRESS, {
      userId,
      achievementId,
      progress,
      timestamp: new Date().toISOString()
    });
    
    return achievement;
  }

  /**
   * Process an event for achievement tracking
   */
  async processEvent(eventType: EventType, eventData: any) {
    try {
      await this.achievementRepository.processEventForRules(eventType, eventData);
    } catch (error) {
      logger.error({ error, eventType, eventData }, 'Error processing event for achievements');
    }
  }

  /**
   * Track achievement progress for a specific rule
   */
  async trackAchievementRule(userId: string, ruleId: string, currentValue: number) {
    return this.achievementRepository.updateAchievementProgressForRule(userId, ruleId, currentValue);
  }

  /**
   * Check for token-related achievements
   */
  async checkTokenAchievements(userId: string, tokenBalance: number) {
    await this.trackAchievementRule(userId, 'token_holding', tokenBalance);
  }

  /**
   * Check for community-related achievements
   */
  async checkCommunityAchievements(userId: string, commentCount: number, followerCount: number) {
    await this.trackAchievementRule(userId, 'comment_creation', commentCount);
    await this.trackAchievementRule(userId, 'follower_count', followerCount);
  }

  /**
   * Initialize default achievements
   */
  async initializeAchievements() {
    return this.achievementRepository.initializeAchievements();
  }

  /**
   * Register event handlers
   */
  registerEventHandlers() {
    // Handle battle-related events
    this.eventEmitter.on(EventType.BATTLE_ENTRY_SUBMITTED, async (data) => {
      try {
        await this.processEvent(EventType.BATTLE_ENTRY_SUBMITTED, data);
      } catch (error) {
        logger.error({ error, data }, 'Error processing BATTLE_ENTRY_SUBMITTED event');
      }
    });

    this.eventEmitter.on(EventType.BATTLE_COMPLETED, async (data) => {
      try {
        await this.processEvent(EventType.BATTLE_COMPLETED, data);
      } catch (error) {
        logger.error({ error, data }, 'Error processing BATTLE_COMPLETED event');
      }
    });

    // Handle content-related events
    this.eventEmitter.on(EventType.CONTENT_CREATED, async (data) => {
      try {
        await this.processEvent(EventType.CONTENT_CREATED, data);
      } catch (error) {
        logger.error({ error, data }, 'Error processing CONTENT_CREATED event');
      }
    });

    this.eventEmitter.on(EventType.CONTENT_REACTION_ADDED, async (data) => {
      try {
        await this.processEvent(EventType.CONTENT_REACTION_ADDED, data);
      } catch (error) {
        logger.error({ error, data }, 'Error processing CONTENT_REACTION_ADDED event');
      }
    });

    // Handle comment-related events
    this.eventEmitter.on(EventType.CONTENT_COMMENT_ADDED, async (data) => {
      try {
        await this.processEvent(EventType.CONTENT_COMMENT_ADDED, data);
      } catch (error) {
        logger.error({ error, data }, 'Error processing CONTENT_COMMENT_ADDED event');
      }
    });

    // Handle social events
    this.eventEmitter.on(EventType.USER_FOLLOWED, async (data) => {
      try {
        await this.processEvent(EventType.USER_FOLLOWED, data);
      } catch (error) {
        logger.error({ error, data }, 'Error processing USER_FOLLOWED event');
      }
    });

    // Handle wallet events
    this.eventEmitter.on(EventType.WALLET_CONNECTED, async (data) => {
      try {
        await this.processEvent(EventType.WALLET_CONNECTED, data);
      } catch (error) {
        logger.error({ error, data }, 'Error processing WALLET_CONNECTED event');
      }
    });

    this.eventEmitter.on(EventType.USER_BENEFITS_UPDATED, async (data) => {
      try {
        await this.processEvent(EventType.USER_BENEFITS_UPDATED, data);
      } catch (error) {
        logger.error({ error, data }, 'Error processing USER_BENEFITS_UPDATED event');
      }
    });

    // Handle achievement events (for meta-achievements like "Completionist")
    this.eventEmitter.on(EventType.ACHIEVEMENT_UNLOCKED, async (data) => {
      try {
        await this.processEvent(EventType.ACHIEVEMENT_UNLOCKED, data);
      } catch (error) {
        logger.error({ error, data }, 'Error processing ACHIEVEMENT_UNLOCKED event');
      }
    });
  }
}
