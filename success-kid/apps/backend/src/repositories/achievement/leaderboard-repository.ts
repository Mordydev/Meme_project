/**
 * Leaderboard Repository
 * 
 * Repository for managing leaderboards, rankings, and user positions.
 */
import { Pool } from 'pg';
import { BaseRepository } from '../base-repository';
import { logger } from '../../lib/logger';
import { DatabaseError } from '../../errors';
import {
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardOptions,
  LeaderboardResult,
  UserRank,
  getLeaderboardTimePeriod
} from '../../models/entities/achievement/leaderboard.model';

/**
 * Leaderboard repository implementation
 */
export class LeaderboardRepository extends BaseRepository<LeaderboardEntry> {
  /**
   * Create a new LeaderboardRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'leaderboard_entries');
  }

  /**
   * Get a leaderboard
   * 
   * @param category Leaderboard category
   * @param period Time period
   * @param options Optional parameters (limit, offset, etc.)
   * @returns Leaderboard result
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    options: LeaderboardOptions = {}
  ): Promise<LeaderboardResult> {
    try {
      const { limit = 100, offset = 0 } = options;
      
      // Get time period identifier for this leaderboard
      const timePeriod = getLeaderboardTimePeriod(period);
      
      // Get entries
      const entriesQuery = `
        SELECT le.*, u.display_name, p.level, p.avatar_url 
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE le.category = $1 AND le.period = $2
        ORDER BY le.rank ASC
        LIMIT $3 OFFSET $4
      `;
      
      const entriesResult = await this.db.query<LeaderboardEntry & {
        display_name: string;
        level: number;
        avatar_url: string;
      }>(entriesQuery, [category, period, limit, offset]);
      
      // Get total count
      const countResult = await this.db.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM leaderboard_entries WHERE category = $1 AND period = $2',
        [category, period]
      );
      
      const total = parseInt(countResult.rows[0].count, 10);
      
      // Get last updated timestamp
      const metaResult = await this.db.query<{ last_updated: Date }>(
        'SELECT MAX(updated_at) as last_updated FROM leaderboard_entries WHERE category = $1 AND period = $2',
        [category, period]
      );
      
      const lastUpdated = metaResult.rows[0]?.last_updated || new Date();
      
      // Transform entries to include user data
      const entries = entriesResult.rows.map(row => ({
        user_id: row.user_id,
        rank: row.rank,
        score: row.score,
        display_name: row.display_name,
        level: row.level,
        avatar_url: row.avatar_url,
        previous_rank: row.previous_rank,
        category: row.category,
        period: row.period,
        updated_at: row.updated_at
      }));
      
      // Construct the full result
      const result: LeaderboardResult = {
        category,
        period,
        entries,
        total,
        lastUpdated,
        userEntry: null // Will be populated by the service if needed
      };
      
      return result;
    } catch (error) {
      logger.error('Failed to get leaderboard', { category, period, options, error });
      throw new DatabaseError('Failed to get leaderboard', error);
    }
  }

  /**
   * Get a user's rank
   * 
   * @param userId User ID
   * @param category Leaderboard category
   * @param period Time period
   * @returns User rank information or null if not ranked
   */
  async getUserRank(
    userId: string,
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<UserRank | null> {
    try {
      // Get the user's entry
      const userEntryQuery = `
        SELECT le.*, u.display_name, p.level, p.avatar_url 
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE le.user_id = $1 AND le.category = $2 AND le.period = $3
      `;
      
      const userEntryResult = await this.db.query<LeaderboardEntry & {
        display_name: string;
        level: number;
        avatar_url: string;
      }>(userEntryQuery, [userId, category, period]);
      
      if (userEntryResult.rows.length === 0) {
        return null; // User not ranked
      }
      
      const userEntry = userEntryResult.rows[0];
      
      // Get total number of ranked users for percentile calculation
      const totalResult = await this.db.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM leaderboard_entries WHERE category = $1 AND period = $2',
        [category, period]
      );
      
      const totalEntries = parseInt(totalResult.rows[0].count, 10);
      
      // Calculate percentile (0-100, lower rank is better)
      const percentile = Math.max(0, Math.min(100, 100 - (userEntry.rank / totalEntries * 100)));
      
      // Get the user above (if any)
      const aboveUserQuery = `
        SELECT le.*, u.display_name, p.level, p.avatar_url 
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE le.category = $1 AND le.period = $2 AND le.rank = $3
        LIMIT 1
      `;
      
      const aboveUserResult = await this.db.query<LeaderboardEntry & {
        display_name: string;
        level: number;
        avatar_url: string;
      }>(aboveUserQuery, [category, period, userEntry.rank - 1]);
      
      // Get the user below (if any)
      const belowUserQuery = `
        SELECT le.*, u.display_name, p.level, p.avatar_url 
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE le.category = $1 AND le.period = $2 AND le.rank = $3
        LIMIT 1
      `;
      
      const belowUserResult = await this.db.query<LeaderboardEntry & {
        display_name: string;
        level: number;
        avatar_url: string;
      }>(belowUserQuery, [category, period, userEntry.rank + 1]);
      
      // Calculate movement (improvement or decline)
      const movement = userEntry.previous_rank
        ? userEntry.previous_rank - userEntry.rank
        : 0;
      
      // Assemble the rank info
      const rankInfo: UserRank = {
        userId,
        rank: userEntry.rank,
        score: userEntry.score,
        category,
        period,
        percentile,
        aboveUser: aboveUserResult.rows.length > 0 ? {
          user_id: aboveUserResult.rows[0].user_id,
          rank: aboveUserResult.rows[0].rank,
          score: aboveUserResult.rows[0].score,
          display_name: aboveUserResult.rows[0].display_name,
          level: aboveUserResult.rows[0].level,
          avatar_url: aboveUserResult.rows[0].avatar_url,
          previous_rank: aboveUserResult.rows[0].previous_rank,
          category: aboveUserResult.rows[0].category,
          period: aboveUserResult.rows[0].period,
          updated_at: aboveUserResult.rows[0].updated_at
        } : null,
        belowUser: belowUserResult.rows.length > 0 ? {
          user_id: belowUserResult.rows[0].user_id,
          rank: belowUserResult.rows[0].rank,
          score: belowUserResult.rows[0].score,
          display_name: belowUserResult.rows[0].display_name,
          level: belowUserResult.rows[0].level,
          avatar_url: belowUserResult.rows[0].avatar_url,
          previous_rank: belowUserResult.rows[0].previous_rank,
          category: belowUserResult.rows[0].category,
          period: belowUserResult.rows[0].period,
          updated_at: belowUserResult.rows[0].updated_at
        } : null,
        movement
      };
      
      return rankInfo;
    } catch (error) {
      logger.error('Failed to get user rank', { userId, category, period, error });
      throw new DatabaseError('Failed to get user rank', error);
    }
  }

  /**
   * Get the top ranked users
   * 
   * @param category Leaderboard category
   * @param period Time period
   * @param count Maximum number of users to return
   * @returns Array of top leaderboard entries
   */
  async getTopRanked(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    count: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const query = `
        SELECT le.*, u.display_name, p.level, p.avatar_url 
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE le.category = $1 AND le.period = $2
        ORDER BY le.rank ASC
        LIMIT $3
      `;
      
      const result = await this.db.query<LeaderboardEntry & {
        display_name: string;
        level: number;
        avatar_url: string;
      }>(query, [category, period, count]);
      
      // Transform entries to include user data
      return result.rows.map(row => ({
        user_id: row.user_id,
        rank: row.rank,
        score: row.score,
        display_name: row.display_name,
        level: row.level,
        avatar_url: row.avatar_url,
        previous_rank: row.previous_rank,
        category: row.category,
        period: row.period,
        updated_at: row.updated_at
      }));
    } catch (error) {
      logger.error('Failed to get top ranked users', { category, period, count, error });
      throw new DatabaseError('Failed to get top ranked users', error);
    }
  }

  /**
   * Refresh a leaderboard (recalculate scores and ranks)
   * 
   * @param category Leaderboard category
   * @param period Time period
   * @returns Number of entries affected
   */
  async refreshLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<number> {
    return this.withTransaction(async (client) => {
      try {
        // Step 1: Save current ranks before recalculating
        await client.query(`
          UPDATE leaderboard_entries
          SET previous_rank = rank
          WHERE category = $1 AND period = $2
        `, [category, period]);
        
        // Step 2: Calculate new scores based on category and period
        // The specific queries will vary based on what each leaderboard category represents
        
        let scoreQuery = '';
        
        if (category === 'points') {
          // Points leaderboard - sum points from relevant period
          if (period === 'daily') {
            scoreQuery = `
              SELECT user_id, COALESCE(SUM(amount), 0) as score
              FROM user_points
              WHERE amount > 0
                AND created_at >= CURRENT_DATE
                AND created_at < CURRENT_DATE + INTERVAL '1 day'
              GROUP BY user_id
              HAVING COALESCE(SUM(amount), 0) > 0
            `;
          } else if (period === 'weekly') {
            scoreQuery = `
              SELECT user_id, COALESCE(SUM(amount), 0) as score
              FROM user_points
              WHERE amount > 0
                AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
                AND created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
              GROUP BY user_id
              HAVING COALESCE(SUM(amount), 0) > 0
            `;
          } else if (period === 'monthly') {
            scoreQuery = `
              SELECT user_id, COALESCE(SUM(amount), 0) as score
              FROM user_points
              WHERE amount > 0
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
                AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
              GROUP BY user_id
              HAVING COALESCE(SUM(amount), 0) > 0
            `;
          } else if (period === 'allTime') {
            scoreQuery = `
              SELECT user_id, COALESCE(SUM(amount), 0) as score
              FROM user_points
              WHERE amount > 0
              GROUP BY user_id
              HAVING COALESCE(SUM(amount), 0) > 0
            `;
          }
        } else if (category === 'content') {
          // Content leaderboard - count content created in the period
          if (period === 'daily') {
            scoreQuery = `
              SELECT user_id, COUNT(*) as score
              FROM content
              WHERE created_at >= CURRENT_DATE
                AND created_at < CURRENT_DATE + INTERVAL '1 day'
                AND status = 'active'
              GROUP BY user_id
              HAVING COUNT(*) > 0
            `;
          } else if (period === 'weekly') {
            scoreQuery = `
              SELECT user_id, COUNT(*) as score
              FROM content
              WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
                AND created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
                AND status = 'active'
              GROUP BY user_id
              HAVING COUNT(*) > 0
            `;
          } else if (period === 'monthly') {
            scoreQuery = `
              SELECT user_id, COUNT(*) as score
              FROM content
              WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                AND status = 'active'
              GROUP BY user_id
              HAVING COUNT(*) > 0
            `;
          } else if (period === 'allTime') {
            scoreQuery = `
              SELECT user_id, COUNT(*) as score
              FROM content
              WHERE status = 'active'
              GROUP BY user_id
              HAVING COUNT(*) > 0
            `;
          }
        } else if (category === 'achievements') {
          // Achievements leaderboard - count unlocked achievements
          if (period === 'daily') {
            scoreQuery = `
              SELECT user_id, COUNT(*) as score
              FROM user_achievements
              WHERE unlocked_at >= CURRENT_DATE
                AND unlocked_at < CURRENT_DATE + INTERVAL '1 day'
              GROUP BY user_id
              HAVING COUNT(*) > 0
            `;
          } else if (period === 'weekly') {
            scoreQuery = `
              SELECT user_id, COUNT(*) as score
              FROM user_achievements
              WHERE unlocked_at >= DATE_TRUNC('week', CURRENT_DATE)
                AND unlocked_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
              GROUP BY user_id
              HAVING COUNT(*) > 0
            `;
          } else if (period === 'monthly') {
            scoreQuery = `
              SELECT user_id, COUNT(*) as score
              FROM user_achievements
              WHERE unlocked_at >= DATE_TRUNC('month', CURRENT_DATE)
                AND unlocked_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
              GROUP BY user_id
              HAVING COUNT(*) > 0
            `;
          } else if (period === 'allTime') {
            scoreQuery = `
              SELECT user_id, COUNT(*) as score
              FROM user_achievements
              WHERE unlocked_at IS NOT NULL
              GROUP BY user_id
              HAVING COUNT(*) > 0
            `;
          }
        }
        
        // Only proceed if we have a valid score query
        if (!scoreQuery) {
          throw new Error(`Unsupported category/period combination: ${category}/${period}`);
        }
        
        // Step 3: Create temp table with user scores
        await client.query(`
          CREATE TEMP TABLE temp_leaderboard_scores (
            user_id VARCHAR(255),
            score FLOAT,
            rank INT
          ) ON COMMIT DROP
        `);
        
        // Step 4: Insert scores into temp table
        await client.query(`
          INSERT INTO temp_leaderboard_scores(user_id, score)
          ${scoreQuery}
        `);
        
        // Step 5: Calculate ranks in temp table
        await client.query(`
          UPDATE temp_leaderboard_scores
          SET rank = t.rank
          FROM (
            SELECT user_id, 
                   ROW_NUMBER() OVER (ORDER BY score DESC) as rank
            FROM temp_leaderboard_scores
          ) t
          WHERE temp_leaderboard_scores.user_id = t.user_id
        `);
        
        // Step 6: Delete existing entries for this leaderboard
        await client.query(`
          DELETE FROM leaderboard_entries
          WHERE category = $1 AND period = $2
        `, [category, period]);
        
        // Step 7: Insert new entries
        const result = await client.query(`
          INSERT INTO leaderboard_entries(
            user_id, rank, score, previous_rank, category, period, updated_at
          )
          SELECT 
            user_id, 
            rank, 
            score, 
            NULL as previous_rank, 
            $1 as category, 
            $2 as period, 
            NOW() as updated_at
          FROM temp_leaderboard_scores
        `, [category, period]);
        
        return result.rowCount;
      } catch (error) {
        logger.error('Failed to refresh leaderboard', { category, period, error });
        throw error; // Will be caught by withTransaction
      }
    });
  }

  /**
   * Get all available leaderboard categories
   * 
   * @returns Array of available categories
   */
  async getAvailableCategories(): Promise<LeaderboardCategory[]> {
    try {
      const result = await this.db.query<{ category: LeaderboardCategory }>(
        'SELECT DISTINCT category FROM leaderboard_entries'
      );
      
      return result.rows.map(row => row.category);
    } catch (error) {
      logger.error('Failed to get available categories', { error });
      throw new DatabaseError('Failed to get available categories', error);
    }
  }

  /**
   * Convert a database row to a leaderboard entry entity
   * 
   * @param row Database row
   * @returns Leaderboard entry entity
   */
  protected mapToEntity(row: Record<string, any>): LeaderboardEntry {
    return {
      user_id: row.user_id,
      rank: row.rank,
      score: row.score,
      previous_rank: row.previous_rank,
      category: row.category,
      period: row.period,
      updated_at: row.updated_at
    };
  }
}
