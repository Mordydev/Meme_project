import { FastifyInstance } from 'fastify';
import { TransactionManager } from '../lib/transaction';
import { PointTransaction, UserPointsBalance, LEVEL_THRESHOLDS, calculateLevel } from '../models/points';
import { NotFoundError } from '../lib/errors';

/**
 * Repository for handling points transactions and balances
 */
export class PointsRepository {
  constructor(
    private fastify: FastifyInstance, 
    private transactionManager?: TransactionManager
  ) {}

  /**
   * Create a new points transaction
   */
  async createTransaction(
    transaction: Omit<PointTransaction, 'id' | 'createdAt'>,
    tx?: any
  ): Promise<PointTransaction> {
    // Format data for insert
    const data = {
      user_id: transaction.userId,
      amount: transaction.amount,
      source: transaction.source,
      detail: transaction.detail || null,
      multiplier: transaction.multiplier || 1,
      reference_id: transaction.referenceId || null,
      reference_type: transaction.referenceType || null,
      created_at: new Date()
    };
    
    // Execute query
    const query = this.fastify.supabase
      .from('point_transactions')
      .insert(data)
      .select()
      .single();
      
    const { data: result, error } = tx ? await tx.query(query) : await query;
    
    if (error) {
      this.fastify.log.error(error, 'Failed to create points transaction');
      throw new Error('Failed to create points transaction');
    }
    
    // Transform database result to model
    return {
      id: result.id,
      userId: result.user_id,
      amount: result.amount,
      source: result.source,
      detail: result.detail,
      multiplier: result.multiplier,
      referenceId: result.reference_id,
      referenceType: result.reference_type,
      createdAt: new Date(result.created_at)
    };
  }

  /**
   * Get user's points balance
   * Creates initial balance record if it doesn't exist
   */
  async getUserPointsBalance(userId: string, tx?: any): Promise<UserPointsBalance> {
    // Check if user points record exists
    const query = this.fastify.supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    const { data, error } = tx ? await tx.query(query) : await query;
    
    // If no record exists, create one
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return this.initializeUserPoints(userId, tx);
      }
      
      this.fastify.log.error(error, `Failed to get points balance for user ${userId}`);
      throw new Error(`Failed to get points balance for user ${userId}`);
    }
    
    // Transform database result to model
    return {
      userId: data.user_id,
      totalPoints: data.total_points,
      level: data.level,
      lastUpdated: new Date(data.updated_at)
    };
  }

  /**
   * Initialize user points record
   */
  private async initializeUserPoints(userId: string, tx?: any): Promise<UserPointsBalance> {
    const now = new Date();
    
    // Data for new user points record
    const data = {
      user_id: userId,
      total_points: 0,
      level: 1,
      created_at: now,
      updated_at: now
    };
    
    // Execute query
    const query = this.fastify.supabase
      .from('user_points')
      .insert(data)
      .select()
      .single();
      
    const { data: result, error } = tx ? await tx.query(query) : await query;
    
    if (error) {
      this.fastify.log.error(error, `Failed to initialize points for user ${userId}`);
      throw new Error(`Failed to initialize points for user ${userId}`);
    }
    
    // Transform database result to model
    return {
      userId: result.user_id,
      totalPoints: result.total_points,
      level: result.level,
      lastUpdated: new Date(result.updated_at)
    };
  }

  /**
   * Update user's points balance
   */
  async updateUserPoints(userId: string, amount: number, tx?: any): Promise<UserPointsBalance> {
    // First get current balance (or initialize if not exists)
    const currentBalance = await this.getUserPointsBalance(userId, tx);
    
    // Calculate new total and level
    const newTotal = currentBalance.totalPoints + amount;
    const newLevel = calculateLevel(newTotal);
    
    // Update the record
    const query = this.fastify.supabase
      .from('user_points')
      .update({
        total_points: newTotal,
        level: newLevel,
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .select()
      .single();
      
    const { data, error } = tx ? await tx.query(query) : await query;
    
    if (error) {
      this.fastify.log.error(error, `Failed to update points for user ${userId}`);
      throw new Error(`Failed to update points for user ${userId}`);
    }
    
    // Transform database result to model
    return {
      userId: data.user_id,
      totalPoints: data.total_points,
      level: data.level,
      lastUpdated: new Date(data.updated_at)
    };
  }

  /**
   * Get user's points transactions
   */
  async getUserTransactions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      source?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ transactions: PointTransaction[]; total: number }> {
    // Set default options
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    // Initialize query
    let query = this.fastify.supabase
      .from('point_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (options.source) {
      query = query.eq('source', options.source);
    }
    
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      this.fastify.log.error(error, `Failed to get transactions for user ${userId}`);
      throw new Error(`Failed to get transactions for user ${userId}`);
    }
    
    // Transform database results to models
    const transactions = data.map(item => ({
      id: item.id,
      userId: item.user_id,
      amount: item.amount,
      source: item.source,
      detail: item.detail,
      multiplier: item.multiplier,
      referenceId: item.reference_id,
      referenceType: item.reference_type,
      createdAt: new Date(item.created_at)
    }));
    
    return {
      transactions,
      total: count || 0
    };
  }

  /**
   * Calculate sum of points earned by a user for a specific source and date range
   */
  async sumPointsBySourceAndDate(
    userId: string,
    source: string,
    startDate: Date,
    tx?: any
  ): Promise<number> {
    // Create end date (end of day)
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Execute query
    const query = this.fastify.supabase
      .from('point_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('source', source)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
      
    const { data, error } = tx ? await tx.query(query) : await query;
    
    if (error) {
      this.fastify.log.error(error, `Failed to sum points for user ${userId} and source ${source}`);
      throw new Error(`Failed to sum points for user ${userId} and source ${source}`);
    }
    
    // Sum the points
    return data.reduce((sum, item) => sum + item.amount, 0);
  }

  /**
   * Get top users by points (for leaderboards)
   */
  async getTopUsersByPoints(
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ users: UserPointsBalance[]; total: number }> {
    // Set default options
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    // If date range is provided, we need to calculate points within that range
    if (options.startDate) {
      // For date-ranged leaderboards, we need to use point_transactions table
      let query = this.fastify.supabase.rpc('get_user_points_in_period', {
        start_date: options.startDate.toISOString(),
        end_date: options.endDate?.toISOString() || new Date().toISOString(),
        limit_num: limit,
        offset_num: offset
      });
      
      const { data, error } = await query;
      
      if (error) {
        this.fastify.log.error(error, 'Failed to get top users by points in period');
        throw new Error('Failed to get top users by points in period');
      }
      
      // Get total count of users with points in this period
      const { count, error: countError } = await this.fastify.supabase
        .from('point_transactions')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', options.startDate.toISOString())
        .lte('created_at', options.endDate?.toISOString() || new Date().toISOString());
      
      if (countError) {
        this.fastify.log.error(countError, 'Failed to count users with points in period');
        throw new Error('Failed to count users with points in period');
      }
      
      // Transform results
      const users = data.map((item: any) => ({
        userId: item.user_id,
        totalPoints: item.total_points,
        level: calculateLevel(item.total_points),
        lastUpdated: new Date()
      }));
      
      return {
        users,
        total: count || 0
      };
    } else {
      // For all-time leaderboard, use user_points table
      const { data, error, count } = await this.fastify.supabase
        .from('user_points')
        .select('*', { count: 'exact' })
        .order('total_points', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        this.fastify.log.error(error, 'Failed to get top users by points');
        throw new Error('Failed to get top users by points');
      }
      
      // Transform results
      const users = data.map(item => ({
        userId: item.user_id,
        totalPoints: item.total_points,
        level: item.level,
        lastUpdated: new Date(item.updated_at)
      }));
      
      return {
        users,
        total: count || 0
      };
    }
  }

  /**
   * Get user's rank in points leaderboard
   */
  async getUserPointsRank(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ rank: number; score: number }> {
    // Get user's points
    let userPoints = 0;
    
    if (options.startDate) {
      // For date range, calculate from point_transactions
      const { data, error } = await this.fastify.supabase
        .from('point_transactions')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', options.startDate.toISOString())
        .lte('created_at', options.endDate?.toISOString() || new Date().toISOString());
      
      if (error) {
        this.fastify.log.error(error, `Failed to get points for user ${userId} in period`);
        throw new Error(`Failed to get points for user ${userId} in period`);
      }
      
      userPoints = data.reduce((sum, item) => sum + item.amount, 0);
      
      // Get user's rank
      const { data: rankData, error: rankError } = await this.fastify.supabase.rpc('get_user_points_rank_in_period', {
        user_id_param: userId,
        start_date: options.startDate.toISOString(),
        end_date: options.endDate?.toISOString() || new Date().toISOString()
      });
      
      if (rankError) {
        this.fastify.log.error(rankError, `Failed to get rank for user ${userId} in period`);
        throw new Error(`Failed to get rank for user ${userId} in period`);
      }
      
      return {
        rank: rankData[0]?.rank || 0,
        score: userPoints
      };
    } else {
      // For all-time, get from user_points
      const { data, error } = await this.fastify.supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          return { rank: 0, score: 0 };
        }
        
        this.fastify.log.error(error, `Failed to get points for user ${userId}`);
        throw new Error(`Failed to get points for user ${userId}`);
      }
      
      userPoints = data.total_points;
      
      // Get user's rank
      const { data: rankData, error: rankError } = await this.fastify.supabase.rpc('get_user_points_rank', {
        user_id_param: userId
      });
      
      if (rankError) {
        this.fastify.log.error(rankError, `Failed to get rank for user ${userId}`);
        throw new Error(`Failed to get rank for user ${userId}`);
      }
      
      return {
        rank: rankData[0]?.rank || 0,
        score: userPoints
      };
    }
  }
}
