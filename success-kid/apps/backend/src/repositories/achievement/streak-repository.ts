/**
 * Streak Repository
 * 
 * Repository for managing user activity streaks, streak definitions, and streak tracking.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '../base-repository';
import { logger } from '../../lib/logger';
import { DatabaseError } from '../../errors';
import {
  StreakDefinition,
  UserStreak,
  StreakActivityType,
  PREDEFINED_STREAKS,
  ActivityData
} from '../../models/entities/achievement/streak.model';

/**
 * Streak repository implementation
 */
export class StreakRepository extends BaseRepository<StreakDefinition> {
  /**
   * Create a new StreakRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'streak_definitions');
  }

  /**
   * Get a streak definition by ID
   * 
   * @param id Streak definition ID
   * @returns Streak definition or null if not found
   */
  async getStreakDefinition(id: string): Promise<StreakDefinition | null> {
    try {
      const result = await this.db.query<StreakDefinition>(
        'SELECT * FROM streak_definitions WHERE id = $1',
        [id]
      );
      
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to get streak definition', { id, error });
      throw new DatabaseError('Failed to get streak definition', error);
    }
  }

  /**
   * Get streak definitions by activity type
   * 
   * @param activityType Type of activity
   * @returns Array of streak definitions
   */
  async getStreakDefinitionsByActivity(activityType: StreakActivityType): Promise<StreakDefinition[]> {
    try {
      const result = await this.db.query<StreakDefinition>(
        'SELECT * FROM streak_definitions WHERE activity_type = $1',
        [activityType]
      );
      
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to get streak definitions by activity', { activityType, error });
      throw new DatabaseError('Failed to get streak definitions by activity', error);
    }
  }

  /**
   * Get all streak definitions
   * 
   * @returns Array of streak definitions
   */
  async getAllStreakDefinitions(): Promise<StreakDefinition[]> {
    try {
      const result = await this.db.query<StreakDefinition>(
        'SELECT * FROM streak_definitions ORDER BY activity_type, name'
      );
      
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to get all streak definitions', { error });
      throw new DatabaseError('Failed to get all streak definitions', error);
    }
  }

  /**
   * Get a user's streak for a specific streak definition
   * 
   * @param userId User ID
   * @param streakId Streak definition ID
   * @returns User streak or null if not found
   */
  async getUserStreak(userId: string, streakId: string): Promise<UserStreak | null> {
    try {
      const result = await this.db.query<UserStreak>(
        'SELECT * FROM user_streaks WHERE user_id = $1 AND streak_id = $2',
        [userId, streakId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Failed to get user streak', { userId, streakId, error });
      throw new DatabaseError('Failed to get user streak', error);
    }
  }

  /**
   * Get all streaks for a user
   * 
   * @param userId User ID
   * @returns Array of user streaks with streak definitions
   */
  async getUserStreaks(userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT us.*, sd.*
        FROM user_streaks us
        JOIN streak_definitions sd ON us.streak_id = sd.id
        WHERE us.user_id = $1
        ORDER BY us.current_count DESC, sd.activity_type, sd.name
      `;
      
      const result = await this.db.query(query, [userId]);
      
      // Transform the results into a more useful structure
      return result.rows.map(row => ({
        userStreak: {
          user_id: row.user_id,
          streak_id: row.streak_id,
          current_count: row.current_count,
          longest_count: row.longest_count,
          last_activity_date: row.last_activity_date,
          grace_period_used: row.grace_period_used,
          updated_at: row.updated_at
        },
        definition: {
          id: row.id,
          name: row.name,
          activity_type: row.activity_type,
          period_type: row.period_type,
          thresholds: typeof row.thresholds === 'string' 
            ? JSON.parse(row.thresholds) 
            : row.thresholds,
          bonus_formula: row.bonus_formula
        }
      }));
    } catch (error) {
      logger.error('Failed to get user streaks', { userId, error });
      throw new DatabaseError('Failed to get user streaks', error);
    }
  }

  /**
   * Get user streaks by activity type
   * 
   * @param userId User ID
   * @param activityType Type of activity
   * @returns Array of user streaks for the activity type
   */
  async getUserStreaksByActivity(userId: string, activityType: StreakActivityType): Promise<any[]> {
    try {
      const query = `
        SELECT us.*, sd.*
        FROM user_streaks us
        JOIN streak_definitions sd ON us.streak_id = sd.id
        WHERE us.user_id = $1 AND sd.activity_type = $2
        ORDER BY us.current_count DESC
      `;
      
      const result = await this.db.query(query, [userId, activityType]);
      
      // Transform the results
      return result.rows.map(row => ({
        userStreak: {
          user_id: row.user_id,
          streak_id: row.streak_id,
          current_count: row.current_count,
          longest_count: row.longest_count,
          last_activity_date: row.last_activity_date,
          grace_period_used: row.grace_period_used,
          updated_at: row.updated_at
        },
        definition: {
          id: row.id,
          name: row.name,
          activity_type: row.activity_type,
          period_type: row.period_type,
          thresholds: typeof row.thresholds === 'string' 
            ? JSON.parse(row.thresholds) 
            : row.thresholds,
          bonus_formula: row.bonus_formula
        }
      }));
    } catch (error) {
      logger.error('Failed to get user streaks by activity', { userId, activityType, error });
      throw new DatabaseError('Failed to get user streaks by activity', error);
    }
  }

  /**
   * Record user activity and update streak
   * 
   * @param data Activity data
   * @returns Object with updated streak information
   */
  async recordActivity(data: ActivityData): Promise<{
    streakUpdated: boolean;
    currentCount: number;
    newMilestoneReached?: number;
    gracePeriodUsed?: boolean;
  }> {
    return this.withTransaction(async (client) => {
      try {
        const { userId, activityType, timestamp = new Date() } = data;
        
        // Get streak definitions for this activity type
        const definitionsResult = await client.query<StreakDefinition>(
          'SELECT * FROM streak_definitions WHERE activity_type = $1',
          [activityType]
        );
        
        if (definitionsResult.rows.length === 0) {
          // No streak definitions for this activity type
          return {
            streakUpdated: false,
            currentCount: 0
          };
        }
        
        // Process all relevant streak definitions
        const results = await Promise.all(definitionsResult.rows.map(async (definition) => {
          return this.updateStreakForDefinition(client, userId, definition, timestamp);
        }));
        
        // Find if any streak was updated and if any milestone was reached
        const anyUpdated = results.some(r => r.streakUpdated);
        const milestoneResults = results.filter(r => r.newMilestoneReached);
        const newMilestone = milestoneResults.length > 0 
          ? milestoneResults[0].newMilestoneReached 
          : undefined;
        
        // Get the highest current streak count
        const highestCount = Math.max(...results.map(r => r.currentCount));
        
        return {
          streakUpdated: anyUpdated,
          currentCount: highestCount,
          newMilestoneReached: newMilestone,
          gracePeriodUsed: results.some(r => r.gracePeriodUsed)
        };
      } catch (error) {
        logger.error('Failed to record activity', { data, error });
        throw error; // Will be caught by withTransaction
      }
    });
  }

  /**
   * Reset expired streaks
   * 
   * @returns Number of reset streaks
   */
  async resetExpiredStreaks(): Promise<number> {
    try {
      // For daily streaks, reset if more than a day has passed
      const result = await this.db.query(`
        UPDATE user_streaks us
        SET current_count = 1, 
            grace_period_used = false,
            updated_at = NOW()
        FROM streak_definitions sd
        WHERE us.streak_id = sd.id
        AND sd.period_type = 'daily'
        AND us.last_activity_date < NOW() - INTERVAL '2 days'
        AND us.current_count > 1
      `);
      
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to reset expired streaks', { error });
      throw new DatabaseError('Failed to reset expired streaks', error);
    }
  }

  /**
   * Create a new streak definition
   * 
   * @param data Streak definition data
   * @returns Created streak definition
   */
  async createStreakDefinition(
    data: Omit<StreakDefinition, 'id' | 'created_at' | 'updated_at'>
  ): Promise<StreakDefinition> {
    try {
      const id = uuidv4();
      
      const result = await this.db.query<StreakDefinition>(
        `INSERT INTO streak_definitions(
          id, name, activity_type, period_type, thresholds, bonus_formula, created_at, updated_at
        ) VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *`,
        [
          id,
          data.name,
          data.activity_type,
          data.period_type,
          JSON.stringify(data.thresholds),
          data.bonus_formula || null
        ]
      );
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create streak definition', { data, error });
      throw new DatabaseError('Failed to create streak definition', error);
    }
  }

  /**
   * Initialize streak definitions in the database
   * 
   * @returns Array of created streak definitions
   */
  async initializeStreakDefinitions(): Promise<StreakDefinition[]> {
    return this.withTransaction(async (client) => {
      try {
        const results: StreakDefinition[] = [];
        
        // Check if streak definitions already exist
        const existingResult = await client.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM streak_definitions'
        );
        
        if (parseInt(existingResult.rows[0].count, 10) > 0) {
          // Streak definitions already initialized
          const existingDefines = await client.query<StreakDefinition>(
            'SELECT * FROM streak_definitions ORDER BY activity_type, name'
          );
          return existingDefines.rows.map(row => this.mapToEntity(row));
        }
        
        // Insert predefined streak definitions
        for (const streak of PREDEFINED_STREAKS) {
          const result = await client.query<StreakDefinition>(
            `INSERT INTO streak_definitions(
              id, name, activity_type, period_type, thresholds, bonus_formula, created_at, updated_at
            ) VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *`,
            [
              uuidv4(),
              streak.name,
              streak.activity_type,
              streak.period_type,
              JSON.stringify(streak.thresholds),
              streak.bonus_formula || null
            ]
          );
          
          results.push(this.mapToEntity(result.rows[0]));
        }
        
        return results;
      } catch (error) {
        logger.error('Failed to initialize streak definitions', { error });
        throw error; // Will be caught by withTransaction
      }
    });
  }

  /**
   * Convert a database row to a streak definition entity
   * 
   * @param row Database row
   * @returns Streak definition entity
   */
  protected mapToEntity(row: Record<string, any>): StreakDefinition {
    return {
      id: row.id,
      name: row.name,
      activity_type: row.activity_type,
      period_type: row.period_type,
      thresholds: typeof row.thresholds === 'string' 
        ? JSON.parse(row.thresholds) 
        : row.thresholds,
      bonus_formula: row.bonus_formula,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Update streak for a specific definition
   * 
   * @param client Database client
   * @param userId User ID
   * @param definition Streak definition
   * @param timestamp Activity timestamp
   * @returns Updated streak information
   */
  private async updateStreakForDefinition(
    client: Pool,
    userId: string,
    definition: StreakDefinition,
    timestamp: Date
  ): Promise<{
    streakUpdated: boolean;
    currentCount: number;
    newMilestoneReached?: number;
    gracePeriodUsed?: boolean;
  }> {
    // Get current streak for user and definition
    const streakResult = await client.query<UserStreak>(
      'SELECT * FROM user_streaks WHERE user_id = $1 AND streak_id = $2',
      [userId, definition.id]
    );
    
    let streak: UserStreak;
    let isNew = false;
    
    if (streakResult.rows.length === 0) {
      // Create new streak
      const newStreakResult = await client.query<UserStreak>(
        `INSERT INTO user_streaks(
          user_id, streak_id, current_count, longest_count, 
          last_activity_date, grace_period_used, updated_at
        ) VALUES($1, $2, 1, 1, $3, false, NOW())
        RETURNING *`,
        [userId, definition.id, timestamp]
      );
      
      streak = newStreakResult.rows[0];
      isNew = true;
      
      return {
        streakUpdated: true,
        currentCount: 1
      };
    } else {
      streak = streakResult.rows[0];
    }
    
    // Check if activity has already been recorded today
    if (streak.last_activity_date && this.isSameDay(streak.last_activity_date, timestamp)) {
      // Already recorded today, no streak change
      return {
        streakUpdated: false,
        currentCount: streak.current_count
      };
    }
    
    // Check if continuing streak or new streak
    let isStreakContinuation = false;
    let useGracePeriod = false;
    
    if (streak.last_activity_date) {
      const yesterday = new Date(timestamp);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (this.isSameDay(streak.last_activity_date, yesterday)) {
        // Last activity was yesterday, continue streak
        isStreakContinuation = true;
      } else if (!streak.grace_period_used && this.isWithinGracePeriod(streak.last_activity_date, timestamp)) {
        // Within grace period, continue streak with grace
        isStreakContinuation = true;
        useGracePeriod = true;
      }
    }
    
    // Update streak count
    const newCount = isStreakContinuation ? streak.current_count + 1 : 1;
    const newLongest = Math.max(streak.longest_count, newCount);
    
    // Check if milestone reached
    let newMilestone: number | undefined;
    
    if (isStreakContinuation) {
      // Check thresholds
      for (const threshold of (typeof definition.thresholds === 'string' 
        ? JSON.parse(definition.thresholds) 
        : definition.thresholds)) {
        if (threshold.count === newCount) {
          newMilestone = threshold.count;
          break;
        }
      }
    }
    
    // Update streak record
    await client.query(
      `UPDATE user_streaks 
       SET current_count = $1, 
           longest_count = $2, 
           last_activity_date = $3, 
           grace_period_used = $4, 
           updated_at = NOW() 
       WHERE user_id = $5 AND streak_id = $6`,
      [newCount, newLongest, timestamp, useGracePeriod, userId, definition.id]
    );
    
    return {
      streakUpdated: true,
      currentCount: newCount,
      newMilestoneReached: newMilestone,
      gracePeriodUsed: useGracePeriod
    };
  }

  /**
   * Check if two dates are on the same day
   * 
   * @param date1 First date
   * @param date2 Second date
   * @returns True if dates are on the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Check if date is within grace period
   * 
   * @param lastActivity Last activity date
   * @param currentDate Current date
   * @returns True if within grace period
   */
  private isWithinGracePeriod(lastActivity: Date, currentDate: Date): boolean {
    // Grace period is 2 days (missed one day)
    const gracePeriodEnd = new Date(lastActivity);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 2);
    
    return currentDate <= gracePeriodEnd;
  }
}
