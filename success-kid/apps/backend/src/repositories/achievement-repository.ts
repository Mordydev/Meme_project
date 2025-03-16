/**
 * Achievement Repository
 * 
 * Handles data access operations for achievements and user achievements
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Achievement, 
  CreateAchievementDto, 
  UpdateAchievementDto,
  UserAchievement,
  AchievementWithProgress
} from '../models/entities/achievement.model';
import { logger } from '../lib/logger';

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
   * Create a new achievement
   * 
   * @param data Achievement data
   * @returns Created achievement
   */
  async createAchievement(data: CreateAchievementDto): Promise<Achievement> {
    try {
      return await this.create({
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('Error creating achievement', { error, data });
      throw error;
    }
  }

  /**
   * Update an achievement
   * 
   * @param id Achievement ID
   * @param data Achievement data to update
   * @returns Updated achievement or null if not found
   */
  async updateAchievement(id: string, data: UpdateAchievementDto): Promise<Achievement | null> {
    try {
      // Always update the updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error updating achievement', { error, id, data });
      throw error;
    }
  }

  /**
   * Find achievements by category
   * 
   * @param category Achievement category
   * @param includeHidden Whether to include hidden achievements
   * @returns Array of achievements
   */
  async findByCategory(category: string, includeHidden: boolean = false): Promise<Achievement[]> {
    try {
      let query = `
        SELECT * FROM achievements
        WHERE category = $1
      `;
      
      const params: any[] = [category];
      
      if (!includeHidden) {
        query += ` AND is_public = true`;
      }
      
      query += ` ORDER BY difficulty ASC, name ASC`;
      
      const result = await this.db.query<Achievement>(query, params);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Error finding achievements by category', { error, category });
      throw error;
    }
  }

  /**
   * Find achievements by difficulty
   * 
   * @param difficulty Achievement difficulty
   * @param includeHidden Whether to include hidden achievements
   * @returns Array of achievements
   */
  async findByDifficulty(difficulty: string, includeHidden: boolean = false): Promise<Achievement[]> {
    try {
      let query = `
        SELECT * FROM achievements
        WHERE difficulty = $1
      `;
      
      const params: any[] = [difficulty];
      
      if (!includeHidden) {
        query += ` AND is_public = true`;
      }
      
      query += ` ORDER BY category ASC, name ASC`;
      
      const result = await this.db.query<Achievement>(query, params);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Error finding achievements by difficulty', { error, difficulty });
      throw error;
    }
  }

  /**
   * Get user achievements
   * 
   * @param userId User ID
   * @returns Array of achievements with unlocked status
   */
  async getUserAchievements(userId: string): Promise<AchievementWithProgress[]> {
    try {
      // Get all achievements joined with user achievements if unlocked
      const query = `
        SELECT a.*, ua.unlocked_at, ua.progress
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
        WHERE a.is_public = true OR ua.unlocked_at IS NOT NULL
        ORDER BY 
          CASE WHEN ua.unlocked_at IS NOT NULL THEN 0 ELSE 1 END, -- Unlocked first
          ua.unlocked_at DESC NULLS LAST, -- Recently unlocked first
          a.difficulty, -- Then by difficulty
          a.category, -- Then by category
          a.name -- Then by name
      `;
      
      const result = await this.db.query(query, [userId]);
      
      // Map to achievement with progress
      return result.rows.map(row => {
        const achievement = this.mapToEntity(row);
        
        // Add progress information
        return {
          ...achievement,
          progress: row.unlocked_at ? {
            current: 1,
            required: 1,
            percentage: 100,
            isComplete: true,
            unlocked_at: row.unlocked_at
          } : row.progress ? {
            ...row.progress,
            isComplete: false
          } : undefined
        };
      });
    } catch (error) {
      logger.error('Error getting user achievements', { error, userId });
      throw error;
    }
  }

  /**
   * Unlock an achievement for a user
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @param progress Optional progress data
   * @returns User achievement
   */
  async unlockAchievement(
    userId: string, 
    achievementId: string, 
    progress: Record<string, any> = {}
  ): Promise<UserAchievement> {
    try {
      // Begin transaction
      return this.withTransaction(async (client) => {
        // Check if already unlocked
        const existingResult = await client.query(`
          SELECT * FROM user_achievements
          WHERE user_id = $1 AND achievement_id = $2
        `, [userId, achievementId]);
        
        if (existingResult.rows.length > 0) {
          // Already unlocked, just update progress
          await client.query(`
            UPDATE user_achievements
            SET progress = $3, notified = $4
            WHERE user_id = $1 AND achievement_id = $2
          `, [userId, achievementId, JSON.stringify(progress), false]);
          
          return {
            user_id: userId,
            achievement_id: achievementId,
            unlocked_at: existingResult.rows[0].unlocked_at,
            progress,
            notified: false
          };
        }
        
        // Insert new achievement unlock
        const now = new Date();
        const result = await client.query(`
          INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, progress, notified)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [userId, achievementId, now, JSON.stringify(progress), false]);
        
        return {
          user_id: result.rows[0].user_id,
          achievement_id: result.rows[0].achievement_id,
          unlocked_at: result.rows[0].unlocked_at,
          progress: result.rows[0].progress || {},
          notified: result.rows[0].notified
        };
      });
    } catch (error) {
      logger.error('Error unlocking achievement', { error, userId, achievementId });
      throw error;
    }
  }

  /**
   * Mark user achievement as notified
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns True if updated, false if not found
   */
  async markAchievementNotified(userId: string, achievementId: string): Promise<boolean> {
    try {
      const result = await this.db.query(`
        UPDATE user_achievements
        SET notified = true
        WHERE user_id = $1 AND achievement_id = $2
      `, [userId, achievementId]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error marking achievement as notified', { error, userId, achievementId });
      throw error;
    }
  }

  /**
   * Get unnotified achievements for a user
   * 
   * @param userId User ID
   * @returns Array of achievements with user achievement data
   */
  async getUnnotifiedAchievements(userId: string): Promise<(Achievement & UserAchievement)[]> {
    try {
      const query = `
        SELECT a.*, ua.unlocked_at, ua.progress, ua.notified
        FROM achievements a
        JOIN user_achievements ua ON a.id = ua.achievement_id
        WHERE ua.user_id = $1 AND ua.notified = false
        ORDER BY ua.unlocked_at DESC
      `;
      
      const result = await this.db.query(query, [userId]);
      
      return result.rows.map(row => ({
        ...this.mapToEntity(row),
        user_id: row.user_id,
        achievement_id: row.id,
        unlocked_at: row.unlocked_at,
        progress: row.progress || {},
        notified: row.notified
      }));
    } catch (error) {
      logger.error('Error getting unnotified achievements', { error, userId });
      throw error;
    }
  }

  /**
   * Update achievement progress for a user
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @param progress Progress data
   * @returns True if updated, false if not found
   */
  async updateAchievementProgress(
    userId: string, 
    achievementId: string, 
    progress: Record<string, any>
  ): Promise<boolean> {
    try {
      // First check if the user already has this achievement
      const existingResult = await this.db.query(`
        SELECT * FROM user_achievements
        WHERE user_id = $1 AND achievement_id = $2
      `, [userId, achievementId]);
      
      if (existingResult.rows.length > 0) {
        // Update existing progress
        const result = await this.db.query(`
          UPDATE user_achievements
          SET progress = $3
          WHERE user_id = $1 AND achievement_id = $2
        `, [userId, achievementId, JSON.stringify(progress)]);
        
        return result.rowCount > 0;
      } else {
        // Insert new progress entry without unlocking
        const result = await this.db.query(`
          INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at, notified)
          VALUES ($1, $2, $3, NULL, false)
        `, [userId, achievementId, JSON.stringify(progress)]);
        
        return result.rowCount > 0;
      }
    } catch (error) {
      logger.error('Error updating achievement progress', { error, userId, achievementId });
      throw error;
    }
  }

  /**
   * Map database row to Achievement entity
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
      requirements: row.requirements || {},
      is_public: row.is_public !== false, // Default to true if undefined
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
