/**
 * Leaderboard Service
 * 
 * Service for managing leaderboards, rankings, and user positions.
 */
import { logger } from '../../lib/logger';
import { EventBus } from '../../lib/event-bus';
import { LeaderboardRepository } from '../../repositories/achievement/leaderboard-repository';
import { getRedisClient } from '../../lib/db-client';
import {
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardOptions,
  LeaderboardResult,
  UserRank,
  LeaderboardEntry,
  LEADERBOARD_CACHE_TTL,
  getLeaderboardTimePeriod
} from '../../models/entities/achievement/leaderboard.model';

/**
 * Service for managing leaderboards
 */
export class LeaderboardService {
  private redis = getRedisClient();

  /**
   * Create a new LeaderboardService
   * 
   * @param leaderboardRepository Repository for leaderboard data access
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private leaderboardRepository: LeaderboardRepository,
    private eventBus: EventBus
  ) {
    // Schedule leaderboard refresh job
    this.scheduleLeaderboardRefresh();
  }

  /**
   * Schedule job to refresh leaderboards
   */
  private scheduleLeaderboardRefresh(): void {
    // Run daily leaderboard refresh every hour
    const dailyRefreshInterval = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Run weekly leaderboard refresh every 6 hours
    const weeklyRefreshInterval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    
    // Run monthly leaderboard refresh every 24 hours
    const monthlyRefreshInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Run all-time leaderboard refresh every 24 hours
    const allTimeRefreshInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Daily leaderboard refresh job
    const refreshDailyLeaderboards = async () => {
      try {
        const categories: LeaderboardCategory[] = [
          'points', 'content', 'engagement', 'achievements'
        ];
        
        for (const category of categories) {
          await this.refreshLeaderboard(category, 'daily');
        }
        
        logger.info('Daily leaderboards refreshed');
      } catch (error) {
        logger.error('Error refreshing daily leaderboards', { error });
      }
      
      // Schedule next refresh
      setTimeout(refreshDailyLeaderboards, dailyRefreshInterval);
    };
    
    // Weekly leaderboard refresh job
    const refreshWeeklyLeaderboards = async () => {
      try {
        const categories: LeaderboardCategory[] = [
          'points', 'content', 'achievements'
        ];
        
        for (const category of categories) {
          await this.refreshLeaderboard(category, 'weekly');
        }
        
        logger.info('Weekly leaderboards refreshed');
      } catch (error) {
        logger.error('Error refreshing weekly leaderboards', { error });
      }
      
      // Schedule next refresh
      setTimeout(refreshWeeklyLeaderboards, weeklyRefreshInterval);
    };
    
    // Monthly leaderboard refresh job
    const refreshMonthlyLeaderboards = async () => {
      try {
        const categories: LeaderboardCategory[] = [
          'points', 'content', 'achievements'
        ];
        
        for (const category of categories) {
          await this.refreshLeaderboard(category, 'monthly');
        }
        
        logger.info('Monthly leaderboards refreshed');
      } catch (error) {
        logger.error('Error refreshing monthly leaderboards', { error });
      }
      
      // Schedule next refresh
      setTimeout(refreshMonthlyLeaderboards, monthlyRefreshInterval);
    };
    
    // All-time leaderboard refresh job
    const refreshAllTimeLeaderboards = async () => {
      try {
        const categories: LeaderboardCategory[] = [
          'points', 'content', 'achievements', 'composite'
        ];
        
        for (const category of categories) {
          await this.refreshLeaderboard(category, 'allTime');
        }
        
        logger.info('All-time leaderboards refreshed');
      } catch (error) {
        logger.error('Error refreshing all-time leaderboards', { error });
      }
      
      // Schedule next refresh
      setTimeout(refreshAllTimeLeaderboards, allTimeRefreshInterval);
    };
    
    // Start refresh jobs with staggered timing
    setTimeout(refreshDailyLeaderboards, 10000); // Start after 10 seconds
    setTimeout(refreshWeeklyLeaderboards, 20000); // Start after 20 seconds
    setTimeout(refreshMonthlyLeaderboards, 30000); // Start after 30 seconds
    setTimeout(refreshAllTimeLeaderboards, 40000); // Start after 40 seconds
    
    logger.info('Scheduled leaderboard refresh jobs');
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
      const cacheKey = this.getLeaderboardCacheKey(category, period, options);
      
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as LeaderboardResult;
      }
      
      // Get leaderboard from repository
      const result = await this.leaderboardRepository.getLeaderboard(category, period, options);
      
      // If includeCurrentUser is set, also get the user's rank
      if (options.includeCurrentUser && options.userId) {
        const userRank = await this.getUserRank(options.userId, category, period);
        if (userRank) {
          // Construct a leaderboard entry from the user rank
          const userEntry: LeaderboardEntry = {
            user_id: userRank.userId,
            rank: userRank.rank,
            score: userRank.score,
            display_name: userRank.userProfile?.display_name || 'Unknown User',
            level: userRank.userProfile?.level || 1,
            avatar_url: userRank.userProfile?.avatar_url || null,
            previous_rank: userRank.previousRank || null,
            category,
            period,
            updated_at: new Date()
          };
          
          result.userEntry = userEntry;
        }
      }
      
      // Cache the result
      const ttl = LEADERBOARD_CACHE_TTL[period] || 300; // Default 5 minutes
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', ttl);
      
      return result;
    } catch (error) {
      logger.error('Error getting leaderboard', { category, period, options, error });
      throw error;
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
      const cacheKey = `leaderboard:rank:${userId}:${category}:${period}`;
      
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as UserRank;
      }
      
      // Get user rank from repository
      const rank = await this.leaderboardRepository.getUserRank(userId, category, period);
      if (!rank) {
        return null;
      }
      
      // Cache the result
      const ttl = LEADERBOARD_CACHE_TTL[period] || 300; // Default 5 minutes
      await this.redis.set(cacheKey, JSON.stringify(rank), 'EX', ttl);
      
      return rank;
    } catch (error) {
      logger.error('Error getting user rank', { userId, category, period, error });
      throw error;
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
      const cacheKey = `leaderboard:top:${category}:${period}:${count}`;
      
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as LeaderboardEntry[];
      }
      
      // Get top ranked users from repository
      const entries = await this.leaderboardRepository.getTopRanked(category, period, count);
      
      // Cache the result
      const ttl = LEADERBOARD_CACHE_TTL[period] || 300; // Default 5 minutes
      await this.redis.set(cacheKey, JSON.stringify(entries), 'EX', ttl);
      
      return entries;
    } catch (error) {
      logger.error('Error getting top ranked users', { category, period, count, error });
      throw error;
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
    try {
      // Refresh the leaderboard
      const count = await this.leaderboardRepository.refreshLeaderboard(category, period);
      
      // Clear cache for this leaderboard
      await this.clearLeaderboardCache(category, period);
      
      logger.info(`Refreshed ${category} leaderboard for ${period} period with ${count} entries`);
      
      return count;
    } catch (error) {
      logger.error('Error refreshing leaderboard', { category, period, error });
      throw error;
    }
  }

  /**
   * Get all available leaderboard categories
   * 
   * @returns Array of available categories
   */
  async getAvailableCategories(): Promise<LeaderboardCategory[]> {
    try {
      const cacheKey = 'leaderboard:categories';
      
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as LeaderboardCategory[];
      }
      
      // Get available categories from repository
      const categories = await this.leaderboardRepository.getAvailableCategories();
      
      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(categories), 'EX', 3600); // 1 hour TTL
      
      return categories;
    } catch (error) {
      logger.error('Error getting available categories', { error });
      throw error;
    }
  }

  /**
   * Clear leaderboard cache
   * 
   * @param category Leaderboard category
   * @param period Time period
   */
  private async clearLeaderboardCache(
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<void> {
    try {
      // Create pattern for matching leaderboard cache keys
      const pattern = `leaderboard:*:${category}:${period}:*`;
      
      // Find keys matching pattern
      const keys = await this.scanKeys(pattern);
      
      // Delete all matching keys
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(`Cleared ${keys.length} leaderboard cache keys for ${category}:${period}`);
      }
    } catch (error) {
      logger.error('Error clearing leaderboard cache', { category, period, error });
    }
  }

  /**
   * Scan Redis for keys matching a pattern
   * 
   * @param pattern Key pattern
   * @returns Array of matching keys
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100
      });
      
      const keys: string[] = [];
      
      stream.on('data', (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });
      
      stream.on('end', () => {
        resolve(keys);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate a cache key for a leaderboard
   * 
   * @param category Leaderboard category
   * @param period Time period
   * @param options Leaderboard options
   * @returns Cache key
   */
  private getLeaderboardCacheKey(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    options: LeaderboardOptions
  ): string {
    const { limit = 100, offset = 0 } = options;
    const timePeriod = getLeaderboardTimePeriod(period);
    
    return `leaderboard:data:${category}:${period}:${timePeriod}:${limit}:${offset}`;
  }
}
