/**
 * Level Service
 * 
 * Service for managing user levels, XP, and level progression.
 */
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { LevelRepository } from '../../repositories/achievement/level-repository';
import { PointsService } from '../points/points-service';
import {
  Level,
  UserLevel,
  XpTransaction,
  XpSource,
  XpAwardData,
  LevelProgress,
  LevelUpEvent,
  XP_VALUES
} from '../../models/entities/achievement/level.model';
import { NotFoundError } from '../../errors';

/**
 * Service for managing user levels and XP
 */
export class LevelService {
  /**
   * Create a new LevelService
   * 
   * @param levelRepository Repository for level data access
   * @param pointsService Service for awarding points
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private levelRepository: LevelRepository,
    private pointsService: PointsService,
    private eventBus: EventBus
  ) {
    this.initializeLevels().catch(error => {
      logger.error('Failed to initialize level definitions', { error });
    });
  }

  /**
   * Initialize level definitions if they don't exist
   */
  private async initializeLevels(): Promise<void> {
    await this.levelRepository.initializeLevelDefinitions();
  }

  /**
   * Get level definition by level number
   * 
   * @param level Level number
   * @returns Level definition
   */
  async getLevelDefinition(level: number): Promise<Level | null> {
    try {
      return this.levelRepository.getLevelDefinition(level);
    } catch (error) {
      logger.error('Error getting level definition', { level, error });
      throw error;
    }
  }

  /**
   * Get all level definitions
   * 
   * @returns Array of level definitions
   */
  async getAllLevelDefinitions(): Promise<Level[]> {
    try {
      return this.levelRepository.getAllLevelDefinitions();
    } catch (error) {
      logger.error('Error getting all level definitions', { error });
      throw error;
    }
  }

  /**
   * Get a user's current level
   * 
   * @param userId User ID
   * @returns User level info with additional data
   */
  async getUserLevel(userId: string): Promise<UserLevel & { 
    nextLevel: Level | null;
    xpToNextLevel: number;
    percentToNextLevel: number;
    levelTitle: string;
    benefits: string[];
  }> {
    try {
      // Get user level, initializing if needed
      let userLevel = await this.levelRepository.getUserLevel(userId);
      
      if (!userLevel) {
        userLevel = await this.levelRepository.initializeUserLevel(userId);
      }
      
      // Get current level definition
      const currentLevelDef = await this.levelRepository.getLevelDefinition(userLevel.level);
      
      if (!currentLevelDef) {
        throw new NotFoundError(`Level definition not found for level ${userLevel.level}`);
      }
      
      // Get next level definition
      const nextLevelDef = await this.levelRepository.getLevelDefinition(userLevel.level + 1);
      
      // Calculate progress to next level
      let xpToNextLevel = 0;
      let percentToNextLevel = 100; // Default for max level
      
      if (nextLevelDef) {
        xpToNextLevel = nextLevelDef.xp_required - userLevel.current_xp;
        percentToNextLevel = Math.min(
          100,
          Math.round(
            ((userLevel.current_xp - currentLevelDef.xp_required) / 
             (nextLevelDef.xp_required - currentLevelDef.xp_required)) * 100
          )
        );
      }
      
      return {
        ...userLevel,
        nextLevel: nextLevelDef,
        xpToNextLevel,
        percentToNextLevel,
        levelTitle: currentLevelDef.title,
        benefits: currentLevelDef.benefits
      };
    } catch (error) {
      logger.error('Error getting user level', { userId, error });
      throw error;
    }
  }

  /**
   * Add XP to a user and check for level up
   * 
   * @param data XP award data
   * @returns Object with updated level info and level up status
   */
  async addXP(data: XpAwardData): Promise<LevelProgress> {
    try {
      const { userId, amount, source, referenceId } = data;
      
      // Add XP and check for level up
      const result = await this.levelRepository.addXpAndCheckLevelUp(
        userId,
        amount,
        source,
        referenceId
      );
      
      const { userLevel, levelUp, previousLevel } = result;
      
      // If leveled up, get level definitions and process rewards
      if (levelUp) {
        // Get new level definition
        const newLevelDef = await this.levelRepository.getLevelDefinition(userLevel.level);
        
        if (newLevelDef && newLevelDef.points_reward > 0) {
          // Award points for level up
          await this.pointsService.awardPoints({
            userId,
            amount: newLevelDef.points_reward,
            source: 'level_up',
            referenceId: `level_${userLevel.level}`,
            description: `Level Up: Level ${userLevel.level}`
          });
        }
        
        // Get previous level definition for event data
        const prevLevelDef = await this.levelRepository.getLevelDefinition(previousLevel);
        
        // Emit level up event
        const levelUpEvent: LevelUpEvent = {
          userId,
          previousLevel,
          newLevel: userLevel.level,
          benefits: newLevelDef ? newLevelDef.benefits : [],
          pointsRewarded: newLevelDef ? newLevelDef.points_reward : 0
        };
        
        await this.eventBus.publish(EventType.LEVEL_UP, levelUpEvent);
        
        logger.info(`User leveled up`, { 
          userId, 
          previousLevel, 
          newLevel: userLevel.level 
        });
      }
      
      // Get next level definition
      const nextLevelDef = await this.levelRepository.getLevelDefinition(userLevel.level + 1);
      
      // Calculate progress data for response
      const xpToNextLevel = nextLevelDef ? nextLevelDef.xp_required - userLevel.current_xp : 0;
      
      // Get current level definition for calculating progress percentage
      const currentLevelDef = await this.levelRepository.getLevelDefinition(userLevel.level);
      
      let levelProgress = 100; // Default for max level
      
      if (nextLevelDef && currentLevelDef) {
        levelProgress = Math.min(
          100,
          Math.round(
            ((userLevel.current_xp - currentLevelDef.xp_required) / 
             (nextLevelDef.xp_required - currentLevelDef.xp_required)) * 100
          )
        );
      }
      
      return {
        previousLevel,
        currentLevel: userLevel.level,
        totalXp: userLevel.current_xp,
        xpGained: amount,
        xpToNextLevel,
        levelUp,
        levelProgress
      };
    } catch (error) {
      logger.error('Error adding XP', { data, error });
      throw error;
    }
  }

  /**
   * Get XP transactions for a user
   * 
   * @param userId User ID
   * @param limit Maximum number of transactions
   * @param offset Number of transactions to skip
   * @returns Array of XP transactions
   */
  async getXpTransactions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<XpTransaction[]> {
    try {
      return this.levelRepository.getXpTransactions(userId, limit, offset);
    } catch (error) {
      logger.error('Error getting XP transactions', { userId, limit, offset, error });
      throw error;
    }
  }

  /**
   * Get the amount of XP awarded for different sources
   * 
   * @returns Record of XP values by source
   */
  getXpValues(): Record<XpSource, number> {
    return XP_VALUES;
  }

  /**
   * Calculate the user's level based on total XP
   * 
   * @param totalXp Total XP
   * @returns Level number
   */
  async calculateLevelFromXp(totalXp: number): Promise<number> {
    try {
      // Get all level definitions
      const levels = await this.levelRepository.getAllLevelDefinitions();
      
      // Sort by XP required (descending)
      levels.sort((a, b) => b.xp_required - a.xp_required);
      
      // Find the highest level the user qualifies for
      for (const level of levels) {
        if (totalXp >= level.xp_required) {
          return level.level;
        }
      }
      
      // Default to level 1
      return 1;
    } catch (error) {
      logger.error('Error calculating level from XP', { totalXp, error });
      throw error;
    }
  }
}
