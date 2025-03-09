import { LeaderboardRepository } from '../repositories/leaderboard-repository';
import { CacheService } from './core/cache-service';
import { 
  LeaderboardCategory, 
  LeaderboardPeriod, 
  LeaderboardOptions, 
  LeaderboardResult 
} from '../models/leaderboard';
import { logger } from '../lib/logger';

/**
 * Service for handling leaderboard operations
 */
export class LeaderboardService {
  constructor(
    private leaderboardRepository: LeaderboardRepository,
    private cacheService?: CacheService
  ) {}

  /**
   * Get leaderboard for a specific category and period
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    options: LeaderboardOptions = {}
  ): Promise<LeaderboardResult> {
    try {
      // Try getting from cache first if available
      if (this.cacheService) {
        const cacheKey = this.getLeaderboardCacheKey(category, options);
        const cached = await this.cacheService.get<LeaderboardResult>(cacheKey);
        
        if (cached) {
          logger.debug({ category, period: options.period }, 'Leaderboard retrieved from cache');
          return cached;
        }
      }

      // Get from repository
      const leaderboard = await this.leaderboardRepository.getLeaderboard(category, options);

      // Cache result if caching is available
      if (this.cacheService) {
        const cacheKey = this.getLeaderboardCacheKey(category, options);
        const ttl = this.getCacheTTL(options.period || LeaderboardPeriod.ALL_TIME);
        await this.cacheService.set(cacheKey, leaderboard, ttl);
      }

      return leaderboard;
    } catch (error) {
      logger.error({ error, category, options }, 'Error retrieving leaderboard');
      throw new Error(`Failed to retrieve leaderboard: ${error.message}`);
    }
  }

  /**
   * Get user's rank in a specific leaderboard
   */
  async getUserRank(
    userId: string,
    category: LeaderboardCategory,
    period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME
  ): Promise<{ rank: number; score: number } | undefined> {
    try {
      // Define date range based on period
      const { startDate, endDate } = this.getDateRangeForPeriod(period);

      // Try getting from cache first if available
      if (this.cacheService) {
        const cacheKey = `leaderboard:${category}:${period}:user:${userId}`;
        const cached = await this.cacheService.get<{ rank: number; score: number }>(cacheKey);
        
        if (cached) {
          logger.debug({ category, period, userId }, 'User rank retrieved from cache');
          return cached;
        }
      }

      // Get from repository
      const rank = await this.leaderboardRepository.getUserLeaderboardRank(
        userId,
        category,
        startDate,
        endDate
      );

      // Cache result if caching is available and rank exists
      if (this.cacheService && rank) {
        const cacheKey = `leaderboard:${category}:${period}:user:${userId}`;
        const ttl = this.getCacheTTL(period);
        await this.cacheService.set(cacheKey, rank, ttl);
      }

      return rank;
    } catch (error) {
      logger.error({ error, userId, category, period }, 'Error retrieving user rank');
      throw new Error(`Failed to retrieve user rank: ${error.message}`);
    }
  }

  /**
   * Get date range for a leaderboard period
   */
  private getDateRangeForPeriod(period: LeaderboardPeriod): {
    startDate?: Date;
    endDate?: Date;
  } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate: Date | undefined;
    
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
        return { startDate: undefined, endDate: undefined };
    }
    
    return { startDate, endDate };
  }

  /**
   * Get cache TTL for a leaderboard period
   */
  private getCacheTTL(period: LeaderboardPeriod): number {
    switch (period) {
      case LeaderboardPeriod.DAILY:
        return 300; // 5 minutes for daily
      case LeaderboardPeriod.WEEKLY:
        return 600; // 10 minutes for weekly
      case LeaderboardPeriod.MONTHLY:
        return 1800; // 30 minutes for monthly
      case LeaderboardPeriod.ALL_TIME:
      default:
        return 3600; // 1 hour for all-time
    }
  }

  /**
   * Generate a cache key for a leaderboard request
   */
  private getLeaderboardCacheKey(
    category: LeaderboardCategory,
    options: LeaderboardOptions
  ): string {
    const { period = LeaderboardPeriod.ALL_TIME, limit = 20, offset = 0 } = options;
    
    // Don't include userId in cache key, as we cache the general leaderboard separately
    return `leaderboard:${category}:${period}:${limit}:${offset}`;
  }
}
