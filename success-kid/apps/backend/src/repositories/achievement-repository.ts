/**
 * Achievement Repository
 * 
 * Handles data access for achievements and user achievements
 */
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base-repository';
import { 
  Achievement, 
  CreateAchievementDto, 
  UpdateAchievementDto,
  AchievementTrigger,
  achievementDbMapping
} from '../models/achievement';
import { 
  UserAchievement, 
  CreateUserAchievementDto,
  UserAchievementProgress,
  userAchievementDbMapping,
  userAchievementProgressDbMapping
} from '../models/user-achievement';
import { logger } from '../lib/logger';

export class AchievementRepository extends BaseRepository<Achievement> {
  constructor(db: Pool) {
    super(db, 'achievements', 'id');
  }

  /**
   * Find achievements by trigger event
   */
  async findByEventType(triggerEvent: AchievementTrigger): Promise<Achievement[]> {
    try {
      const query = `
        SELECT * FROM achievements
        WHERE criteria @> '[{"trigger": "${triggerEvent}"}]'::jsonb
      `;
      
      const result = await this.db.query<Achievement>(query);
      return result.rows;
    } catch (error) {
      logger.error('Error finding achievements by event type', { error, triggerEvent });
      throw error;
    }
  }

  /**
   * Create an achievement
   */
  async createAchievement(data: CreateAchievementDto): Promise<Achievement> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const query = `
        INSERT INTO achievements (
          id, name, description, image_url, category, 
          difficulty, points_reward, criteria, created_at, 
          updated_at, secret
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        id,
        data.name,
        data.description,
        data.image_url,
        data.category,
        data.difficulty,
        data.points_reward,
        JSON.stringify(data.criteria),
        now,
        null,
        data.secret || false
      ];
      
      const result = await this.db.query<Achievement>(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating achievement', { error, data });
      throw error;
    }
  }

  /**
   * Update an achievement
   */
  async updateAchievement(id: string, data: UpdateAchievementDto): Promise<Achievement | null> {
    try {
      // Build update parts
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Add field updates if they exist in the data
      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      
      if (data.image_url !== undefined) {
        updates.push(`image_url = $${paramIndex++}`);
        values.push(data.image_url);
      }
      
      if (data.category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(data.category);
      }
      
      if (data.difficulty !== undefined) {
        updates.push(`difficulty = $${paramIndex++}`);
        values.push(data.difficulty);
      }
      
      if (data.points_reward !== undefined) {
        updates.push(`points_reward = $${paramIndex++}`);
        values.push(data.points_reward);
      }
      
      if (data.criteria !== undefined) {
        updates.push(`criteria = $${paramIndex++}`);
        values.push(JSON.stringify(data.criteria));
      }
      
      if (data.secret !== undefined) {
        updates.push(`secret = $${paramIndex++}`);
        values.push(data.secret);
      }
      
      // Always update the updated_at field
      updates.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());
      
      // Add ID for WHERE clause
      values.push(id);
      
      // Execute update if there are fields to update
      if (updates.length > 0) {
        const query = `
          UPDATE achievements
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        const result = await this.db.query<Achievement>(query, values);
        return result.rows[0] || null;
      }
      
      // If no fields to update, return the current achievement
      return this.findById(id);
    } catch (error) {
      logger.error('Error updating achievement', { error, id, data });
      throw error;
    }
  }

  /**
   * Check if a user has unlocked an achievement
   */
  async isAchievementUnlocked(userId: string, achievementId: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1 FROM user_achievements
          WHERE user_id = $1 AND achievement_id = $2
        ) AS unlocked
      `;
      
      const result = await this.db.query<{ unlocked: boolean }>(query, [userId, achievementId]);
      return result.rows[0].unlocked;
    } catch (error) {
      logger.error('Error checking if achievement is unlocked', { 
        error, 
        userId, 
        achievementId 
      });
      throw error;
    }
  }

  /**
   * Get all achievements unlocked by a user
   */
  async getUserAchievements(userId: string): Promise<(UserAchievement & Achievement)[]> {
    try {
      const query = `
        SELECT ua.*, a.name, a.description, a.image_url, a.category, 
               a.difficulty, a.points_reward, a.criteria, a.secret
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
        ORDER BY ua.unlocked_at DESC
      `;
      
      const result = await this.db.query<UserAchievement & Achievement>(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user achievements', { error, userId });
      throw error;
    }
  }

  /**
   * Get achievements unlocked by a user by category
   */
  async getUserAchievementsByCategory(userId: string, category: string): Promise<(UserAchievement & Achievement)[]> {
    try {
      const query = `
        SELECT ua.*, a.name, a.description, a.image_url, a.category, 
               a.difficulty, a.points_reward, a.criteria, a.secret
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1 AND a.category = $2
        ORDER BY ua.unlocked_at DESC
      `;
      
      const result = await this.db.query<UserAchievement & Achievement>(query, [userId, category]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user achievements by category', { 
        error, 
        userId, 
        category 
      });
      throw error;
    }
  }

  /**
   * Record a new unlocked achievement for a user
   */
  async createUserAchievement(data: CreateUserAchievementDto): Promise<UserAchievement> {
    try {
      const id = uuidv4();
      
      const query = `
        INSERT INTO user_achievements (
          id, user_id, achievement_id, unlocked_at, 
          progress, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        id,
        data.user_id,
        data.achievement_id,
        data.unlocked_at,
        data.progress || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ];
      
      const result = await this.db.query<UserAchievement>(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user achievement', { error, data });
      throw error;
    }
  }

  /**
   * Create a user achievement within a transaction
   */
  async createUserAchievementWithTransaction(
    client: PoolClient,
    data: CreateUserAchievementDto
  ): Promise<UserAchievement> {
    try {
      const id = uuidv4();
      
      const query = `
        INSERT INTO user_achievements (
          id, user_id, achievement_id, unlocked_at, 
          progress, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        id,
        data.user_id,
        data.achievement_id,
        data.unlocked_at,
        data.progress || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ];
      
      const result = await client.query<UserAchievement>(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user achievement with transaction', { error, data });
      throw error;
    }
  }

  /**
   * Update achievement progress for a user
   */
  async updateAchievementProgress(
    userId: string, 
    achievementId: string, 
    currentValue: number
  ): Promise<UserAchievementProgress> {
    return this.executeTransaction(async (client) => {
      try {
        // Check if progress record exists
        const checkQuery = `
          SELECT * FROM user_achievement_progress
          WHERE user_id = $1 AND achievement_id = $2
        `;
        
        const checkResult = await client.query<UserAchievementProgress>(
          checkQuery, 
          [userId, achievementId]
        );
        
        // If record exists, update it
        if (checkResult.rows.length > 0) {
          const updateQuery = `
            UPDATE user_achievement_progress
            SET current_value = $1, updated_at = NOW()
            WHERE user_id = $2 AND achievement_id = $3
            RETURNING *
          `;
          
          const updateResult = await client.query<UserAchievementProgress>(
            updateQuery, 
            [currentValue, userId, achievementId]
          );
          
          return updateResult.rows[0];
        } 
        // Otherwise, create new record
        else {
          const insertQuery = `
            INSERT INTO user_achievement_progress (
              id, user_id, achievement_id, current_value, updated_at
            )
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
          `;
          
          const insertResult = await client.query<UserAchievementProgress>(
            insertQuery, 
            [uuidv4(), userId, achievementId, currentValue]
          );
          
          return insertResult.rows[0];
        }
      } catch (error) {
        logger.error('Error updating achievement progress', { 
          error, 
          userId, 
          achievementId, 
          currentValue 
        });
        throw error;
      }
    });
  }

  /**
   * Get current achievement progress for a user
   */
  async getAchievementProgress(
    userId: string, 
    achievementId: string
  ): Promise<UserAchievementProgress | null> {
    try {
      const query = `
        SELECT * FROM user_achievement_progress
        WHERE user_id = $1 AND achievement_id = $2
      `;
      
      const result = await this.db.query<UserAchievementProgress>(query, [userId, achievementId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting achievement progress', { error, userId, achievementId });
      throw error;
    }
  }

  /**
   * Get achievement progress for multiple achievements for a user
   */
  async getAchievementsProgress(
    userId: string, 
    achievementIds: string[]
  ): Promise<Record<string, UserAchievementProgress>> {
    try {
      if (achievementIds.length === 0) {
        return {};
      }
      
      const placeholders = achievementIds.map((_, index) => `$${index + 2}`).join(',');
      const query = `
        SELECT * FROM user_achievement_progress
        WHERE user_id = $1 AND achievement_id IN (${placeholders})
      `;
      
      const result = await this.db.query<UserAchievementProgress>(
        query, 
        [userId, ...achievementIds]
      );
      
      // Convert array to record by achievement ID
      const progressMap: Record<string, UserAchievementProgress> = {};
      result.rows.forEach(row => {
        progressMap[row.achievement_id] = row;
      });
      
      return progressMap;
    } catch (error) {
      logger.error('Error getting achievements progress', { 
        error, 
        userId, 
        achievementIds 
      });
      throw error;
    }
  }

  /**
   * Get all achievements with progress for a user
   */
  async getAllAchievementsWithProgress(userId: string): Promise<{
    achievement: Achievement;
    unlocked: boolean;
    progress?: UserAchievementProgress;
    unlockedAt?: Date;
  }[]> {
    try {
      const query = `
        SELECT 
          a.*,
          ua.id IS NOT NULL AS unlocked,
          ua.unlocked_at,
          uap.current_value,
          uap.updated_at AS progress_updated_at
        FROM achievements a
        LEFT JOIN user_achievements ua 
          ON a.id = ua.achievement_id AND ua.user_id = $1
        LEFT JOIN user_achievement_progress uap 
          ON a.id = uap.achievement_id AND uap.user_id = $1
        ORDER BY ua.unlocked_at DESC NULLS LAST, a.difficulty ASC
      `;
      
      const result = await this.db.query(query, [userId]);
      
      return result.rows.map(row => ({
        achievement: {
          id: row.id,
          name: row.name,
          description: row.description,
          image_url: row.image_url,
          category: row.category,
          difficulty: row.difficulty,
          points_reward: row.points_reward,
          criteria: row.criteria,
          created_at: row.created_at,
          updated_at: row.updated_at,
          secret: row.secret
        },
        unlocked: row.unlocked,
        unlockedAt: row.unlocked_at,
        progress: row.current_value ? {
          id: '', // Not needed here
          user_id: userId,
          achievement_id: row.id,
          current_value: row.current_value,
          updated_at: row.progress_updated_at
        } : undefined
      }));
    } catch (error) {
      logger.error('Error getting all achievements with progress', { error, userId });
      throw error;
    }
  }

  /**
   * Get achievement statistics
   */
  async getAchievementStats(): Promise<{
    achievementId: string;
    name: string;
    category: string;
    unlockCount: number;
    unlockRate: number;
  }[]> {
    try {
      const query = `
        SELECT 
          a.id AS achievement_id,
          a.name,
          a.category,
          COUNT(ua.id) AS unlock_count,
          COUNT(ua.id)::float / (SELECT COUNT(*) FROM users WHERE status = 'active') AS unlock_rate
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
        GROUP BY a.id, a.name, a.category
        ORDER BY unlock_count DESC
      `;
      
      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting achievement stats', { error });
      throw error;
    }
  }

  /**
   * Get achievement unlock count
   */
  async getAchievementUnlockCount(achievementId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) AS count
        FROM user_achievements
        WHERE achievement_id = $1
      `;
      
      const result = await this.db.query<{ count: string }>(query, [achievementId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting achievement unlock count', { error, achievementId });
      throw error;
    }
  }

  /**
   * Delete a user achievement (for testing and admin purposes)
   */
  async deleteUserAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM user_achievements
        WHERE user_id = $1 AND achievement_id = $2
      `;
      
      const result = await this.db.query(query, [userId, achievementId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting user achievement', { error, userId, achievementId });
      throw error;
    }
  }

  /**
   * Get a user's Achievement collection summary
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
      // Get total and counts by difficulty/category
      const statsQuery = `
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE a.difficulty = 'common') AS common_count,
          COUNT(*) FILTER (WHERE a.difficulty = 'uncommon') AS uncommon_count,
          COUNT(*) FILTER (WHERE a.difficulty = 'rare') AS rare_count,
          COUNT(*) FILTER (WHERE a.difficulty = 'epic') AS epic_count,
          COUNT(*) FILTER (WHERE a.category = 'content') AS content_count,
          COUNT(*) FILTER (WHERE a.category = 'engagement') AS engagement_count,
          COUNT(*) FILTER (WHERE a.category = 'profile') AS profile_count,
          COUNT(*) FILTER (WHERE a.category = 'wallet') AS wallet_count,
          COUNT(*) FILTER (WHERE a.category = 'community') AS community_count,
          COUNT(*) FILTER (WHERE a.category = 'referral') AS referral_count,
          COUNT(*) FILTER (WHERE a.category = 'milestone') AS milestone_count,
          COUNT(*) FILTER (WHERE a.category = 'special') AS special_count
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
      `;
      
      const statsResult = await this.db.query(statsQuery, [userId]);
      const stats = statsResult.rows[0];
      
      // Get recently unlocked achievements
      const recentQuery = `
        SELECT a.id, a.name, a.difficulty, ua.unlocked_at
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
        ORDER BY ua.unlocked_at DESC
        LIMIT 5
      `;
      
      const recentResult = await this.db.query(recentQuery, [userId]);
      
      return {
        total: parseInt(stats.total, 10) || 0,
        byDifficulty: {
          common: parseInt(stats.common_count, 10) || 0,
          uncommon: parseInt(stats.uncommon_count, 10) || 0,
          rare: parseInt(stats.rare_count, 10) || 0,
          epic: parseInt(stats.epic_count, 10) || 0
        },
        byCategory: {
          content: parseInt(stats.content_count, 10) || 0,
          engagement: parseInt(stats.engagement_count, 10) || 0,
          profile: parseInt(stats.profile_count, 10) || 0,
          wallet: parseInt(stats.wallet_count, 10) || 0,
          community: parseInt(stats.community_count, 10) || 0,
          referral: parseInt(stats.referral_count, 10) || 0,
          milestone: parseInt(stats.milestone_count, 10) || 0,
          special: parseInt(stats.special_count, 10) || 0
        },
        recentlyUnlocked: recentResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          difficulty: row.difficulty,
          unlockedAt: row.unlocked_at
        }))
      };
    } catch (error) {
      logger.error('Error getting user achievement summary', { error, userId });
      throw error;
    }
  }

  /**
   * Check which users have unlocked an achievement
   */
  async getUsersWithAchievement(
    achievementId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    userId: string;
    displayName?: string;
    avatarUrl?: string;
    unlockedAt: Date;
  }[]> {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const query = `
        SELECT ua.user_id, u.display_name, p.avatar_url, ua.unlocked_at
        FROM user_achievements ua
        JOIN users u ON ua.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE ua.achievement_id = $1
        ORDER BY ua.unlocked_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [achievementId, limit, offset]);
      
      return result.rows.map(row => ({
        userId: row.user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        unlockedAt: row.unlocked_at
      }));
    } catch (error) {
      logger.error('Error getting users with achievement', { 
        error, 
        achievementId, 
        options 
      });
      throw error;
    }
  }
}
