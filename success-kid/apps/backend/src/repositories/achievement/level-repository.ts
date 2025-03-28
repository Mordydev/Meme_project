/**
 * Level Repository
 * 
 * Repository for managing user levels, experience points, and level progression.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '../base-repository';
import { logger } from '../../lib/logger';
import { DatabaseError } from '../../errors';
import {
  Level,
  UserLevel,
  XpTransaction,
  LEVEL_DATA
} from '../../models/entities/achievement/level.model';

/**
 * Level repository implementation
 */
export class LevelRepository extends BaseRepository<Level> {
  /**
   * Create a new LevelRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'levels');
  }

  /**
   * Get a level definition by level number
   * 
   * @param level Level number
   * @returns Level definition or null if not found
   */
  async getLevelDefinition(level: number): Promise<Level | null> {
    try {
      const result = await this.db.query<Level>(
        'SELECT * FROM levels WHERE level = $1',
        [level]
      );
      
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to get level definition', { level, error });
      throw new DatabaseError('Failed to get level definition', error);
    }
  }

  /**
   * Get all level definitions
   * 
   * @returns Array of level definitions
   */
  async getAllLevelDefinitions(): Promise<Level[]> {
    try {
      const result = await this.db.query<Level>(
        'SELECT * FROM levels ORDER BY level'
      );
      
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to get all level definitions', { error });
      throw new DatabaseError('Failed to get all level definitions', error);
    }
  }

  /**
   * Get a user's current level
   * 
   * @param userId User ID
   * @returns User level info or null if not found
   */
  async getUserLevel(userId: string): Promise<UserLevel | null> {
    try {
      const result = await this.db.query<UserLevel>(
        'SELECT * FROM user_levels WHERE user_id = $1',
        [userId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Failed to get user level', { userId, error });
      throw new DatabaseError('Failed to get user level', error);
    }
  }

  /**
   * Initialize user level record
   * 
   * @param userId User ID
   * @returns Created user level record
   */
  async initializeUserLevel(userId: string): Promise<UserLevel> {
    try {
      // Check if already exists
      const existing = await this.getUserLevel(userId);
      if (existing) {
        return existing;
      }
      
      const result = await this.db.query<UserLevel>(
        `INSERT INTO user_levels(user_id, level, current_xp, updated_at)
         VALUES($1, 1, 0, NOW())
         RETURNING *`,
        [userId]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to initialize user level', { userId, error });
      throw new DatabaseError('Failed to initialize user level', error);
    }
  }

  /**
   * Add XP to a user and check for level up
   * 
   * @param userId User ID
   * @param amount XP amount
   * @param source Source of XP
   * @param referenceId Optional reference ID
   * @returns Object with updated level info and level up status
   */
  async addXpAndCheckLevelUp(
    userId: string,
    amount: number,
    source: string,
    referenceId?: string
  ): Promise<{ 
    userLevel: UserLevel; 
    levelUp: boolean; 
    previousLevel: number; 
    transaction: XpTransaction;
  }> {
    return this.withTransaction(async (client) => {
      try {
        // Create XP transaction
        const txResult = await client.query<XpTransaction>(
          `INSERT INTO xp_transactions(id, user_id, amount, source, reference_id, created_at)
           VALUES($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [uuidv4(), userId, amount, source, referenceId || null]
        );
        
        const transaction = txResult.rows[0];
        
        // Get or create user level record
        let userLevelResult = await client.query<UserLevel>(
          'SELECT * FROM user_levels WHERE user_id = $1',
          [userId]
        );
        
        let userLevel: UserLevel;
        let isNew = false;
        
        if (userLevelResult.rows.length === 0) {
          // Create new user level record
          const insertResult = await client.query<UserLevel>(
            `INSERT INTO user_levels(user_id, level, current_xp, updated_at)
             VALUES($1, 1, 0, NOW())
             RETURNING *`,
            [userId]
          );
          
          userLevel = insertResult.rows[0];
          isNew = true;
        } else {
          userLevel = userLevelResult.rows[0];
        }
        
        // Remember previous level
        const previousLevel = userLevel.level;
        
        // Calculate new XP total
        const newXp = userLevel.current_xp + amount;
        
        // Get next level requirements
        const nextLevelResult = await client.query<Level>(
          'SELECT * FROM levels WHERE level = $1',
          [userLevel.level + 1]
        );
        
        // Check if level up
        let levelUp = false;
        let newLevel = userLevel.level;
        
        if (nextLevelResult.rows.length > 0 && newXp >= nextLevelResult.rows[0].xp_required) {
          // Find the highest level the user now qualifies for
          const allLevelsResult = await client.query<Level>(
            'SELECT * FROM levels WHERE xp_required <= $1 ORDER BY level DESC LIMIT 1',
            [newXp]
          );
          
          if (allLevelsResult.rows.length > 0) {
            newLevel = allLevelsResult.rows[0].level;
            levelUp = newLevel > previousLevel;
          }
        }
        
        // Update user level
        const updateResult = await client.query<UserLevel>(
          `UPDATE user_levels 
           SET level = $1, current_xp = $2, updated_at = NOW() 
           WHERE user_id = $3
           RETURNING *`,
          [newLevel, newXp, userId]
        );
        
        userLevel = updateResult.rows[0];
        
        // Also update the user's profile level
        await client.query(
          `UPDATE profiles 
           SET level = $1, updated_at = NOW() 
           WHERE user_id = $2`,
          [newLevel, userId]
        );
        
        return {
          userLevel,
          levelUp,
          previousLevel,
          transaction
        };
      } catch (error) {
        logger.error('Failed to add XP', { userId, amount, source, error });
        throw error; // Will be caught by withTransaction
      }
    });
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
      const result = await this.db.query<XpTransaction>(
        `SELECT * FROM xp_transactions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get XP transactions', { userId, limit, offset, error });
      throw new DatabaseError('Failed to get XP transactions', error);
    }
  }

  /**
   * Initialize level definitions in the database
   * 
   * @returns Array of created level definitions
   */
  async initializeLevelDefinitions(): Promise<Level[]> {
    return this.withTransaction(async (client) => {
      try {
        const results: Level[] = [];
        
        // Check if levels already exist
        const existingResult = await client.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM levels'
        );
        
        if (parseInt(existingResult.rows[0].count, 10) > 0) {
          // Levels already initialized
          const existingLevels = await client.query<Level>('SELECT * FROM levels ORDER BY level');
          return existingLevels.rows.map(row => this.mapToEntity(row));
        }
        
        // Insert predefined levels
        for (const level of LEVEL_DATA) {
          const result = await client.query<Level>(
            `INSERT INTO levels(
              level, title, xp_required, benefits, points_reward, created_at, updated_at
            ) VALUES($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *`,
            [
              level.level,
              level.title,
              level.xp_required,
              JSON.stringify(level.benefits),
              level.points_reward
            ]
          );
          
          results.push(this.mapToEntity(result.rows[0]));
        }
        
        return results;
      } catch (error) {
        logger.error('Failed to initialize level definitions', { error });
        throw error; // Will be caught by withTransaction
      }
    });
  }

  /**
   * Convert a database row to a level entity
   * 
   * @param row Database row
   * @returns Level entity
   */
  protected mapToEntity(row: Record<string, any>): Level {
    return {
      level: row.level,
      title: row.title,
      xp_required: row.xp_required,
      benefits: typeof row.benefits === 'string' 
        ? JSON.parse(row.benefits) 
        : row.benefits,
      points_reward: row.points_reward,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
