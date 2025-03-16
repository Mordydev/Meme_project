/**
 * Achievement Repository
 * 
 * Handles data access for achievements and user achievements
 */
import { Pool, PoolClient } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Achievement, 
  CreateAchievementDto, 
  UpdateAchievementDto,
  UserAchievement,
  CreateUserAchievementDto,
  UpdateUserAchievementProgressDto
} from '../models/achievement';
import { logger } from '../lib/logger';

export class AchievementRepository extends BaseRepository<Achievement> {
  constructor(db: Pool) {
    super(db, 'achievements', 'id');
  }
  
  /**
   * Create a new achievement
   */
  async createAchievement(input: CreateAchievementDto): Promise<Achievement> {
    try {
      const { name, description, image_url, points_reward, difficulty, requirements } = input;
      
      const query = `
        INSERT INTO achievements
        (id, name, description, image_url, points_reward, difficulty, requirements)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await this.db.query<Achievement>(query, [
        name,
        description,
        image_url || null,
        points_reward,
        difficulty,
        JSON.stringify(requirements)
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating achievement', { error, input });
      throw error;
    }
  }
  
  /**
   * Update an achievement
   */
  async updateAchievement(id: string, input: UpdateAchievementDto): Promise<Achievement | null> {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      // Build dynamic update query
      if (input.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(input.name);
      }
      
      if (input.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }
      
      if (input.image_url !== undefined) {
        updates.push(`image_url = $${paramIndex++}`);
        values.push(input.image_url);
      }
      
      if (input.points_reward !== undefined) {
        updates.push(`points_reward = $${paramIndex++}`);
        values.push(input.points_reward);
      }
      
      if (input.difficulty !== undefined) {
        updates.push(`difficulty = $${paramIndex++}`);
        values.push(input.difficulty);
      }
      
      if (input.requirements !== undefined) {
        updates.push(`requirements = $${paramIndex++}`);
        values.push(JSON.stringify(input.requirements));
      }
      
      if (updates.length === 0) {
        return this.findById(id);
      }
      
      const query = `
        UPDATE achievements
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING *
      `;
      
      values.push(id);
      
      const result = await this.db.query<Achievement>(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating achievement', { error, id, input });
      throw error;
    }
  }
  
  /**
   * Get achievements by difficulty
   */
  async getAchievementsByDifficulty(difficulty: string): Promise<Achievement[]> {
    try {
      const query = `
        SELECT *
        FROM achievements
        WHERE difficulty = $1
        ORDER BY name
      `;
      
      const result = await this.db.query<Achievement>(query, [difficulty]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting achievements by difficulty', { error, difficulty });
      throw error;
    }
  }
  
  /**
   * Award achievement to user
   */
  async awardAchievement(
    input: CreateUserAchievementDto,
    client?: PoolClient
  ): Promise<UserAchievement> {
    try {
      const queryFn = client ? client.query.bind(client) : this.db.query.bind(this.db);
      
      // Check if user already has this achievement
      const existingQuery = `
        SELECT * FROM user_achievements
        WHERE user_id = $1 AND achievement_id = $2
      `;
      
      const existingResult = await queryFn(existingQuery, [
        input.user_id,
        input.achievement_id
      ]);
      
      if (existingResult.rows.length > 0) {
        // User already has this achievement
        return existingResult.rows[0];
      }
      
      // Award the achievement
      const query = `
        INSERT INTO user_achievements
        (user_id, achievement_id, unlocked_at, progress)
        VALUES ($1, $2, NOW(), $3)
        RETURNING *
      `;
      
      const result = await queryFn<UserAchievement>(query, [
        input.user_id,
        input.achievement_id,
        JSON.stringify(input.progress || {})
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error awarding achievement', { error, input });
      throw error;
    }
  }
  
  /**
   * Update user achievement progress
   */
  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    input: UpdateUserAchievementProgressDto
  ): Promise<UserAchievement | null> {
    try {
      // Check if user has this achievement
      const existingQuery = `
        SELECT * FROM user_achievements
        WHERE user_id = $1 AND achievement_id = $2
      `;
      
      const existingResult = await this.db.query(existingQuery, [userId, achievementId]);
      
      if (existingResult.rows.length === 0) {
        // User doesn't have this achievement yet, create initial progress record
        return this.awardAchievement({
          user_id: userId,
          achievement_id: achievementId,
          progress: input.progress
        });
      }
      
      // Update existing progress
      const query = `
        UPDATE user_achievements
        SET progress = $1
        WHERE user_id = $2 AND achievement_id = $3
        RETURNING *
      `;
      
      const result = await this.db.query<UserAchievement>(query, [
        JSON.stringify(input.progress),
        userId,
        achievementId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating achievement progress', { 
        error, 
        userId, 
        achievementId, 
        input 
      });
      throw error;
    }
  }
  
  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          ua.user_id,
          ua.achievement_id,
          ua.unlocked_at,
          ua.progress,
          a.name,
          a.description,
          a.image_url,
          a.points_reward,
          a.difficulty,
          a.requirements
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
        ORDER BY ua.unlocked_at DESC
      `;
      
      const result = await this.db.query(query, [userId]);
      
      // Process results to parse JSON fields
      return result.rows.map(row => ({
        ...row,
        progress: typeof row.progress === 'string' ? JSON.parse(row.progress) : row.progress,
        requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements
      }));
    } catch (error) {
      logger.error('Error getting user achievements', { error, userId });
      throw error;
    }
  }
  
  /**
   * Get user achievement by ID
   */
  async getUserAchievement(
    userId: string,
    achievementId: string
  ): Promise<UserAchievement | null> {
    try {
      const query = `
        SELECT *
        FROM user_achievements
        WHERE user_id = $1 AND achievement_id = $2
      `;
      
      const result = await this.db.query<UserAchievement>(query, [userId, achievementId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Parse progress JSON
      const achievement = result.rows[0];
      return {
        ...achievement,
        progress: typeof achievement.progress === 'string' 
          ? JSON.parse(achievement.progress) 
          : achievement.progress
      };
    } catch (error) {
      logger.error('Error getting user achievement', { error, userId, achievementId });
      throw error;
    }
  }
  
  /**
   * Check if user has specific achievement
   */
  async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1
          FROM user_achievements
          WHERE user_id = $1 AND achievement_id = $2
        ) as has_achievement
      `;
      
      const result = await this.db.query<{ has_achievement: boolean }>(query, [
        userId,
        achievementId
      ]);
      
      return result.rows[0].has_achievement;
    } catch (error) {
      logger.error('Error checking if user has achievement', { 
        error, 
        userId, 
        achievementId 
      });
      throw error;
    }
  }
  
  /**
   * Get recent achievements earned by any user
   */
  async getRecentAchievements(limit: number = 10): Promise<any[]> {
    try {
      const query = `
        SELECT 
          ua.user_id,
          ua.achievement_id,
          ua.unlocked_at,
          a.name,
          a.description,
          a.image_url,
          a.difficulty,
          u.display_name as user_name,
          p.avatar_url as user_avatar
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        JOIN users u ON ua.user_id = u.id
        LEFT JOIN profiles p ON ua.user_id = p.user_id
        ORDER BY ua.unlocked_at DESC
        LIMIT $1
      `;
      
      const result = await this.db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting recent achievements', { error, limit });
      throw error;
    }
  }
}
