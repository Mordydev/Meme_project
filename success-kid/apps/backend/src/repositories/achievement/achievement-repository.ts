/**
 * Achievement Repository
 * 
 * Repository for managing achievement definitions and user achievement progress.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '../base-repository';
import { logger } from '../../lib/logger';
import { DatabaseError } from '../../errors';
import { 
  Achievement, 
  AchievementFilter, 
  UserAchievement,
  AchievementProgress
} from '../../models/entities/achievement/achievement.model';

/**
 * Achievement repository implementation
 */
export class AchievementRepository extends BaseRepository<Achievement> {
  /**
   * Create a new AchievementRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'achievements');
  }

  /**
   * Find achievements by event type from their requirements
   * 
   * @param eventType The event type to match in requirements
   * @returns Array of achievements that can be triggered by this event
   */
  async findByEventType(eventType: string): Promise<Achievement[]> {
    try {
      const query = `
        SELECT * FROM achievements 
        WHERE requirements @> '[{"eventType": "${eventType}"}]'::jsonb 
        OR requirements @> '[{"eventType": "*"}]'::jsonb
      `;
      
      const result = await this.db.query<Achievement>(query);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find achievements by event type', { eventType, error });
      throw new DatabaseError('Failed to find achievements by event type', error);
    }
  }

  /**
   * Check if an achievement is unlocked for a user
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns True if achievement is unlocked, false otherwise
   */
  async isAchievementUnlocked(userId: string, achievementId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1 AND achievement_id = $2 AND unlocked_at IS NOT NULL',
        [userId, achievementId]
      );
      
      return parseInt(result.rows[0].count, 10) > 0;
    } catch (error) {
      logger.error('Failed to check if achievement is unlocked', { userId, achievementId, error });
      throw new DatabaseError('Failed to check if achievement is unlocked', error);
    }
  }

  /**
   * Get user's progress for an achievement
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns Achievement progress or null if not found
   */
  async getAchievementProgress(userId: string, achievementId: string): Promise<AchievementProgress | null> {
    try {
      // First, get the achievement to determine target values
      const achievement = await this.findById(achievementId);
      if (!achievement) {
        return null;
      }
      
      // Then get the user's progress
      const userAchievement = await this.findUserAchievement(userId, achievementId);
      if (!userAchievement) {
        // No progress record yet, return empty progress
        return {
          currentValue: 0,
          targetValue: this.getAchievementTargetValue(achievement),
          percentComplete: 0,
          isComplete: false
        };
      }
      
      // Get current value from progress
      const progressData = userAchievement.progress || {};
      const currentValue = progressData.currentValue || 0;
      
      // Calculate percent complete
      const targetValue = this.getAchievementTargetValue(achievement);
      const percentComplete = Math.min(100, Math.round((currentValue / targetValue) * 100));
      
      return {
        currentValue,
        targetValue,
        percentComplete,
        isComplete: !!userAchievement.unlocked_at
      };
    } catch (error) {
      logger.error('Failed to get achievement progress', { userId, achievementId, error });
      throw new DatabaseError('Failed to get achievement progress', error);
    }
  }

  /**
   * Get achievements by filter criteria
   * 
   * @param filter Filter criteria
   * @returns Array of achievements matching the filter
   */
  async findByFilter(filter: AchievementFilter): Promise<Achievement[]> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (filter.category) {
        conditions.push(`category = $${paramIndex++}`);
        values.push(filter.category);
      }
      
      if (filter.difficulty) {
        conditions.push(`difficulty = $${paramIndex++}`);
        values.push(filter.difficulty);
      }
      
      if (filter.is_public !== undefined) {
        conditions.push(`is_public = $${paramIndex++}`);
        values.push(filter.is_public);
      }
      
      if (filter.search) {
        conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        values.push(`%${filter.search}%`);
        paramIndex++;
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const query = `
        SELECT * FROM achievements
        ${whereClause}
        ORDER BY difficulty, category, name
      `;
      
      const result = await this.db.query<Achievement>(query, values);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find achievements by filter', { filter, error });
      throw new DatabaseError('Failed to find achievements by filter', error);
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
      const query = `
        SELECT ua.*, a.*
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
        ORDER BY ua.unlocked_at DESC NULLS LAST, a.difficulty, a.category, a.name
      `;
      
      const result = await this.db.query(query, [userId]);
      
      // Transform results into a more useful structure
      return result.rows.map(row => ({
        achievement: {
          id: row.id,
          name: row.name,
          description: row.description,
          image_url: row.image_url,
          points_reward: row.points_reward,
          difficulty: row.difficulty,
          category: row.category,
          is_public: row.is_public
        },
        unlocked_at: row.unlocked_at,
        progress: row.progress || {},
        notified: row.notified
      }));
    } catch (error) {
      logger.error('Failed to get user achievements', { userId, error });
      throw new DatabaseError('Failed to get user achievements', error);
    }
  }

  /**
   * Find a user achievement record
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns User achievement or null if not found
   */
  async findUserAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
    try {
      const result = await this.db.query<UserAchievement>(
        'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
        [userId, achievementId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Failed to find user achievement', { userId, achievementId, error });
      throw new DatabaseError('Failed to find user achievement', error);
    }
  }

  /**
   * Create or update user achievement progress
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @param progress Progress data to update
   * @returns Updated user achievement
   */
  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: Record<string, any>
  ): Promise<UserAchievement> {
    try {
      // Check if record already exists
      const existingRecord = await this.findUserAchievement(userId, achievementId);
      
      if (existingRecord) {
        // Update existing record
        const result = await this.db.query<UserAchievement>(
          `UPDATE user_achievements 
           SET progress = $3, updated_at = NOW() 
           WHERE user_id = $1 AND achievement_id = $2
           RETURNING *`,
          [userId, achievementId, progress]
        );
        
        return result.rows[0];
      } else {
        // Create new record
        const result = await this.db.query<UserAchievement>(
          `INSERT INTO user_achievements(
            user_id, achievement_id, unlocked_at, progress, notified
          ) VALUES($1, $2, NULL, $3, false)
          RETURNING *`,
          [userId, achievementId, progress]
        );
        
        return result.rows[0];
      }
    } catch (error) {
      logger.error('Failed to update achievement progress', { userId, achievementId, progress, error });
      throw new DatabaseError('Failed to update achievement progress', error);
    }
  }

  /**
   * Unlock an achievement for a user
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns Unlocked user achievement
   */
  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    return this.withTransaction(async (client) => {
      try {
        // Get achievement to ensure it exists
        const achievementResult = await client.query<Achievement>(
          'SELECT * FROM achievements WHERE id = $1',
          [achievementId]
        );
        
        if (achievementResult.rows.length === 0) {
          throw new Error(`Achievement with ID ${achievementId} not found`);
        }
        
        const achievement = achievementResult.rows[0];
        
        // Check if already unlocked
        const existingResult = await client.query<UserAchievement>(
          'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
          [userId, achievementId]
        );
        
        let result;
        
        if (existingResult.rows.length > 0 && existingResult.rows[0].unlocked_at) {
          // Already unlocked, just return the existing record
          return existingResult.rows[0];
        } else if (existingResult.rows.length > 0) {
          // Update existing record to mark as unlocked
          result = await client.query<UserAchievement>(
            `UPDATE user_achievements 
             SET unlocked_at = NOW(), notified = false, updated_at = NOW() 
             WHERE user_id = $1 AND achievement_id = $2
             RETURNING *`,
            [userId, achievementId]
          );
        } else {
          // Create new unlocked achievement record
          result = await client.query<UserAchievement>(
            `INSERT INTO user_achievements(
              user_id, achievement_id, unlocked_at, progress, notified
            ) VALUES($1, $2, NOW(), '{}', false)
            RETURNING *`,
            [userId, achievementId]
          );
        }
        
        return result.rows[0];
      } catch (error) {
        logger.error('Failed to unlock achievement', { userId, achievementId, error });
        throw error; // Will be caught by withTransaction
      }
    });
  }

  /**
   * Create a new achievement definition
   * 
   * @param data Achievement data
   * @returns Created achievement
   */
  async createAchievement(data: Omit<Achievement, 'id' | 'created_at' | 'updated_at'>): Promise<Achievement> {
    try {
      const id = uuidv4();
      
      const result = await this.db.query<Achievement>(
        `INSERT INTO achievements(
          id, name, description, image_url, points_reward, difficulty, 
          category, requirements, is_public, created_at, updated_at
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          id,
          data.name,
          data.description,
          data.image_url,
          data.points_reward,
          data.difficulty,
          data.category,
          JSON.stringify(data.requirements),
          data.is_public
        ]
      );
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create achievement', { data, error });
      throw new DatabaseError('Failed to create achievement', error);
    }
  }

  /**
   * Mark achievement notification as sent
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns Whether update was successful
   */
  async markNotified(userId: string, achievementId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `UPDATE user_achievements 
         SET notified = true, updated_at = NOW() 
         WHERE user_id = $1 AND achievement_id = $2`,
        [userId, achievementId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Failed to mark achievement as notified', { userId, achievementId, error });
      throw new DatabaseError('Failed to mark achievement as notified', error);
    }
  }

  /**
   * Get unnotified achievements for a user
   * 
   * @param userId User ID
   * @returns Array of unnotified achievements
   */
  async getUnnotifiedAchievements(userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT ua.*, a.*
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1 AND ua.unlocked_at IS NOT NULL AND ua.notified = false
        ORDER BY ua.unlocked_at DESC
      `;
      
      const result = await this.db.query(query, [userId]);
      
      // Transform results into a more useful structure
      return result.rows.map(row => ({
        achievement: {
          id: row.id,
          name: row.name,
          description: row.description,
          image_url: row.image_url,
          points_reward: row.points_reward,
          difficulty: row.difficulty,
          category: row.category
        },
        unlocked_at: row.unlocked_at
      }));
    } catch (error) {
      logger.error('Failed to get unnotified achievements', { userId, error });
      throw new DatabaseError('Failed to get unnotified achievements', error);
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
      const result = await this.db.query(
        'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1 AND unlocked_at IS NOT NULL',
        [userId]
      );
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to count user achievements', { userId, error });
      throw new DatabaseError('Failed to count user achievements', error);
    }
  }

  /**
   * Convert a database row to an achievement entity
   * 
   * @param row Database row
   * @returns Achievement entity
   */
  protected mapToEntity(row: Record<string, any>): Achievement {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      image_url: row.image_url,
      points_reward: row.points_reward,
      difficulty: row.difficulty,
      category: row.category,
      requirements: typeof row.requirements === 'string' 
        ? JSON.parse(row.requirements) 
        : row.requirements,
      is_public: row.is_public,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Get the target value for an achievement
   * 
   * @param achievement Achievement entity
   * @returns Target value for progress tracking
   */
  private getAchievementTargetValue(achievement: Achievement): number {
    // For achievements with count-based criteria, use the target value
    const countCriteria = achievement.requirements.find(r => r.type === 'count');
    if (countCriteria && countCriteria.targetValue) {
      return countCriteria.targetValue;
    }
    
    // For aggregate criteria, use the target value
    const aggregateCriteria = achievement.requirements.find(r => r.type === 'aggregate');
    if (aggregateCriteria && aggregateCriteria.targetValue) {
      return aggregateCriteria.targetValue;
    }
    
    // For streak criteria, use the target value
    const streakCriteria = achievement.requirements.find(r => r.type === 'streak');
    if (streakCriteria && streakCriteria.targetValue) {
      return streakCriteria.targetValue;
    }
    
    // For boolean criteria, target is 1 (done or not done)
    const booleanCriteria = achievement.requirements.find(r => r.type === 'boolean');
    if (booleanCriteria) {
      return 1;
    }
    
    // Default to 1 if no criteria specify a target value
    return 1;
  }
}
