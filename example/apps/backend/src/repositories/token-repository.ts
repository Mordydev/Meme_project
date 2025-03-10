import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';

/**
 * Token price model interface
 */
export interface TokenPriceModel {
  id: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
  timestamp: Date;
  createdAt: Date;
}

/**
 * Token milestone model interface
 */
export interface TokenMilestoneModel {
  id: string;
  name: string;
  marketCap: number;
  description: string;
  isReached: boolean;
  reachedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Token transaction model interface
 */
export interface TokenTransactionModel {
  id: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  price?: number;
  blockNumber: number;
  timestamp: Date;
  createdAt: Date;
}

/**
 * Repository for handling Token-related data
 */
export class TokenRepository extends BaseRepository<TokenPriceModel> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'token_prices');
  }

  /**
   * Get latest token price
   */
  async getLatestPrice(): Promise<TokenPriceModel | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // If no records yet, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      
      this.logger.error(error, 'Failed to get latest token price');
      throw new Error('Failed to get latest token price');
    }
    
    return data;
  }

  /**
   * Get token price history
   */
  async getPriceHistory(period: 'day' | 'week' | 'month' | 'year'): Promise<TokenPriceModel[]> {
    let interval: string;
    
    // Determine interval based on period
    switch (period) {
      case 'day':
        interval = '5 minutes';
        break;
      case 'week':
        interval = '1 hour';
        break;
      case 'month':
        interval = '1 day';
        break;
      case 'year':
        interval = '1 week';
        break;
      default:
        interval = '1 day';
    }
    
    // Get time series data using PostgreSQL time_bucket function
    const { data, error } = await this.db.rpc('get_token_price_history', {
      time_period: period,
      time_interval: interval
    });
    
    if (error) {
      this.logger.error(error, `Failed to get token price history for period ${period}`);
      throw new Error(`Failed to get token price history for period ${period}`);
    }
    
    return data;
  }

  /**
   * Add a new token price record
   */
  async addPriceRecord(price: number, marketCap: number, change24h: number, volume24h: number): Promise<TokenPriceModel> {
    const record = {
      price,
      marketCap,
      change24h,
      volume24h,
      timestamp: new Date(),
      createdAt: new Date()
    };
    
    const { data, error } = await this.db
      .from(this.tableName)
      .insert(record)
      .select()
      .single();
    
    if (error) {
      this.logger.error(error, 'Failed to add token price record');
      throw new Error('Failed to add token price record');
    }
    
    // Check for milestone achievements
    await this.checkMilestones(marketCap);
    
    return data;
  }

  /**
   * Get token milestones
   */
  async getMilestones(): Promise<TokenMilestoneModel[]> {
    const { data, error } = await this.db
      .from('token_milestones')
      .select('*')
      .order('marketCap', { ascending: true });
    
    if (error) {
      this.logger.error(error, 'Failed to get token milestones');
      throw new Error('Failed to get token milestones');
    }
    
    return data;
  }

  /**
   * Get current milestone progress
   */
  async getCurrentMilestoneProgress(): Promise<{
    current: TokenMilestoneModel | null;
    next: TokenMilestoneModel | null;
    progress: number;
    latestMarketCap: number;
  }> {
    // Get the latest price for market cap
    const latestPrice = await this.getLatestPrice();
    const currentMarketCap = latestPrice?.marketCap || 0;
    
    // Get all milestones
    const milestones = await this.getMilestones();
    
    // Find current and next milestones
    let current: TokenMilestoneModel | null = null;
    let next: TokenMilestoneModel | null = null;
    
    for (let i = 0; i < milestones.length; i++) {
      if (milestones[i].isReached) {
        current = milestones[i];
        next = milestones[i + 1] || null;
      } else {
        if (!current) {
          current = null;
          next = milestones[i];
        }
        break;
      }
    }
    
    // Calculate progress towards next milestone
    let progress = 0;
    
    if (next && current) {
      progress = Math.min(100, Math.max(0, 
        ((currentMarketCap - current.marketCap) / (next.marketCap - current.marketCap)) * 100
      ));
    } else if (next && !current) {
      progress = Math.min(100, Math.max(0, 
        (currentMarketCap / next.marketCap) * 100
      ));
    } else if (current && !next) {
      progress = 100; // All milestones reached
    }
    
    return {
      current,
      next,
      progress,
      latestMarketCap: currentMarketCap
    };
  }

  /**
   * Check if any milestones have been reached
   */
  private async checkMilestones(currentMarketCap: number): Promise<void> {
    // Get all unreached milestones
    const { data: unreachedMilestones, error } = await this.db
      .from('token_milestones')
      .select('*')
      .eq('isReached', false)
      .order('marketCap', { ascending: true });
    
    if (error) {
      this.logger.error(error, 'Failed to check token milestones');
      throw new Error('Failed to check token milestones');
    }
    
    // Check each milestone
    for (const milestone of unreachedMilestones) {
      if (currentMarketCap >= milestone.marketCap) {
        // Update milestone as reached
        const { error: updateError } = await this.db
          .from('token_milestones')
          .update({
            isReached: true,
            reachedAt: new Date(),
            updatedAt: new Date()
          })
          .eq('id', milestone.id);
        
        if (updateError) {
          this.logger.error(updateError, `Failed to update milestone ${milestone.id}`);
          throw new Error(`Failed to update milestone ${milestone.id}`);
        }
        
        // Record milestone achievement for event emission elsewhere
        this.logger.info({ milestone: milestone.name, marketCap: currentMarketCap }, 'Token milestone reached');
      } else {
        // Since milestones are ordered, we can stop checking once we find one that hasn't been reached
        break;
      }
    }
  }

  /**
   * Get recent token transactions
   */
  async getRecentTransactions(limit = 20): Promise<TokenTransactionModel[]> {
    const { data, error } = await this.db
      .from('token_transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      this.logger.error(error, 'Failed to get recent token transactions');
      throw new Error('Failed to get recent token transactions');
    }
    
    return data;
  }

  /**
   * Add a token transaction
   */
  async addTransaction(transaction: Omit<TokenTransactionModel, 'id' | 'createdAt'>): Promise<TokenTransactionModel> {
    const { data, error } = await this.db
      .from('token_transactions')
      .insert({
        ...transaction,
        createdAt: new Date()
      })
      .select()
      .single();
    
    if (error) {
      this.logger.error(error, 'Failed to add token transaction');
      throw new Error('Failed to add token transaction');
    }
    
    return data;
  }
}
