/**
 * Level Service
 * 
 * Manages user levels, XP tracking, and level progression
 */
import { Pool } from 'pg';
import { Level } from '../../models/level';
import { LevelRepository } from '../../repositories/level-repository';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { PointsService } from '../points';
import { NotificationService } from '../notifications';

export interface LevelProgress {
  previousLevel: number;
  currentLevel: number;
  totalXP: number;
  xpGained: number;
  xpToNextLevel: number;
  levelUp: boolean;
  levelProgress: number; // 0-100 percentage
}

export interface XPAward {
  userId: string;
  amount: number;
  source: string;
  referenceId?: string;
  description?: string;
}

export class LevelService {
  private repository: LevelRepository;
  private pointsService: PointsService;
  private eventBus: EventBus;
  private notificationService: NotificationService;
  private db: Pool;
  
  constructor(
    db: Pool,
    repository: LevelRepository,
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
   * Get user's current level
   */
  async getUserLevel(userId: string): Promise<{
    level: number;
    title: string;
    currentXP: number;
    nextLevelXP: number;
    progress: number;
    benefits: string[];
  }> {
    try {
      // Get user level details
      const userLevel = await this.repository.getUserLevelDetails(userId);
      
      if (!userLevel) {
        // Initialize user level if not exists
        await this.repository.initializeUserLevel(userId);
        
        // Get default level (should be 1)
        const defaultLevel = await this.repository.getLevelDefinition(1);
        
        return {
          level: 1,
          title: defaultLevel?.title || 'New Arrival',
          currentXP: 0,
          nextLevelXP: defaultLevel?.xp_required || 500,
          progress: 0,
          benefits: defaultLevel?.benefits || []
        };
      }
      
      // Get current level definition
      const currentLevel = await this.repository.getLevelDefinition(userLevel.level);
      
      // Get next level definition if available
      const nextLevel = await this.repository.getLevelDefinition(userLevel.level + 1);
      
      // Calculate progress percentage
      let progress = 0;
      if (nextLevel) {
        const currentLevelXP = currentLevel?.xp_required || 0;
        const nextLevelXP = nextLevel.xp_required;
        const xpInCurrentLevel = userLevel.total_xp - currentLevelXP;
        const xpRequiredForNextLevel = nextLevelXP - currentLevelXP;
        
        progress = Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100));
      } else {
        // User is at max level
        progress = 100;
      }
      
      return {
        level: userLevel.level,
        title: currentLevel?.title || `Level ${userLevel.level}`,
        currentXP: userLevel.total_xp,
        nextLevelXP: nextLevel?.xp_required || 0,
        progress,
        benefits: currentLevel?.benefits || []
      };
    } catch (error) {
      logger.error('Error getting user level', { error, userId });
      throw error;
    }
  }
  
  /**
   * Award XP to a user
   */
  async addXP(data: XPAward): Promise<LevelProgress> {
    const { userId, amount, source, referenceId, description } = data;
    
    try {
      logger.debug('Adding XP to user', { userId, amount, source });
      
      // Get current user level
      const userLevel = await this.repository.getUserLevelDetails(userId);
      
      if (!userLevel) {
        // Initialize user level if not exists
        await this.repository.initializeUserLevel(userId);
      }
      
      // Use transaction to ensure data consistency
      return this.repository.executeTransaction(async (client) => {
        // Get current level details within transaction
        const currentLevel = await this.repository.getUserLevelDetailsWithClient(client, userId);
        
        if (!currentLevel) {
          throw new Error(`User level not found for user ${userId}`);
        }
        
        // Calculate new total XP
        const newTotalXP = currentLevel.total_xp + amount;
        
        // Get level definitions
        const currentLevelDef = await this.repository.getLevelDefinitionWithClient(
          client, 
          currentLevel.level
        );
        
        // Determine if level up occurred
        let newLevel = currentLevel.level;
        let levelUp = false;
        let levelsGained = 0;
        
        // Check for level ups (may skip multiple levels)
        while (true) {
          const nextLevelDef = await this.repository.getLevelDefinitionWithClient(
            client, 
            newLevel + 1
          );
          
          if (!nextLevelDef || newTotalXP < nextLevelDef.xp_required) {
            break;
          }
          
          newLevel++;
          levelUp = true;
          levelsGained++;
        }
        
        // Update user level
        await this.repository.updateUserLevelWithClient(client, {
          userId,
          level: newLevel,
          totalXP: newTotalXP,
          source
        });
        
        // Record XP transaction
        await this.repository.createXPTransactionWithClient(client, {
          userId,
          amount,
          source,
          referenceId,
          description
        });
        
        // Get next level definition for progress calculation
        const nextLevelDef = await this.repository.getLevelDefinitionWithClient(
          client, 
          newLevel + 1
        );
        
        // If level up occurred, process rewards
        if (levelUp) {
          // Track levels gained to process rewards for each level
          for (let level = currentLevel.level + 1; level <= newLevel; level++) {
            const levelDef = await this.repository.getLevelDefinitionWithClient(
              client, 
              level
            );
            
            if (levelDef && levelDef.points_reward > 0) {
              // Award points
              await this.pointsService.awardPointsWithTransaction(client, {
                userId,
                amount: levelDef.points_reward,
                source: 'level_up',
                referenceId: `level_${level}`,
                description: `Level Up to ${level}: ${levelDef.title}`
              });
            }
          }
          
          const newLevelDef = await this.repository.getLevelDefinitionWithClient(
            client, 
            newLevel
          );
          
          // Send notification for level up
          await this.notificationService.createNotificationWithTransaction(client, {
            userId,
            type: 'level_up',
            title: 'Level Up!',
            message: `You've reached Level ${newLevel}: ${newLevelDef?.title || ''}`,
            data: {
              previousLevel: currentLevel.level,
              newLevel,
              title: newLevelDef?.title || '',
              benefits: newLevelDef?.benefits || []
            }
          });
          
          // Emit level up event after transaction commits
          setTimeout(() => {
            this.eventBus.publish(EventType.LEVEL_UP, {
              userId,
              previousLevel: currentLevel.level,
              newLevel,
              levelsGained,
              title: newLevelDef?.title || '',
              totalXP: newTotalXP,
              timestamp: new Date().toISOString()
            });
          }, 0);
        }
        
        // Calculate progress to next level
        let progress = 0;
        let xpToNextLevel = 0;
        
        if (nextLevelDef) {
          const currentLevelXP = currentLevelDef?.xp_required || 0;
          xpToNextLevel = nextLevelDef.xp_required - newTotalXP;
          const xpInCurrentLevel = newTotalXP - currentLevelXP;
          const xpRequiredForNextLevel = nextLevelDef.xp_required - currentLevelXP;
          
          progress = Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100));
        } else {
          // User is at max level
          progress = 100;
          xpToNextLevel = 0;
        }
        
        // Return level progress details
        return {
          previousLevel: currentLevel.level,
          currentLevel: newLevel,
          totalXP: newTotalXP,
          xpGained: amount,
          xpToNextLevel,
          levelUp,
          levelProgress: progress
        };
      });
    } catch (error) {
      logger.error('Error adding XP to user', { error, userId, amount, source });
      throw error;
    }
  }
  
  /**
   * Get all level definitions
   */
  async getLevels(): Promise<Level[]> {
    try {
      return this.repository.getAllLevels();
    } catch (error) {
      logger.error('Error getting levels', { error });
      throw error;
    }
  }
  
  /**
   * Get level definition
   */
  async getLevelDefinition(level: number): Promise<Level | null> {
    try {
      return this.repository.getLevelDefinition(level);
    } catch (error) {
      logger.error('Error getting level definition', { error, level });
      throw error;
    }
  }
  
  /**
   * Get XP history for a user
   */
  async getUserXPHistory(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    transactions: {
      id: string;
      amount: number;
      source: string;
      description?: string;
      createdAt: Date;
    }[];
    total: number;
  }> {
    try {
      return this.repository.getUserXPHistory(userId, options);
    } catch (error) {
      logger.error('Error getting user XP history', { error, userId });
      throw error;
    }
  }
  
  /**
   * Reset user level (for testing or admin purposes)
   */
  async resetUserLevel(userId: string): Promise<boolean> {
    try {
      return this.repository.resetUserLevel(userId);
    } catch (error) {
      logger.error('Error resetting user level', { error, userId });
      throw error;
    }
  }
}
