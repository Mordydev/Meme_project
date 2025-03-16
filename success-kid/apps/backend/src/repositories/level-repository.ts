/**
 * Level Repository
 * 
 * Handles data access for level definitions, user levels, and XP transactions
 */
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base-repository';
import { 
  LevelDefinition, 
  UserLevel, 
  XpTransaction,
  CreateXpTransactionDto,
  LevelUpHistory,
  LevelProgress
} from '../models/level';
import { logger } from '../lib/logger';

export class LevelRepository extends BaseRepository<LevelDefinition> {
  constructor(db: Pool) {
    super(db, 'level_definitions', 'level');
  }

  /**
   * Get all level definitions sorted by level
   */
  async getLevelDefinitions(): Promise<LevelDefinition[]> {
    try {
      const query = `
        SELECT * FROM level_definitions
        ORDER BY level ASC
      `;
      
      const result = await this.db.query<LevelDefinition>(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting level definitions', { error });
      throw error;
    }
  }

  /**
   * Get level definition by level
   */
  async getLevelDefinition(level: number): Promise<LevelDefinition | null> {
    try {
      const query = `
        SELECT * FROM level_definitions
        WHERE level = $1
      `;
      
      const result = await this.db.query<LevelDefinition>(query, [level]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting level definition', { error, level });
      throw error;
    }
  }

  /**
   * Get next level definition
   */
  async getNextLevelDefinition(currentLevel: number): Promise<LevelDefinition | null> {
    try {
      const query = `
        SELECT * FROM level_definitions
        WHERE level > $1
        ORDER BY level ASC
        LIMIT 1
      `;
      
      const result = await this.db.query<LevelDefinition>(query, [currentLevel]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting next level definition', { error, currentLevel });
      throw error;
    }
  }

  /**
   * Create or update level definition
   */
  async saveLevelDefinition(levelDefinition: LevelDefinition): Promise<LevelDefinition> {
    try {
      // Check if level definition already exists
      const existingLevel = await this.getLevelDefinition(levelDefinition.level);
      
      if (existingLevel) {
        // Update existing level
        const query = `
          UPDATE level_definitions
          SET title = $1, xp_required = $2, points_reward = $3, benefits = $4, icon_url = $5
          WHERE level = $6
          RETURNING *
        `;
        
        const result = await this.db.query<LevelDefinition>(query, [
          levelDefinition.title,
          levelDefinition.xp_required,
          levelDefinition.points_reward,
          JSON.stringify(levelDefinition.benefits),
          levelDefinition.icon_url,
          levelDefinition.level
        ]);
        
        return result.rows[0];
      } else {
        // Create new level
        const query = `
          INSERT INTO level_definitions 
            (level, title, xp_required, points_reward, benefits, icon_url)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const result = await this.db.query<LevelDefinition>(query, [
          levelDefinition.level,
          levelDefinition.title,
          levelDefinition.xp_required,
          levelDefinition.points_reward,
          JSON.stringify(levelDefinition.benefits),
          levelDefinition.icon_url
        ]);
        
        return result.rows[0];
      }
    } catch (error) {
      logger.error('Error saving level definition', { error, levelDefinition });
      throw error;
    }
  }

  /**
   * Delete level definition
   */
  async deleteLevelDefinition(level: number): Promise<boolean> {
    try {
      // Check if level is in use
      const usersWithLevel = await this.countUsersAtLevel(level);
      
      if (usersWithLevel > 0) {
        logger.warn(`Cannot delete level ${level} because it is in use by ${usersWithLevel} users`);
        return false;
      }
      
      const query = `
        DELETE FROM level_definitions
        WHERE level = $1
      `;
      
      const result = await this.db.query(query, [level]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting level definition', { error, level });
      throw error;
    }
  }

  /**
   * Count users at a specific level
   */
  async countUsersAtLevel(level: number): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM user_levels
        WHERE level = $1
      `;
      
      const result = await this.db.query<{ count: string }>(query, [level]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting users at level', { error, level });
      throw error;
    }
  }

  /**
   * Get user level
   */
  async getUserLevel(userId: string): Promise<UserLevel | null> {
    try {
      const query = `
        SELECT * FROM user_levels
        WHERE user_id = $1
      `;
      
      const result = await this.db.query<UserLevel>(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user level', { error, userId });
      throw error;
    }
  }

  /**
   * Get user level with database client (for transactions)
   */
  async getUserLevelWithClient(
    client: PoolClient, 
    userId: string
  ): Promise<UserLevel | null> {
    try {
      const query = `
        SELECT * FROM user_levels
        WHERE user_id = $1
        FOR UPDATE
      `;
      
      const result = await client.query<UserLevel>(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user level with client', { error, userId });
      throw error;
    }
  }

  /**
   * Create initial user level
   */
  async createInitialUserLevel(userId: string): Promise<UserLevel> {
    try {
      // Check if user already has a level
      const existingLevel = await this.getUserLevel(userId);
      
      if (existingLevel) {
        return existingLevel;
      }
      
      // Create initial user level (level 1, 0 XP)
      const query = `
        INSERT INTO user_levels (user_id, level, current_xp, total_xp, updated_at)
        VALUES ($1, 1, 0, 0, NOW())
        RETURNING *
      `;
      
      const result = await this.db.query<UserLevel>(query, [userId]);
      
      // Also update profile level
      await this.db.query(
        `UPDATE profiles SET level = 1 WHERE user_id = $1`,
        [userId]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating initial user level', { error, userId });
      throw error;
    }
  }

  /**
   * Add XP to user
   */
  async addXp(
    userId: string, 
    amount: number, 
    source: string,
    options: {
      referenceId?: string;
      description?: string;
    } = {}
  ): Promise<{ 
    transaction: XpTransaction; 
    newLevel: UserLevel; 
    levelUp: boolean; 
    previousLevel?: number;
  }> {
    return this.executeTransaction(async (client) => {
      try {
        if (amount <= 0) {
          throw new Error('XP amount must be positive');
        }
        
        // Get current user level (create if doesn't exist)
        let userLevel = await this.getUserLevelWithClient(client, userId);
        
        if (!userLevel) {
          // Create user level record
          const createQuery = `
            INSERT INTO user_levels (user_id, level, current_xp, total_xp, updated_at)
            VALUES ($1, 1, 0, 0, NOW())
            RETURNING *
          `;
          
          const createResult = await client.query<UserLevel>(createQuery, [userId]);
          userLevel = createResult.rows[0];
        }
        
        // Record XP transaction
        const transactionId = uuidv4();
        const txQuery = `
          INSERT INTO xp_transactions (
            id, user_id, amount, source, reference_id, created_at, description
          )
          VALUES ($1, $2, $3, $4, $5, NOW(), $6)
          RETURNING *
        `;
        
        const txResult = await client.query<XpTransaction>(txQuery, [
          transactionId,
          userId,
          amount,
          source,
          options.referenceId || null,
          options.description || null
        ]);
        
        const transaction = txResult.rows[0];
        
        // Calculate new XP total
        const newTotalXp = userLevel.total_xp + amount;
        const previousLevel = userLevel.level;
        let newLevel = previousLevel;
        let levelUp = false;
        
        // Check if user leveled up
        const levelsQuery = `
          SELECT * FROM level_definitions
          WHERE level > $1
          ORDER BY level ASC
        `;
        
        const levelsResult = await client.query<LevelDefinition>(levelsQuery, [previousLevel]);
        const nextLevels = levelsResult.rows;
        
        // Find the highest level the user now qualifies for
        for (const level of nextLevels) {
          if (newTotalXp >= level.xp_required) {
            newLevel = level.level;
            levelUp = true;
          } else {
            break; // Stop once we find a level the user hasn't reached
          }
        }
        
        // Update user level
        const updateQuery = `
          UPDATE user_levels
          SET level = $1, 
              current_xp = $2, 
              total_xp = $3, 
              updated_at = NOW()
          WHERE user_id = $4
          RETURNING *
        `;
        
        // Calculate current XP within the current level
        let currentLevelXp = newTotalXp;
        
        if (newLevel > 1) {
          // Get the XP required for the current level
          const currentLevelQuery = `
            SELECT xp_required FROM level_definitions
            WHERE level = $1
          `;
          
          const currentLevelResult = await client.query<{ xp_required: number }>(
            currentLevelQuery, 
            [newLevel]
          );
          
          const previousLevelXp = currentLevelResult.rows[0]?.xp_required || 0;
          currentLevelXp = newTotalXp - previousLevelXp;
        }
        
        const updateResult = await client.query<UserLevel>(updateQuery, [
          newLevel,
          currentLevelXp,
          newTotalXp,
          userId
        ]);
        
        const updatedUserLevel = updateResult.rows[0];
        
        // If level up occurred, record it and update profile
        if (levelUp) {
          // Record level up history
          const historyQuery = `
            INSERT INTO level_up_history (
              id, user_id, previous_level, new_level, timestamp
            )
            VALUES ($1, $2, $3, $4, NOW())
          `;
          
          await client.query(historyQuery, [
            uuidv4(),
            userId,
            previousLevel,
            newLevel
          ]);
          
          // Update profile level
          await client.query(
            `UPDATE profiles SET level = $1 WHERE user_id = $2`,
            [newLevel, userId]
          );
        }
        
        return {
          transaction,
          newLevel: updatedUserLevel,
          levelUp,
          previousLevel: levelUp ? previousLevel : undefined
        };
      } catch (error) {
        logger.error('Error adding XP', { error, userId, amount, source });
        throw error;
      }
    });
  }

  /**
   * Get XP transactions for a user
   */
  async getXpTransactions(
    userId: string,
    options: { limit?: number; offset?: number; source?: string } = {}
  ): Promise<XpTransaction[]> {
    try {
      const { limit = 20, offset = 0, source } = options;
      
      let query = `
        SELECT * FROM xp_transactions
        WHERE user_id = $1
      `;
      
      const queryParams: any[] = [userId];
      let paramIndex = 2;
      
      if (source) {
        query += ` AND source = $${paramIndex++}`;
        queryParams.push(source);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);
      
      const result = await this.db.query<XpTransaction>(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error getting XP transactions', { error, userId, options });
      throw error;
    }
  }

  /**
   * Get XP earned today by source
   */
  async getXpEarnedTodayBySource(userId: string, source: string): Promise<number> {
    try {
      const query = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM xp_transactions
        WHERE user_id = $1 
          AND source = $2
          AND created_at >= DATE_TRUNC('day', NOW())
      `;
      
      const result = await this.db.query<{ total: string }>(query, [userId, source]);
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Error getting XP earned today', { error, userId, source });
      throw error;
    }
  }

  /**
   * Get level up history for a user
   */
  async getLevelUpHistory(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<LevelUpHistory[]> {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const query = `
        SELECT * FROM level_up_history
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query<LevelUpHistory>(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting level up history', { error, userId, options });
      throw error;
    }
  }

  /**
   * Calculate level progress information
   */
  async calculateLevelProgress(userId: string): Promise<LevelProgress> {
    try {
      // Get user's current level
      const userLevel = await this.getUserLevel(userId);
      
      if (!userLevel) {
        // Return default level 1 progress if user has no level yet
        return {
          currentLevel: 1,
          nextLevel: 2,
          currentXp: 0,
          xpToNextLevel: 100, // Assuming level 2 requires 100 XP
          progress: 0,
          totalXp: 0
        };
      }
      
      // Get next level definition
      const nextLevel = await this.getNextLevelDefinition(userLevel.level);
      
      // Get current level definition to calculate progress
      const currentLevel = await this.getLevelDefinition(userLevel.level);
      
      if (!nextLevel) {
        // User is at max level
        return {
          currentLevel: userLevel.level,
          nextLevel: userLevel.level, // No next level
          currentXp: userLevel.current_xp,
          xpToNextLevel: 0,
          progress: 100, // Max progress
          totalXp: userLevel.total_xp
        };
      }
      
      // Calculate XP needed for next level
      const currentLevelXpRequired = currentLevel?.xp_required || 0;
      const nextLevelXpRequired = nextLevel.xp_required;
      const xpForCurrentLevel = nextLevelXpRequired - currentLevelXpRequired;
      
      // Calculate progress percentage
      const progress = Math.min(100, Math.max(0, 
        (userLevel.current_xp / xpForCurrentLevel) * 100
      ));
      
      return {
        currentLevel: userLevel.level,
        nextLevel: nextLevel.level,
        currentXp: userLevel.current_xp,
        xpToNextLevel: xpForCurrentLevel - userLevel.current_xp,
        progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
        totalXp: userLevel.total_xp
      };
    } catch (error) {
      logger.error('Error calculating level progress', { error, userId });
      throw error;
    }
  }

  /**
   * Get level leaderboard
   */
  async getLevelLeaderboard(
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    level: number;
    totalXp: number;
  }[]> {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const query = `
        SELECT 
          ul.user_id AS user_id,
          u.display_name,
          p.avatar_url,
          ul.level,
          ul.total_xp
        FROM user_levels ul
        JOIN users u ON ul.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.status = 'active'
        ORDER BY ul.level DESC, ul.total_xp DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await this.db.query(query, [limit, offset]);
      
      return result.rows.map(row => ({
        userId: row.user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        level: row.level,
        totalXp: row.total_xp
      }));
    } catch (error) {
      logger.error('Error getting level leaderboard', { error, options });
      throw error;
    }
  }

  /**
   * Get user rank in level leaderboard
   */
  async getUserLevelRank(userId: string): Promise<{
    rank: number;
    total: number;
  }> {
    try {
      // Get user's current level and XP
      const userLevel = await this.getUserLevel(userId);
      
      if (!userLevel) {
        return { rank: 0, total: 0 };
      }
      
      // Get user's rank
      const rankQuery = `
        SELECT 
          (SELECT COUNT(*) FROM user_levels ul2 
           JOIN users u ON ul2.user_id = u.id
           WHERE (ul2.level > ul1.level OR 
                 (ul2.level = ul1.level AND ul2.total_xp > ul1.total_xp))
                 AND u.status = 'active') + 1 AS rank,
          (SELECT COUNT(*) FROM user_levels
           JOIN users u ON user_levels.user_id = u.id
           WHERE u.status = 'active') AS total
        FROM user_levels ul1
        WHERE ul1.user_id = $1
      `;
      
      const result = await this.db.query<{ rank: string; total: string }>(rankQuery, [userId]);
      
      return {
        rank: parseInt(result.rows[0]?.rank || '0', 10),
        total: parseInt(result.rows[0]?.total || '0', 10)
      };
    } catch (error) {
      logger.error('Error getting user level rank', { error, userId });
      throw error;
    }
  }
}
