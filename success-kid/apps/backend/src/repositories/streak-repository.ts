/**
 * Streak Repository
 * 
 * Handles data access for streak definitions and user streaks
 */
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base-repository';
import { 
  StreakDefinition,
  UserStreak,
  StreakMilestone,
  StreakActivityType,
  StreakThreshold,
  StreakUpdate,
  streakDefinitionDbMapping,
  userStreakDbMapping,
  streakMilestoneDbMapping
} from '../models/streak';
import { logger } from '../lib/logger';

export class StreakRepository extends BaseRepository<StreakDefinition> {
  constructor(db: Pool) {
    super(db, 'streak_definitions', 'id');
  }

  /**
   * Get all streak definitions
   */
  async getStreakDefinitions(): Promise<StreakDefinition[]> {
    try {
      const query = `
        SELECT * FROM streak_definitions
        ORDER BY name ASC
      `;
      
      const result = await this.db.query<StreakDefinition>(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting streak definitions', { error });
      throw error;
    }
  }

  /**
   * Get streak definition by activity type
   */
  async getStreakDefinitionByActivity(activityType: StreakActivityType): Promise<StreakDefinition | null> {
    try {
      const query = `
        SELECT * FROM streak_definitions
        WHERE activity_type = $1
      `;
      
      const result = await this.db.query<StreakDefinition>(query, [activityType]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting streak definition by activity', { error, activityType });
      throw error;
    }
  }

  /**
   * Create or update streak definition
   */
  async saveStreakDefinition(definition: StreakDefinition): Promise<StreakDefinition> {
    try {
      const existingDefinition = await this.findById(definition.id);
      
      if (existingDefinition) {
        // Update existing streak definition
        const query = `
          UPDATE streak_definitions
          SET name = $1, 
              activity_type = $2, 
              period_type = $3, 
              thresholds = $4, 
              description = $5,
              updated_at = NOW()
          WHERE id = $6
          RETURNING *
        `;
        
        const result = await this.db.query<StreakDefinition>(query, [
          definition.name,
          definition.activity_type,
          definition.period_type,
          JSON.stringify(definition.thresholds),
          definition.description,
          definition.id
        ]);
        
        return result.rows[0];
      } else {
        // Create new streak definition
        const query = `
          INSERT INTO streak_definitions (
            id, name, activity_type, period_type, thresholds, 
            description, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NULL)
          RETURNING *
        `;
        
        const result = await this.db.query<StreakDefinition>(query, [
          definition.id || uuidv4(),
          definition.name,
          definition.activity_type,
          definition.period_type,
          JSON.stringify(definition.thresholds),
          definition.description
        ]);
        
        return result.rows[0];
      }
    } catch (error) {
      logger.error('Error saving streak definition', { error, definition });
      throw error;
    }
  }

  /**
   * Get user streak
   */
  async getUserStreak(userId: string, activityType: StreakActivityType): Promise<UserStreak | null> {
    try {
      const query = `
        SELECT * FROM user_streaks
        WHERE user_id = $1 AND activity_type = $2
      `;
      
      const result = await this.db.query<UserStreak>(query, [userId, activityType]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user streak', { error, userId, activityType });
      throw error;
    }
  }

  /**
   * Get user streak with transaction client
   */
  async getUserStreakWithClient(
    client: PoolClient,
    userId: string,
    activityType: StreakActivityType
  ): Promise<UserStreak | null> {
    try {
      const query = `
        SELECT * FROM user_streaks
        WHERE user_id = $1 AND activity_type = $2
        FOR UPDATE
      `;
      
      const result = await client.query<UserStreak>(query, [userId, activityType]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user streak with client', { error, userId, activityType });
      throw error;
    }
  }

  /**
   * Get all user streaks
   */
  async getUserStreaks(userId: string): Promise<UserStreak[]> {
    try {
      const query = `
        SELECT * FROM user_streaks
        WHERE user_id = $1
      `;
      
      const result = await this.db.query<UserStreak>(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user streaks', { error, userId });
      throw error;
    }
  }

  /**
   * Create initial user streak
   */
  async createInitialUserStreak(
    userId: string, 
    activityType: StreakActivityType
  ): Promise<UserStreak> {
    try {
      // Check if streak already exists
      const existingStreak = await this.getUserStreak(userId, activityType);
      
      if (existingStreak) {
        return existingStreak;
      }
      
      // Create new streak
      const query = `
        INSERT INTO user_streaks (
          id, user_id, activity_type, current_count, longest_count,
          last_activity_date, created_at, updated_at
        )
        VALUES ($1, $2, $3, 0, 0, NULL, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await this.db.query<UserStreak>(query, [
        uuidv4(),
        userId,
        activityType
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating initial user streak', { error, userId, activityType });
      throw error;
    }
  }

  /**
   * Record user activity for streak
   */
  async recordActivity(
    userId: string,
    activityType: StreakActivityType
  ): Promise<StreakUpdate> {
    return this.executeTransaction(async (client) => {
      try {
        // Get or create user streak
        let streak = await this.getUserStreakWithClient(client, userId, activityType);
        
        if (!streak) {
          // Create streak record
          const createQuery = `
            INSERT INTO user_streaks (
              id, user_id, activity_type, current_count, longest_count,
              last_activity_date, created_at, updated_at
            )
            VALUES ($1, $2, $3, 0, 0, NULL, NOW(), NOW())
            RETURNING *
          `;
          
          const createResult = await client.query<UserStreak>(createQuery, [
            uuidv4(),
            userId,
            activityType
          ]);
          
          streak = createResult.rows[0];
        }
        
        // Get streak definition for period type and thresholds
        const streakDef = await this.getStreakDefinitionByActivity(activityType);
        
        // Get grace period from config (default 1 day)
        const gracePeriod = 1; // In days
        
        // Get current date
        const today = new Date();
        
        // Check if already recorded today
        if (streak.last_activity_date && this.isSameDay(streak.last_activity_date, today)) {
          // Already recorded today, no streak change
          return {
            currentStreak: streak.current_count,
            streakUpdated: false,
            lastActivityDate: today
          };
        }
        
        // Check if continuing streak (last activity was yesterday)
        const yesterdayDate = new Date(today);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        
        const continuingStreak = streak.last_activity_date && 
                                 this.isSameDay(streak.last_activity_date, yesterdayDate);
        
        // Apply grace period logic if configured
        const gracePeriodActive = !continuingStreak && 
                            streak.last_activity_date && 
                            this.isWithinGracePeriod(streak.last_activity_date, today, gracePeriod);
        
        // Update streak
        const newStreakCount = (continuingStreak || gracePeriodActive) ? 
                               streak.current_count + 1 : 1;
        
        // Update longest streak if needed
        const newLongestStreak = Math.max(streak.longest_count, newStreakCount);
        
        // Update record
        const updateQuery = `
          UPDATE user_streaks 
          SET current_count = $1, 
              longest_count = $2, 
              last_activity_date = $3, 
              updated_at = NOW() 
          WHERE id = $4
          RETURNING *
        `;
        
        const updateResult = await client.query<UserStreak>(updateQuery, [
          newStreakCount,
          newLongestStreak,
          today,
          streak.id
        ]);
        
        const updatedStreak = updateResult.rows[0];
        
        // Check for milestone based on thresholds
        let milestoneReached: number | undefined;
        let thresholdFound: StreakThreshold | undefined;
        
        if (streakDef && streakDef.thresholds) {
          thresholdFound = streakDef.thresholds.find(t => t.days === newStreakCount);
          
          if (thresholdFound) {
            milestoneReached = newStreakCount;
            
            // Record milestone
            await this.recordStreakMilestoneWithClient(
              client,
              userId,
              activityType,
              newStreakCount,
              thresholdFound.points_bonus
            );
          }
        }
        
        return {
          currentStreak: newStreakCount,
          streakUpdated: true,
          lastActivityDate: today,
          milestoneReached,
          gracePeriodUsed: gracePeriodActive
        };
      } catch (error) {
        logger.error('Error recording streak activity', { error, userId, activityType });
        throw error;
      }
    });
  }

  /**
   * Record streak milestone
   */
  async recordStreakMilestone(
    userId: string,
    activityType: StreakActivityType,
    days: number,
    pointsAwarded: number
  ): Promise<StreakMilestone> {
    try {
      const query = `
        INSERT INTO streak_milestones (
          id, user_id, activity_type, days, reached_at, points_awarded
        )
        VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING *
      `;
      
      const result = await this.db.query<StreakMilestone>(query, [
        uuidv4(),
        userId,
        activityType,
        days,
        pointsAwarded
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording streak milestone', { 
        error, 
        userId, 
        activityType, 
        days, 
        pointsAwarded 
      });
      throw error;
    }
  }

  /**
   * Record streak milestone with transaction client
   */
  private async recordStreakMilestoneWithClient(
    client: PoolClient,
    userId: string,
    activityType: StreakActivityType,
    days: number,
    pointsAwarded: number
  ): Promise<StreakMilestone> {
    try {
      const query = `
        INSERT INTO streak_milestones (
          id, user_id, activity_type, days, reached_at, points_awarded
        )
        VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING *
      `;
      
      const result = await client.query<StreakMilestone>(query, [
        uuidv4(),
        userId,
        activityType,
        days,
        pointsAwarded
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording streak milestone with client', { 
        error, 
        userId, 
        activityType, 
        days, 
        pointsAwarded 
      });
      throw error;
    }
  }

  /**
   * Get user streak milestones
   */
  async getUserStreakMilestones(
    userId: string,
    options: { 
      activityType?: StreakActivityType; 
      limit?: number; 
      offset?: number 
    } = {}
  ): Promise<StreakMilestone[]> {
    try {
      const { activityType, limit = 20, offset = 0 } = options;
      
      let query = `
        SELECT * FROM streak_milestones
        WHERE user_id = $1
      `;
      
      const queryParams: any[] = [userId];
      let paramIndex = 2;
      
      if (activityType) {
        query += ` AND activity_type = $${paramIndex++}`;
        queryParams.push(activityType);
      }
      
      query += ` ORDER BY reached_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);
      
      const result = await this.db.query<StreakMilestone>(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user streak milestones', { error, userId, options });
      throw error;
    }
  }

  /**
   * Get streak leaderboard
   */
  async getStreakLeaderboard(
    activityType: StreakActivityType,
    options: { limit?: number; offset?: number; } = {}
  ): Promise<{
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    currentCount: number;
    longestCount: number;
    lastActivityDate: Date | null;
  }[]> {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const query = `
        SELECT 
          us.user_id,
          u.display_name,
          p.avatar_url,
          us.current_count,
          us.longest_count,
          us.last_activity_date
        FROM user_streaks us
        JOIN users u ON us.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE us.activity_type = $1
          AND u.status = 'active'
          AND us.current_count > 0
        ORDER BY us.current_count DESC, us.longest_count DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [activityType, limit, offset]);
      
      return result.rows.map(row => ({
        userId: row.user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        currentCount: row.current_count,
        longestCount: row.longest_count,
        lastActivityDate: row.last_activity_date
      }));
    } catch (error) {
      logger.error('Error getting streak leaderboard', { error, activityType, options });
      throw error;
    }
  }

  /**
   * Reset expired streaks (for schedule job)
   */
  async resetExpiredStreaks(activityType: StreakActivityType, dayThreshold: number = 2): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dayThreshold);
      
      const query = `
        UPDATE user_streaks
        SET current_count = 0, updated_at = NOW()
        WHERE activity_type = $1
          AND last_activity_date < $2
          AND current_count > 0
        RETURNING id
      `;
      
      const result = await this.db.query(query, [activityType, cutoffDate]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error resetting expired streaks', { error, activityType, dayThreshold });
      throw error;
    }
  }

  /**
   * Utility: Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Utility: Check if date is within grace period
   */
  private isWithinGracePeriod(lastActivity: Date, currentDate: Date, gracePeriod: number): boolean {
    const lastActivityLocal = new Date(lastActivity);
    const currentDateLocal = new Date(currentDate);
    
    // Clear hours for date comparison
    lastActivityLocal.setHours(0, 0, 0, 0);
    currentDateLocal.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const diffTime = currentDateLocal.getTime() - lastActivityLocal.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if within grace period
    return diffDays <= (gracePeriod + 1) && diffDays > 1;
  }
}
