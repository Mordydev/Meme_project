/**
 * Leaderboard Service
 * 
 * Manages leaderboards for different categories and time periods
 */
import { Pool } from 'pg';
import { LeaderboardEntry, LeaderboardCategory, LeaderboardPeriod } from '../../models/leaderboard';
import { LeaderboardRepository } from '../../repositories/leaderboard-repository';
import { logger } from '../../lib/logger';
import { Redis } from 'ioredis';
import { getCacheClient } from '../../lib/cache-client';

export interface LeaderboardOptions {
  limit?: number;
  offset?: number;
  includeCurrentUser?: boolean;
  currentUserId?: string;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  total: number;
  currentUserRank?: {
    rank: number;
    score: number;
    displayName: string;
    position: 'above' | 'below' | 'in-range';
  };
}

export interface UserRank {
  rank: number;
  totalUsers: number;
  percentile: number;
  score: number;
  distanceToNextRank?: number;
}

export class LeaderboardService {
  private repository: LeaderboardRepository;
  private cache: Redis;
  
  constructor(
    db: Pool,
    repository: LeaderboardRepository,
    cache: Redis
  ) {
    this.repository = repository;
    this.cache = cache;
  }
  
  /**
   * Get leaderboard for a specific category and period
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
        includeCurrentUser = false,
        currentUserId
      } = options;
      
      // Try to get from cache first
      const cacheKey = `leaderboard:${category}:${period}:${limit}:${offset}`;
      const cachedResult = await this.cache.get(cacheKey);
      
      if (cachedResult) {
        const parsedResult = JSON.parse(cachedResult) as LeaderboardResult;
        
        // If we need current user and have user ID, add that info
        if (includeCurrentUser && currentUserId) {
          return this.addCurrentUserToLeaderboard(
            parsedResult, 
            category, 
            period, 
            currentUserId
          );
        }
        
        return parsedResult;
      }
      
      // Generate fresh leaderboard if not cached
      let result: LeaderboardResult;
      
      switch (category) {
        case LeaderboardCategory.POINTS:
          result = await this.repository.getPointsLeaderboard(period, { limit, offset });
          break;
        case LeaderboardCategory.CONTENT:
          result = await this.repository.getContentLeaderboard(period, { limit, offset });
          break;
        case LeaderboardCategory.ENGAGEMENT:
          result = await this.repository.getEngagementLeaderboard(period, { limit, offset });
          break;
        case LeaderboardCategory.REFERRALS:
          result = await this.repository.getReferralLeaderboard(period, { limit, offset });
          break;
        case LeaderboardCategory.ACHIEVEMENTS:
          result = await this.repository.getAchievementsLeaderboard(period, { limit, offset });
          break;
        default:
          throw new Error(`Unsupported leaderboard category: ${category}`);
      }
      
      // Cache the result with appropriate TTL
      await this.cache.set(
        cacheKey, 
        JSON.stringify(result), 
        'EX', 
        this.getLeaderboardCacheTTL(period)
      );
      
      // If we need current user and have user ID, add that info
      if (includeCurrentUser && currentUserId) {
        return this.addCurrentUserToLeaderboard(
          result, 
          category, 
          period, 
          currentUserId
        );
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting leaderboard', { error, category, period, options });
      throw error;
    }
  }
  
  /**
   * Add current user info to leaderboard result
   */
  private async addCurrentUserToLeaderboard(
    result: LeaderboardResult,
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    userId: string
  ): Promise<LeaderboardResult> {
    try {
      // Check if user is already in the result
      const userInResult = result.entries.find(entry => entry.userId === userId);
      if (userInResult) {
        // User is already in result, just add currentUserRank
        return {
          ...result,
          currentUserRank: {
            rank: userInResult.rank,
            score: userInResult.score,
            displayName: userInResult.displayName,
            position: 'in-range'
          }
        };
      }
      
      // Get user's rank
      const userRank = await this.getUserRank(userId, category, period);
      if (!userRank) {
        // User not ranked, return original result
        return result;
      }
      
      // Determine position
      const lowestRankInResult = result.entries.length > 0 ? 
        result.entries[result.entries.length - 1].rank : 0;
        
      const highestRankInResult = result.entries.length > 0 ? 
        result.entries[0].rank : 0;
      
      let position: 'above' | 'below' | 'in-range' = 'below';
      
      if (userRank.rank < highestRankInResult) {
        position = 'above';
      } else if (userRank.rank > lowestRankInResult) {
        position = 'below';
      } else {
        position = 'in-range';
      }
      
      // Get user displayName
      const userEntry = await this.repository.getLeaderboardEntry(userId, category, period);
      
      return {
        ...result,
        currentUserRank: {
          rank: userRank.rank,
          score: userRank.score,
          displayName: userEntry?.displayName || userId,
          position
        }
      };
    } catch (error) {
      logger.error('Error adding current user to leaderboard', { 
        error, 
        userId, 
        category, 
        period 
      });
      
      // Return original result if error
      return result;
    }
  }
  
  /**
   * Get user's rank in a specific category and period
   */
  async getUserRank(
    userId: string,
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<UserRank | null> {
    try {
      // Try to get from cache first
      const cacheKey = `user-rank:${userId}:${category}:${period}`;
      const cachedRank = await this.cache.get(cacheKey);
      
      if (cachedRank) {
        return JSON.parse(cachedRank) as UserRank;
      }
      
      // Get user's rank from repository
      const userRank = await this.repository.getUserRank(userId, category, period);
      
      if (!userRank) {
        return null;
      }
      
      // Get distance to next rank
      const distanceToNext = await this.repository.getDistanceToNextRank(
        userId, 
        category, 
        period
      );
      
      const result = {
        ...userRank,
        distanceToNextRank: distanceToNext
      };
      
      // Cache the result
      await this.cache.set(
        cacheKey, 
        JSON.stringify(result), 
        'EX', 
        this.getLeaderboardCacheTTL(period)
      );
      
      return result;
    } catch (error) {
      logger.error('Error getting user rank', { error, userId, category, period });
      throw error;
    }
  }
  
  /**
   * Refresh all leaderboards (for scheduled job)
   */
  async refreshLeaderboards(): Promise<void> {
    try {
      logger.info('Refreshing all leaderboards');
      
      // Reset category caches
      await Promise.all(Object.values(LeaderboardCategory).map(async (category) => {
        await this.refreshCategoryLeaderboards(category);
      }));
      
      logger.info('Leaderboard refresh completed');
    } catch (error) {
      logger.error('Error refreshing leaderboards', { error });
      throw error;
    }
  }
  
  /**
   * Refresh leaderboards for a specific category
   */
  async refreshCategoryLeaderboards(category: LeaderboardCategory): Promise<void> {
    try {
      logger.info('Refreshing leaderboards for category', { category });
      
      // Force refresh for each period
      for (const period of Object.values(LeaderboardPeriod)) {
        await this.repository.refreshLeaderboard(category, period);
        
        // Clear cache for this category/period
        const cachePattern = `leaderboard:${category}:${period}:*`;
        const keys = await this.cache.keys(cachePattern);
        
        if (keys.length > 0) {
          await this.cache.del(...keys);
        }
        
        // Also clear user rank caches
        const userRankPattern = `user-rank:*:${category}:${period}`;
        const userRankKeys = await this.cache.keys(userRankPattern);
        
        if (userRankKeys.length > 0) {
          await this.cache.del(...userRankKeys);
        }
      }
    } catch (error) {
      logger.error('Error refreshing category leaderboards', { error, category });
      throw error;
    }
  }
  
  /**
   * Get available leaderboard categories
   */
  async getLeaderboardCategories(): Promise<{
    id: LeaderboardCategory;
    name: string;
    description: string;
    availablePeriods: LeaderboardPeriod[];
  }[]> {
    // Define all available categories
    return [
      {
        id: LeaderboardCategory.POINTS,
        name: 'Success Points',
        description: 'Top users by Success Points earned',
        availablePeriods: [
          LeaderboardPeriod.DAILY,
          LeaderboardPeriod.WEEKLY,
          LeaderboardPeriod.MONTHLY,
          LeaderboardPeriod.ALL_TIME
        ]
      },
      {
        id: LeaderboardCategory.CONTENT,
        name: 'Content Creation',
        description: 'Most active content creators',
        availablePeriods: [
          LeaderboardPeriod.WEEKLY,
          LeaderboardPeriod.MONTHLY,
          LeaderboardPeriod.ALL_TIME
        ]
      },
      {
        id: LeaderboardCategory.ENGAGEMENT,
        name: 'Community Engagement',
        description: 'Most engaged community members',
        availablePeriods: [
          LeaderboardPeriod.WEEKLY,
          LeaderboardPeriod.MONTHLY,
          LeaderboardPeriod.ALL_TIME
        ]
      },
      {
        id: LeaderboardCategory.REFERRALS,
        name: 'Referrals',
        description: 'Top community builders by referrals',
        availablePeriods: [
          LeaderboardPeriod.MONTHLY,
          LeaderboardPeriod.ALL_TIME
        ]
      },
      {
        id: LeaderboardCategory.ACHIEVEMENTS,
        name: 'Achievements',
        description: 'Users with the most achievements unlocked',
        availablePeriods: [
          LeaderboardPeriod.ALL_TIME
        ]
      }
    ];
  }
  
  /**
   * Get TTL for leaderboard cache based on period
   */
  private getLeaderboardCacheTTL(period: LeaderboardPeriod): number {
    switch (period) {
      case LeaderboardPeriod.DAILY:
        return 60 * 5; // 5 minutes
      case LeaderboardPeriod.WEEKLY:
        return 60 * 15; // 15 minutes
      case LeaderboardPeriod.MONTHLY:
        return 60 * 60; // 1 hour
      case LeaderboardPeriod.ALL_TIME:
        return 60 * 60 * 12; // 12 hours
      default:
        return 60 * 15; // 15 minutes default
    }
  }
}
