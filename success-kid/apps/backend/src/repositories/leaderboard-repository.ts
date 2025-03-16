/**
 * Leaderboard Repository
 * 
 * Handles data access for leaderboards and user rankings
 */
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base-repository';
import { 
  LeaderboardConfig,
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardResult,
  UserRank,
  LeaderboardOptions,
  leaderboardConfigDbMapping
} from '../models/leaderboard';
import { getRedisClient } from '../lib/db-client';
import { logger } from '../lib/logger';

export class LeaderboardRepository extends BaseRepository<LeaderboardConfig> {
  private redis = getRedisClient();
  private CACHE_TTL = {
    daily: 60 * 60, // 1 hour
    weekly: 60 * 60 * 3, // 3 hours
    monthly: 60 * 60 * 6, // 6 hours
    all_time: 60 * 60 * 12, // 12 hours
    season: 60 * 60 * 6 // 6 hours
  };
  
  constructor(db: Pool) {
    super(db, 'leaderboard_configs', 'id');
  }

  /**
   * Get leaderboard configuration by category and period
   */
  async getLeaderboardConfig(
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<LeaderboardConfig | null> {
    try {
      const query = `
        SELECT * FROM leaderboard_configs
        WHERE category = $1 AND period = $2
      `;
      
      const result = await this.db.query<LeaderboardConfig>(query, [category, period]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting leaderboard config', { error, category, period });
      throw error;
    }
  }

  /**
   * Get all active leaderboard configurations
   */
  async getActiveLeaderboardConfigs(): Promise<LeaderboardConfig[]> {
    try {
      const query = `
        SELECT * FROM leaderboard_configs
        WHERE is_active = true
        ORDER BY category, period
      `;
      
      const result = await this.db.query<LeaderboardConfig>(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting active leaderboard configs', { error });
      throw error;
    }
  }

  /**
   * Get active categories with periods
   */
  async getActiveCategories(): Promise<{
    category: LeaderboardCategory;
    periods: LeaderboardPeriod[];
    title: string;
  }[]> {
    try {
      // Get all active leaderboard configs
      const configs = await this.getActiveLeaderboardConfigs();
      
      // Group by category
      const categoryMap = new Map<LeaderboardCategory, Set<LeaderboardPeriod>>();
      const titles = new Map<LeaderboardCategory, string>();
      
      for (const config of configs) {
        // Add period to category
        if (!categoryMap.has(config.category)) {
          categoryMap.set(config.category, new Set<LeaderboardPeriod>());
        }
        categoryMap.get(config.category)!.add(config.period);
        
        // Store title if not already set
        if (!titles.has(config.category)) {
          titles.set(config.category, config.title.split(' - ')[0]);
        }
      }
      
      // Convert map to array result
      const result = Array.from(categoryMap.entries()).map(([category, periodsSet]) => ({
        category,
        periods: Array.from(periodsSet),
        title: titles.get(category) || category
      }));
      
      return result;
    } catch (error) {
      logger.error('Error getting active categories', { error });
      throw error;
    }
  }

  /**
   * Generate and store leaderboard
   */
  async generateLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<void> {
    return this.executeTransaction(async (client) => {
      try {
        // Get leaderboard config
        const config = await this.getLeaderboardConfig(category, period);
        
        if (!config || !config.is_active) {
          throw new Error(`Leaderboard ${category}:${period} is not active or doesn't exist`);
        }
        
        // Generate leaderboard entries based on category and period
        const entries = await this.generateLeaderboardEntries(client, config);
        
        if (entries.length === 0) {
          return;
        }
        
        // Clear existing entries
        await client.query(
          `DELETE FROM leaderboard_entries WHERE leaderboard_id = $1`,
          [config.id]
        );
        
        // Batch insert new entries
        const insertQuery = `
          INSERT INTO leaderboard_entries (
            id, leaderboard_id, user_id, rank, score, previous_rank, timestamp
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `;
        
        for (const entry of entries) {
          await client.query(insertQuery, [
            uuidv4(),
            config.id,
            entry.userId,
            entry.rank,
            entry.score,
            entry.previousRank || null
          ]);
        }
        
        // Invalidate cache
        await this.invalidateLeaderboardCache(category, period);
      } catch (error) {
        logger.error('Error generating leaderboard', { error, category, period });
        throw error;
      }
    });
  }

  /**
   * Get leaderboard data with options
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    options: LeaderboardOptions = {}
  ): Promise<LeaderboardResult> {
    try {
      const { 
        limit = 100, 
        offset = 0, 
        includeUserDetails = true, 
        aroundUserId, 
        aroundRank = 5 
      } = options;
      
      // Try to get from cache if not "around user" query
      if (!aroundUserId) {
        const cacheKey = `leaderboard:${category}:${period}:${limit}:${offset}:${includeUserDetails}`;
        const cached = await this.redis.get(cacheKey);
        
        if (cached) {
          return JSON.parse(cached);
        }
      }
      
      // Get leaderboard config
      const config = await this.getLeaderboardConfig(category, period);
      
      if (!config || !config.is_active) {
        throw new Error(`Leaderboard ${category}:${period} is not active or doesn't exist`);
      }
      
      let entries: UserRank[] = [];
      let total = 0;
      
      if (aroundUserId) {
        // Get entries around specific user
        const userRank = await this.getUserRank(category, period, aroundUserId);
        
        if (!userRank || userRank.rank === 0) {
          // User not on leaderboard, return regular leaderboard
          ({ entries, total } = await this.getLeaderboardEntries(
            config.id, 
            { limit, offset, includeUserDetails }
          ));
        } else {
          // Calculate range around user
          const startRank = Math.max(1, userRank.rank - aroundRank);
          const endRank = userRank.rank + aroundRank;
          
          // Get entries in rank range
          ({ entries, total } = await this.getLeaderboardEntriesByRankRange(
            config.id, 
            startRank, 
            endRank, 
            includeUserDetails
          ));
        }
      } else {
        // Get regular paginated entries
        ({ entries, total } = await this.getLeaderboardEntries(
          config.id, 
          { limit, offset, includeUserDetails }
        ));
      }
      
      const result: LeaderboardResult = {
        category,
        period,
        title: config.title,
        description: config.description || undefined,
        lastUpdated: new Date().toISOString(),
        entries,
        total
      };
      
      // Cache result if not "around user" query
      if (!aroundUserId) {
        const cacheKey = `leaderboard:${category}:${period}:${limit}:${offset}:${includeUserDetails}`;
        await this.redis.set(
          cacheKey, 
          JSON.stringify(result), 
          'EX', 
          this.CACHE_TTL[period] || 3600
        );
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting leaderboard', { error, category, period, options });
      throw error;
    }
  }

  /**
   * Get user rank in a specific leaderboard
   */
  async getUserRank(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    userId: string
  ): Promise<UserRank | null> {
    try {
      // Try to get from cache
      const cacheKey = `userrank:${category}:${period}:${userId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Get leaderboard config
      const config = await this.getLeaderboardConfig(category, period);
      
      if (!config || !config.is_active) {
        throw new Error(`Leaderboard ${category}:${period} is not active or doesn't exist`);
      }
      
      // Get user entry
      const query = `
        SELECT 
          le.rank, 
          le.score, 
          le.previous_rank, 
          u.display_name, 
          p.avatar_url,
          p.level
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE le.leaderboard_id = $1 AND le.user_id = $2
      `;
      
      const result = await this.db.query(query, [config.id, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const entry = result.rows[0];
      const rank = parseInt(entry.rank, 10);
      const previousRank = entry.previous_rank ? parseInt(entry.previous_rank, 10) : undefined;
      
      // Get total entries for percentile calculation
      const totalQuery = `
        SELECT COUNT(*) as total FROM leaderboard_entries
        WHERE leaderboard_id = $1
      `;
      
      const totalResult = await this.db.query<{ total: string }>(totalQuery, [config.id]);
      const total = parseInt(totalResult.rows[0].total, 10);
      
      // Calculate percentile (lower is better)
      const percentile = total > 0 ? Math.round((rank / total) * 100) : 0;
      
      const userRank: UserRank = {
        userId,
        rank,
        score: parseFloat(entry.score),
        previousRank,
        category,
        period,
        rankChange: previousRank ? previousRank - rank : undefined,
        percentile,
        displayName: entry.display_name,
        avatarUrl: entry.avatar_url,
        level: entry.level ? parseInt(entry.level, 10) : undefined
      };
      
      // Cache result
      await this.redis.set(
        cacheKey, 
        JSON.stringify(userRank), 
        'EX', 
        this.CACHE_TTL[period] || 3600
      );
      
      return userRank;
    } catch (error) {
      logger.error('Error getting user rank', { error, category, period, userId });
      throw error;
    }
  }

  /**
   * Gets all user ranks across different leaderboards
   */
  async getAllUserRanks(userId: string): Promise<Record<LeaderboardCategory, Record<LeaderboardPeriod, UserRank | null>>> {
    try {
      // Get all active leaderboard configs
      const configs = await this.getActiveLeaderboardConfigs();
      
      // Initialize result structure
      const result: Record<LeaderboardCategory, Record<LeaderboardPeriod, UserRank | null>> = {} as any;
      
      for (const config of configs) {
        // Initialize category if not exist
        if (!result[config.category]) {
          result[config.category] = {} as Record<LeaderboardPeriod, UserRank | null>;
        }
        
        // Get user rank
        const userRank = await this.getUserRank(config.category, config.period, userId);
        result[config.category][config.period] = userRank;
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting all user ranks', { error, userId });
      throw error;
    }
  }

  /**
   * Invalidate leaderboard cache
   */
  async invalidateLeaderboardCache(
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<void> {
    try {
      // Get all cache keys for this leaderboard
      const pattern = `leaderboard:${category}:${period}:*`;
      const keys = await this.redis.keys(pattern);
      
      // Also invalidate user ranks for this leaderboard
      const userRankPattern = `userrank:${category}:${period}:*`;
      const userRankKeys = await this.redis.keys(userRankPattern);
      
      const allKeys = [...keys, ...userRankKeys];
      
      if (allKeys.length > 0) {
        // Delete all matching keys
        await this.redis.del(...allKeys);
      }
    } catch (error) {
      logger.error('Error invalidating leaderboard cache', { error, category, period });
      // Continue without throwing to avoid blocking operation
    }
  }

  /**
   * Private: Generate leaderboard entries based on category
   */
  private async generateLeaderboardEntries(
    client: PoolClient,
    config: LeaderboardConfig
  ): Promise<Array<{
    userId: string;
    rank: number;
    score: number;
    previousRank?: number;
  }>> {
    // Get time range based on period
    const timeConstraint = this.getTimeConstraint(config.period);
    
    let query = '';
    let result;
    
    switch (config.category) {
      case 'points':
        // Points leaderboard
        query = `
          WITH rankings AS (
            SELECT 
              u.id AS user_id,
              COALESCE(SUM(up.amount), 0) AS score,
              ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(up.amount), 0) DESC) AS rank
            FROM users u
            LEFT JOIN user_points up ON u.id = up.user_id
            ${timeConstraint ? `WHERE ${timeConstraint} AND u.status = 'active'` : `WHERE u.status = 'active'`}
            GROUP BY u.id
            HAVING COALESCE(SUM(up.amount), 0) > 0
            ORDER BY score DESC
            LIMIT $1
          ),
          prev_rank AS (
            SELECT 
              le.user_id,
              le.rank AS previous_rank
            FROM leaderboard_entries le
            WHERE le.leaderboard_id = $2
          )
          SELECT 
            r.user_id, 
            r.rank, 
            r.score, 
            pr.previous_rank
          FROM rankings r
          LEFT JOIN prev_rank pr ON r.user_id = pr.user_id
          ORDER BY r.rank ASC
        `;
        
        result = await client.query(query, [config.display_limit, config.id]);
        break;
        
      case 'content':
        // Content creation leaderboard
        query = `
          WITH rankings AS (
            SELECT 
              u.id AS user_id,
              COUNT(c.id) AS score,
              ROW_NUMBER() OVER (ORDER BY COUNT(c.id) DESC) AS rank
            FROM users u
            LEFT JOIN content c ON u.id = c.user_id
            ${timeConstraint ? `WHERE ${timeConstraint.replace('up.created_at', 'c.created_at')} AND u.status = 'active'` : `WHERE u.status = 'active'`}
            GROUP BY u.id
            HAVING COUNT(c.id) > 0
            ORDER BY score DESC
            LIMIT $1
          ),
          prev_rank AS (
            SELECT 
              le.user_id,
              le.rank AS previous_rank
            FROM leaderboard_entries le
            WHERE le.leaderboard_id = $2
          )
          SELECT 
            r.user_id, 
            r.rank, 
            r.score, 
            pr.previous_rank
          FROM rankings r
          LEFT JOIN prev_rank pr ON r.user_id = pr.user_id
          ORDER BY r.rank ASC
        `;
        
        result = await client.query(query, [config.display_limit, config.id]);
        break;
        
      case 'engagement':
        // Engagement leaderboard (comments, reactions, etc.)
        query = `
          WITH rankings AS (
            SELECT 
              u.id AS user_id,
              COUNT(DISTINCT cm.id) + COUNT(DISTINCT r.id) AS score,
              ROW_NUMBER() OVER (ORDER BY (COUNT(DISTINCT cm.id) + COUNT(DISTINCT r.id)) DESC) AS rank
            FROM users u
            LEFT JOIN comments cm ON u.id = cm.user_id
            LEFT JOIN reactions r ON u.id = r.user_id
            ${timeConstraint 
              ? `WHERE (${timeConstraint.replace('up.created_at', 'cm.created_at')} OR ${timeConstraint.replace('up.created_at', 'r.created_at')}) AND u.status = 'active'` 
              : `WHERE u.status = 'active'`}
            GROUP BY u.id
            HAVING (COUNT(DISTINCT cm.id) + COUNT(DISTINCT r.id)) > 0
            ORDER BY score DESC
            LIMIT $1
          ),
          prev_rank AS (
            SELECT 
              le.user_id,
              le.rank AS previous_rank
            FROM leaderboard_entries le
            WHERE le.leaderboard_id = $2
          )
          SELECT 
            r.user_id, 
            r.rank, 
            r.score, 
            pr.previous_rank
          FROM rankings r
          LEFT JOIN prev_rank pr ON r.user_id = pr.user_id
          ORDER BY r.rank ASC
        `;
        
        result = await client.query(query, [config.display_limit, config.id]);
        break;
        
      case 'referrals':
        // Referral leaderboard
        query = `
          WITH rankings AS (
            SELECT 
              u.id AS user_id,
              COUNT(r.id) AS score,
              ROW_NUMBER() OVER (ORDER BY COUNT(r.id) DESC) AS rank
            FROM users u
            LEFT JOIN referrals r ON u.id = r.referrer_id
            ${timeConstraint ? `WHERE ${timeConstraint.replace('up.created_at', 'r.created_at')} AND u.status = 'active'` : `WHERE u.status = 'active'`}
            GROUP BY u.id
            HAVING COUNT(r.id) > 0
            ORDER BY score DESC
            LIMIT $1
          ),
          prev_rank AS (
            SELECT 
              le.user_id,
              le.rank AS previous_rank
            FROM leaderboard_entries le
            WHERE le.leaderboard_id = $2
          )
          SELECT 
            r.user_id, 
            r.rank, 
            r.score, 
            pr.previous_rank
          FROM rankings r
          LEFT JOIN prev_rank pr ON r.user_id = pr.user_id
          ORDER BY r.rank ASC
        `;
        
        result = await client.query(query, [config.display_limit, config.id]);
        break;
        
      case 'achievements':
        // Achievements leaderboard
        query = `
          WITH rankings AS (
            SELECT 
              u.id AS user_id,
              COUNT(ua.id) AS score,
              ROW_NUMBER() OVER (ORDER BY COUNT(ua.id) DESC) AS rank
            FROM users u
            LEFT JOIN user_achievements ua ON u.id = ua.user_id
            ${timeConstraint ? `WHERE ${timeConstraint.replace('up.created_at', 'ua.unlocked_at')} AND u.status = 'active'` : `WHERE u.status = 'active'`}
            GROUP BY u.id
            HAVING COUNT(ua.id) > 0
            ORDER BY score DESC
            LIMIT $1
          ),
          prev_rank AS (
            SELECT 
              le.user_id,
              le.rank AS previous_rank
            FROM leaderboard_entries le
            WHERE le.leaderboard_id = $2
          )
          SELECT 
            r.user_id, 
            r.rank, 
            r.score, 
            pr.previous_rank
          FROM rankings r
          LEFT JOIN prev_rank pr ON r.user_id = pr.user_id
          ORDER BY r.rank ASC
        `;
        
        result = await client.query(query, [config.display_limit, config.id]);
        break;
        
      case 'level':
        // Level leaderboard
        query = `
          WITH rankings AS (
            SELECT 
              u.id AS user_id,
              COALESCE(ul.level, 1) AS level,
              COALESCE(ul.total_xp, 0) AS score,
              ROW_NUMBER() OVER (ORDER BY COALESCE(ul.level, 1) DESC, COALESCE(ul.total_xp, 0) DESC) AS rank
            FROM users u
            LEFT JOIN user_levels ul ON u.id = ul.user_id
            WHERE u.status = 'active'
            ORDER BY level DESC, score DESC
            LIMIT $1
          ),
          prev_rank AS (
            SELECT 
              le.user_id,
              le.rank AS previous_rank
            FROM leaderboard_entries le
            WHERE le.leaderboard_id = $2
          )
          SELECT 
            r.user_id, 
            r.rank, 
            r.score, 
            pr.previous_rank
          FROM rankings r
          LEFT JOIN prev_rank pr ON r.user_id = pr.user_id
          ORDER BY r.rank ASC
        `;
        
        result = await client.query(query, [config.display_limit, config.id]);
        break;
        
      default:
        throw new Error(`Unsupported leaderboard category: ${config.category}`);
    }
    
    // Map database results to entry objects
    return result.rows.map(row => ({
      userId: row.user_id,
      rank: parseInt(row.rank, 10),
      score: parseFloat(row.score),
      previousRank: row.previous_rank ? parseInt(row.previous_rank, 10) : undefined
    }));
  }

  /**
   * Private: Get leaderboard entries with pagination
   */
  private async getLeaderboardEntries(
    leaderboardId: string,
    options: {
      limit?: number;
      offset?: number;
      includeUserDetails?: boolean;
    } = {}
  ): Promise<{
    entries: UserRank[];
    total: number;
  }> {
    try {
      const { limit = 100, offset = 0, includeUserDetails = true } = options;
      
      // Get leaderboard config for category and period info
      const configQuery = `
        SELECT * FROM leaderboard_configs
        WHERE id = $1
      `;
      
      const configResult = await this.db.query<LeaderboardConfig>(configQuery, [leaderboardId]);
      const config = configResult.rows[0];
      
      if (!config) {
        throw new Error(`Leaderboard configuration not found: ${leaderboardId}`);
      }
      
      // Get entries query
      let query;
      if (includeUserDetails) {
        query = `
          SELECT 
            le.user_id, 
            le.rank, 
            le.score, 
            le.previous_rank,
            u.display_name,
            p.avatar_url,
            p.level
          FROM leaderboard_entries le
          JOIN users u ON le.user_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE le.leaderboard_id = $1
          ORDER BY le.rank ASC
          LIMIT $2 OFFSET $3
        `;
      } else {
        query = `
          SELECT 
            le.user_id, 
            le.rank, 
            le.score, 
            le.previous_rank
          FROM leaderboard_entries le
          WHERE le.leaderboard_id = $1
          ORDER BY le.rank ASC
          LIMIT $2 OFFSET $3
        `;
      }
      
      const result = await this.db.query(query, [leaderboardId, limit, offset]);
      
      // Get total entries
      const totalQuery = `
        SELECT COUNT(*) as total FROM leaderboard_entries
        WHERE leaderboard_id = $1
      `;
      
      const totalResult = await this.db.query<{ total: string }>(totalQuery, [leaderboardId]);
      const total = parseInt(totalResult.rows[0].total, 10);
      
      // Map entries to UserRank objects
      const entries: UserRank[] = result.rows.map(row => ({
        userId: row.user_id,
        rank: parseInt(row.rank, 10),
        score: parseFloat(row.score),
        previousRank: row.previous_rank ? parseInt(row.previous_rank, 10) : undefined,
        category: config.category,
        period: config.period,
        rankChange: row.previous_rank ? (parseInt(row.previous_rank, 10) - parseInt(row.rank, 10)) : undefined,
        ...(includeUserDetails ? {
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          level: row.level ? parseInt(row.level, 10) : undefined
        } : {})
      }));
      
      return { entries, total };
    } catch (error) {
      logger.error('Error getting leaderboard entries', { error, leaderboardId, options });
      throw error;
    }
  }

  /**
   * Private: Get leaderboard entries by rank range (for "around user" queries)
   */
  private async getLeaderboardEntriesByRankRange(
    leaderboardId: string,
    startRank: number,
    endRank: number,
    includeUserDetails: boolean = true
  ): Promise<{
    entries: UserRank[];
    total: number;
  }> {
    try {
      // Get leaderboard config
      const configQuery = `
        SELECT * FROM leaderboard_configs
        WHERE id = $1
      `;
      
      const configResult = await this.db.query<LeaderboardConfig>(configQuery, [leaderboardId]);
      const config = configResult.rows[0];
      
      if (!config) {
        throw new Error(`Leaderboard configuration not found: ${leaderboardId}`);
      }
      
      // Get entries query
      let query;
      if (includeUserDetails) {
        query = `
          SELECT 
            le.user_id, 
            le.rank, 
            le.score, 
            le.previous_rank,
            u.display_name,
            p.avatar_url,
            p.level
          FROM leaderboard_entries le
          JOIN users u ON le.user_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE le.leaderboard_id = $1 AND le.rank BETWEEN $2 AND $3
          ORDER BY le.rank ASC
        `;
      } else {
        query = `
          SELECT 
            le.user_id, 
            le.rank, 
            le.score, 
            le.previous_rank
          FROM leaderboard_entries le
          WHERE le.leaderboard_id = $1 AND le.rank BETWEEN $2 AND $3
          ORDER BY le.rank ASC
        `;
      }
      
      const result = await this.db.query(query, [leaderboardId, startRank, endRank]);
      
      // Get total entries
      const totalQuery = `
        SELECT COUNT(*) as total FROM leaderboard_entries
        WHERE leaderboard_id = $1
      `;
      
      const totalResult = await this.db.query<{ total: string }>(totalQuery, [leaderboardId]);
      const total = parseInt(totalResult.rows[0].total, 10);
      
      // Map entries to UserRank objects
      const entries: UserRank[] = result.rows.map(row => ({
        userId: row.user_id,
        rank: parseInt(row.rank, 10),
        score: parseFloat(row.score),
        previousRank: row.previous_rank ? parseInt(row.previous_rank, 10) : undefined,
        category: config.category,
        period: config.period,
        rankChange: row.previous_rank ? (parseInt(row.previous_rank, 10) - parseInt(row.rank, 10)) : undefined,
        ...(includeUserDetails ? {
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          level: row.level ? parseInt(row.level, 10) : undefined
        } : {})
      }));
      
      return { entries, total };
    } catch (error) {
      logger.error('Error getting leaderboard entries by rank range', { 
        error, 
        leaderboardId, 
        startRank, 
        endRank 
      });
      throw error;
    }
  }

  /**
   * Private: Get time constraint SQL for different periods
   */
  private getTimeConstraint(period: LeaderboardPeriod): string | null {
    switch (period) {
      case 'daily':
        return 'up.created_at >= DATE_TRUNC(\'day\', NOW())';
      case 'weekly':
        return 'up.created_at >= DATE_TRUNC(\'week\', NOW())';
      case 'monthly':
        return 'up.created_at >= DATE_TRUNC(\'month\', NOW())';
      case 'season':
        // Assuming seasons are quarters
        return 'up.created_at >= DATE_TRUNC(\'quarter\', NOW())';
      case 'all_time':
        return null; // No time constraint
      default:
        return null;
    }
  }
}
