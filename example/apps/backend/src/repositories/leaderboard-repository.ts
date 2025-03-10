import { FastifyInstance } from 'fastify';
import { 
  LeaderboardCategory, 
  LeaderboardEntry, 
  LeaderboardPeriod, 
  LeaderboardResult,
  LEADERBOARD_QUERY_CONFIG
} from '../models/leaderboard';
import { TransactionManager } from '../lib/transaction';

/**
 * Repository for handling leaderboard data
 */
export class LeaderboardRepository {
  constructor(
    private fastify: FastifyInstance, 
    private transactionManager?: TransactionManager
  ) {}

  /**
   * Get leaderboard data
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    options: {
      period?: LeaderboardPeriod;
      limit?: number;
      offset?: number;
      userId?: string; // To include user's rank
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<LeaderboardResult> {
    // Set default options
    const period = options.period || LeaderboardPeriod.ALL_TIME;
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    // Get start and end dates based on period
    const { startDate, endDate } = this.getDateRangeForPeriod(period, options.startDate, options.endDate);
    
    // Get query configuration for this category
    const queryConfig = LEADERBOARD_QUERY_CONFIG[category];
    if (!queryConfig) {
      throw new Error(`Invalid leaderboard category: ${category}`);
    }
    
    // For points leaderboard, use points repository
    if (category === LeaderboardCategory.POINTS) {
      return this.getPointsLeaderboard(period, limit, offset, options.userId, startDate, endDate);
    }
    
    // Build SQL query based on configuration
    const sql = this.buildLeaderboardSql(queryConfig, startDate, endDate, limit, offset);
    
    // Execute query
    const { data, error } = await this.fastify.supabase.rpc('execute_leaderboard_query', {
      query_text: sql
    });
    
    if (error) {
      this.fastify.log.error(error, `Failed to get ${category} leaderboard for period ${period}`);
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }
    
    // Transform results to leaderboard entries
    const entries: LeaderboardEntry[] = data.map((item: any, index: number) => ({
      userId: item.user_id,
      username: item.username,
      displayName: item.display_name,
      avatarUrl: item.avatar_url,
      score: parseInt(item.score),
      rank: offset + index + 1
    }));
    
    // Get total entries for this leaderboard
    const totalQuery = this.buildLeaderboardCountSql(queryConfig, startDate, endDate);
    const { data: totalData, error: totalError } = await this.fastify.supabase.rpc('execute_scalar_query', {
      query_text: totalQuery
    });
    
    if (totalError) {
      this.fastify.log.error(totalError, `Failed to get total for ${category} leaderboard`);
      throw new Error(`Failed to get leaderboard total: ${totalError.message}`);
    }
    
    const total = parseInt(totalData[0]?.count || '0');
    
    // Get user's rank if requested
    let userRank;
    if (options.userId) {
      userRank = await this.getUserLeaderboardRank(
        options.userId, 
        category, 
        startDate, 
        endDate
      );
    }
    
    return {
      entries,
      total,
      userRank,
      period,
      category
    };
  }

  /**
   * Get leaderboard for points (uses points repository)
   */
  private async getPointsLeaderboard(
    period: LeaderboardPeriod,
    limit: number,
    offset: number,
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<LeaderboardResult> {
    // Because points is special and used frequently, we have dedicated functions
    const { data, error } = await this.fastify.supabase.rpc('get_points_leaderboard', {
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString(),
      limit_num: limit,
      offset_num: offset
    });
    
    if (error) {
      this.fastify.log.error(error, `Failed to get points leaderboard for period ${period}`);
      throw new Error(`Failed to get points leaderboard: ${error.message}`);
    }
    
    // Transform results to leaderboard entries
    const entries: LeaderboardEntry[] = data.map((item: any) => ({
      userId: item.user_id,
      username: item.username,
      displayName: item.display_name,
      avatarUrl: item.avatar_url,
      score: parseInt(item.total_points),
      rank: parseInt(item.rank)
    }));
    
    // Get total count
    const { count, error: countError } = await this.fastify.supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      this.fastify.log.error(countError, 'Failed to count users with points');
      throw new Error('Failed to count users with points');
    }
    
    // Get user's rank if requested
    let userRank;
    if (userId) {
      userRank = await this.getUserPointsRank(userId, startDate, endDate);
    }
    
    return {
      entries,
      total: count || 0,
      userRank,
      period,
      category: LeaderboardCategory.POINTS
    };
  }

  /**
   * Get user's rank in a specific leaderboard
   */
  async getUserLeaderboardRank(
    userId: string,
    category: LeaderboardCategory,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ rank: number; score: number } | undefined> {
    // For points leaderboard, use dedicated function
    if (category === LeaderboardCategory.POINTS) {
      return this.getUserPointsRank(userId, startDate, endDate);
    }
    
    // Get query configuration for this category
    const queryConfig = LEADERBOARD_QUERY_CONFIG[category];
    if (!queryConfig) {
      throw new Error(`Invalid leaderboard category: ${category}`);
    }
    
    // Build SQL query to get user's rank
    const sql = this.buildUserRankSql(queryConfig, userId, startDate, endDate);
    
    // Execute query
    const { data, error } = await this.fastify.supabase.rpc('execute_scalar_query', {
      query_text: sql
    });
    
    if (error) {
      this.fastify.log.error(error, `Failed to get user rank for ${category} leaderboard`);
      throw new Error(`Failed to get user rank: ${error.message}`);
    }
    
    // If no data, user has no rank
    if (!data || data.length === 0 || !data[0].rank) {
      return undefined;
    }
    
    return {
      rank: parseInt(data[0].rank),
      score: parseInt(data[0].score)
    };
  }

  /**
   * Get user's rank in the points leaderboard
   */
  private async getUserPointsRank(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ rank: number; score: number } | undefined> {
    // If date range provided, use period-specific function
    if (startDate) {
      const { data, error } = await this.fastify.supabase.rpc('get_user_points_rank_in_period', {
        user_id_param: userId,
        start_date: startDate.toISOString(),
        end_date: endDate?.toISOString() || new Date().toISOString()
      });
      
      if (error) {
        this.fastify.log.error(error, `Failed to get points rank for user ${userId} in period`);
        throw new Error(`Failed to get points rank: ${error.message}`);
      }
      
      if (!data || data.length === 0 || !data[0].rank) {
        return undefined;
      }
      
      return {
        rank: data[0].rank,
        score: data[0].total_points
      };
    } else {
      // For all-time, use standard function
      const { data, error } = await this.fastify.supabase.rpc('get_user_points_rank', {
        user_id_param: userId
      });
      
      if (error) {
        this.fastify.log.error(error, `Failed to get points rank for user ${userId}`);
        throw new Error(`Failed to get points rank: ${error.message}`);
      }
      
      if (!data || data.length === 0 || !data[0].rank) {
        return undefined;
      }
      
      return {
        rank: data[0].rank,
        score: data[0].total_points
      };
    }
  }

  /**
   * Convert a period to a date range
   */
  private getDateRangeForPeriod(
    period: LeaderboardPeriod,
    customStartDate?: Date,
    customEndDate?: Date
  ): { startDate?: Date; endDate?: Date } {
    // If custom dates are provided, use those
    if (customStartDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate || new Date()
      };
    }
    
    const now = new Date();
    const endDate = new Date(now);
    let startDate: Date;
    
    switch (period) {
      case LeaderboardPeriod.DAILY:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case LeaderboardPeriod.WEEKLY:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // First day of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        break;
      case LeaderboardPeriod.MONTHLY:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case LeaderboardPeriod.ALL_TIME:
      default:
        // No date filtering for all-time
        return {};
    }
    
    return { startDate, endDate };
  }

  /**
   * Build SQL query for leaderboard
   */
  private buildLeaderboardSql(
    queryConfig: typeof LEADERBOARD_QUERY_CONFIG[keyof typeof LEADERBOARD_QUERY_CONFIG],
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    offset?: number
  ): string {
    const { table, scoreField, joins = [], conditions = [], groupBy = [] } = queryConfig;
    
    // Start building query
    let sql = `
      SELECT 
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url,
        ${scoreField} as score
      FROM ${table} t
      JOIN profiles u ON ${table === 'profiles' ? 't.id' : 't.user_id'} = u.id
    `;
    
    // Add any joins
    if (joins.length > 0) {
      sql += ` ${joins.join(' ')}`;
    }
    
    // Start WHERE clause
    let whereConditions = [...conditions];
    
    // Add date filtering if needed
    if (startDate) {
      whereConditions.push(`t.created_at >= '${startDate.toISOString()}'`);
    }
    
    if (endDate) {
      whereConditions.push(`t.created_at <= '${endDate.toISOString()}'`);
    }
    
    // Add WHERE clause if there are conditions
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Add GROUP BY if needed
    if (groupBy.length > 0) {
      sql += ` GROUP BY ${groupBy.join(', ')}, u.id, u.username, u.display_name, u.avatar_url`;
    }
    
    // Add ORDER BY
    sql += ` ORDER BY score DESC`;
    
    // Add LIMIT and OFFSET
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    if (offset) {
      sql += ` OFFSET ${offset}`;
    }
    
    return sql;
  }

  /**
   * Build SQL query for counting total leaderboard entries
   */
  private buildLeaderboardCountSql(
    queryConfig: typeof LEADERBOARD_QUERY_CONFIG[keyof typeof LEADERBOARD_QUERY_CONFIG],
    startDate?: Date,
    endDate?: Date
  ): string {
    const { table, scoreField, joins = [], conditions = [], groupBy = [] } = queryConfig;
    
    // If no grouping, we can do a simple count
    if (groupBy.length === 0) {
      let sql = `SELECT COUNT(DISTINCT ${table === 'profiles' ? 't.id' : 't.user_id'}) as count FROM ${table} t`;
      
      // Add any joins
      if (joins.length > 0) {
        sql += ` ${joins.join(' ')}`;
      }
      
      // Start WHERE clause
      let whereConditions = [...conditions];
      
      // Add date filtering if needed
      if (startDate) {
        whereConditions.push(`t.created_at >= '${startDate.toISOString()}'`);
      }
      
      if (endDate) {
        whereConditions.push(`t.created_at <= '${endDate.toISOString()}'`);
      }
      
      // Add WHERE clause if there are conditions
      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      return sql;
    } else {
      // For grouped queries, we need to count the groups
      let sql = `
        SELECT COUNT(*) as count FROM (
          SELECT ${table === 'profiles' ? 't.id' : 't.user_id'}
          FROM ${table} t
      `;
      
      // Add any joins
      if (joins.length > 0) {
        sql += ` ${joins.join(' ')}`;
      }
      
      // Start WHERE clause
      let whereConditions = [...conditions];
      
      // Add date filtering if needed
      if (startDate) {
        whereConditions.push(`t.created_at >= '${startDate.toISOString()}'`);
      }
      
      if (endDate) {
        whereConditions.push(`t.created_at <= '${endDate.toISOString()}'`);
      }
      
      // Add WHERE clause if there are conditions
      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      // Add GROUP BY
      sql += ` GROUP BY ${groupBy.join(', ')}`;
      
      // Close subquery
      sql += `) as subquery`;
      
      return sql;
    }
  }

  /**
   * Build SQL query for getting a user's rank
   */
  private buildUserRankSql(
    queryConfig: typeof LEADERBOARD_QUERY_CONFIG[keyof typeof LEADERBOARD_QUERY_CONFIG],
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): string {
    const { table, scoreField, joins = [], conditions = [], groupBy = [] } = queryConfig;
    
    // Start building query
    let sql = `
      WITH leaderboard AS (
        SELECT 
          ${table === 'profiles' ? 't.id' : 't.user_id'} as user_id,
          ${scoreField} as score,
          RANK() OVER (ORDER BY ${scoreField} DESC) as rank
        FROM ${table} t
    `;
    
    // Add any joins
    if (joins.length > 0) {
      sql += ` ${joins.join(' ')}`;
    }
    
    // Start WHERE clause
    let whereConditions = [...conditions];
    
    // Add date filtering if needed
    if (startDate) {
      whereConditions.push(`t.created_at >= '${startDate.toISOString()}'`);
    }
    
    if (endDate) {
      whereConditions.push(`t.created_at <= '${endDate.toISOString()}'`);
    }
    
    // Add WHERE clause if there are conditions
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Add GROUP BY if needed
    if (groupBy.length > 0) {
      sql += ` GROUP BY ${groupBy.join(', ')}, ${table === 'profiles' ? 't.id' : 't.user_id'}`;
    }
    
    // Close CTE and select user's rank
    sql += `
      )
      SELECT rank, score FROM leaderboard WHERE user_id = '${userId}'
    `;
    
    return sql;
  }
}
