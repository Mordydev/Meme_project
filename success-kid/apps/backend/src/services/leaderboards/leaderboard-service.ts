/**
 * Leaderboard Service
 * 
 * Service for managing leaderboards across different categories and time periods
 */
import { LeaderboardRepository } from '../../repositories/leaderboard-repository';
import { UserRepository } from '../../repositories/user-repository';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { ContentRepository } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { logger } from '../../lib/logger';
import { NotFoundError } from '../../errors/api-errors';

export enum LeaderboardCategory {
  OVERALL_POINTS = 'overall_points',
  CONTENT_CREATION = 'content_creation',
  COMMUNITY_ENGAGEMENT = 'community_engagement',
  REFERRAL_CHAMPIONS = 'referral_champions',
  TOKEN_REDEMPTION = 'token_redemption'
}

export enum LeaderboardPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  ALL_TIME = 'all_time'
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  change?: number; // Change in rank compared to previous period
}

export interface LeaderboardResult {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  lastUpdated: Date;
  entries: LeaderboardEntry[];
  userRank?: LeaderboardEntry; // The requesting user's rank, if available
}

export class LeaderboardService {
  constructor(
    private leaderboardRepository: LeaderboardRepository,
    private userRepository: UserRepository,
    private userPointsRepository: UserPointsRepository,
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository
  ) {}
  
  /**
   * Get leaderboard data for a specific category and time period
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod = LeaderboardPeriod.WEEK,
    options: { 
      limit?: number; 
      offset?: number;
      userId?: string; // Current user ID for personalized rank
    } = {}
  ): Promise<LeaderboardResult> {
    try {
      const { limit = 20, offset = 0, userId } = options;
      
      // Get leaderboard entries
      const leaderboard = await this.leaderboardRepository.getLeaderboard(
        category,
        period,
        limit,
        offset
      );
      
      // Format entries with user information
      const formattedEntries = await this.formatLeaderboardEntries(leaderboard);
      
      // Get user's personal rank if requested
      let userRank: LeaderboardEntry | undefined;
      
      if (userId) {
        userRank = await this.getUserRank(userId, category, period);
      }
      
      return {
        category,
        period,
        lastUpdated: new Date(), // This would come from the repository in a real implementation
        entries: formattedEntries,
        userRank
      };
    } catch (error) {
      logger.error('Error getting leaderboard', { error, category, period, options });
      throw error;
    }
  }
  
  /**
   * Generate and update leaderboards (typically called by a scheduled job)
   */
  async generateLeaderboards(): Promise<boolean> {
    try {
      // Generate each leaderboard type for each time period
      const categories = Object.values(LeaderboardCategory);
      const periods = Object.values(LeaderboardPeriod);
      
      for (const category of categories) {
        for (const period of periods) {
          await this.generateLeaderboard(category, period);
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error generating leaderboards', { error });
      throw error;
    }
  }
  
  /**
   * Generate a specific leaderboard
   */
  private async generateLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<boolean> {
    try {
      // Define time range for the period
      const timeRange = this.getTimeRangeForPeriod(period);
      
      // Generate leaderboard data based on category
      let leaderboardData: any[] = [];
      
      switch (category) {
        case LeaderboardCategory.OVERALL_POINTS:
          leaderboardData = await this.generateOverallPointsLeaderboard(timeRange);
          break;
        case LeaderboardCategory.CONTENT_CREATION:
          leaderboardData = await this.generateContentCreationLeaderboard(timeRange);
          break;
        case LeaderboardCategory.COMMUNITY_ENGAGEMENT:
          leaderboardData = await this.generateCommunityEngagementLeaderboard(timeRange);
          break;
        case LeaderboardCategory.REFERRAL_CHAMPIONS:
          leaderboardData = await this.generateReferralChampionsLeaderboard(timeRange);
          break;
        case LeaderboardCategory.TOKEN_REDEMPTION:
          leaderboardData = await this.generateTokenRedemptionLeaderboard(timeRange);
          break;
        default:
          throw new Error(`Unknown leaderboard category: ${category}`);
      }
      
      // Store leaderboard in the repository
      await this.leaderboardRepository.updateLeaderboard(
        category,
        period,
        leaderboardData
      );
      
      return true;
    } catch (error) {
      logger.error('Error generating leaderboard', { error, category, period });
      throw error;
    }
  }
  
  /**
   * Generate overall points leaderboard
   */
  private async generateOverallPointsLeaderboard(timeRange: { start: Date }): Promise<any[]> {
    try {
      // Query total points by user
      const pointsData = await this.userPointsRepository.getTotalPointsByUser(timeRange.start);
      
      // Format and return
      return pointsData.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        score: row.totalPoints,
        // Additional fields would be filled in later
      }));
    } catch (error) {
      logger.error('Error generating overall points leaderboard', { error, timeRange });
      throw error;
    }
  }
  
  /**
   * Generate content creation leaderboard
   */
  private async generateContentCreationLeaderboard(timeRange: { start: Date }): Promise<any[]> {
    try {
      // Query content creation metrics by user
      const contentData = await this.contentRepository.getContentCountByUser(timeRange.start);
      
      // Format and return
      return contentData.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        score: row.contentCount,
        // Additional fields would be filled in later
      }));
    } catch (error) {
      logger.error('Error generating content creation leaderboard', { error, timeRange });
      throw error;
    }
  }
  
  /**
   * Generate community engagement leaderboard
   */
  private async generateCommunityEngagementLeaderboard(timeRange: { start: Date }): Promise<any[]> {
    try {
      // Combine comments and reactions for engagement score
      const commentCounts = await this.commentRepository.getCommentCountByUser(timeRange.start);
      
      // In a real implementation, we would also include reactions, upvotes, etc.
      // For this example, we'll just use comment counts
      
      // Format and return
      return commentCounts.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        score: row.commentCount,
        // Additional fields would be filled in later
      }));
    } catch (error) {
      logger.error('Error generating community engagement leaderboard', { error, timeRange });
      throw error;
    }
  }
  
  /**
   * Generate referral champions leaderboard
   */
  private async generateReferralChampionsLeaderboard(timeRange: { start: Date }): Promise<any[]> {
    try {
      // In a real implementation, we would query referral counts from the referral repository
      // For this example, we'll return a placeholder
      return [];
    } catch (error) {
      logger.error('Error generating referral champions leaderboard', { error, timeRange });
      throw error;
    }
  }
  
  /**
   * Generate token redemption leaderboard
   */
  private async generateTokenRedemptionLeaderboard(timeRange: { start: Date }): Promise<any[]> {
    try {
      // In a real implementation, we would query redemption amounts from the redemption repository
      // For this example, we'll return a placeholder
      return [];
    } catch (error) {
      logger.error('Error generating token redemption leaderboard', { error, timeRange });
      throw error;
    }
  }
  
  /**
   * Get time range for a period
   */
  private getTimeRangeForPeriod(period: LeaderboardPeriod): { start: Date; end?: Date } {
    const now = new Date();
    let start = new Date();
    
    switch (period) {
      case LeaderboardPeriod.DAY:
        start.setHours(0, 0, 0, 0); // Start of today
        break;
      case LeaderboardPeriod.WEEK:
        start.setDate(now.getDate() - 7);
        break;
      case LeaderboardPeriod.MONTH:
        start.setMonth(now.getMonth() - 1);
        break;
      case LeaderboardPeriod.ALL_TIME:
        start = new Date(0); // Beginning of time
        break;
      default:
        start.setDate(now.getDate() - 7); // Default to week
    }
    
    return { start, end: now };
  }
  
  /**
   * Format leaderboard entries with user information
   */
  private async formatLeaderboardEntries(entries: any[]): Promise<LeaderboardEntry[]> {
    try {
      // Get user information for all entries
      const userIds = entries.map(entry => entry.userId);
      
      // In a real implementation, we would efficiently fetch all users at once
      // For this example, we'll assume only a few users and fetch them individually
      
      const formattedEntries: LeaderboardEntry[] = [];
      
      for (const entry of entries) {
        const user = await this.userRepository.findById(entry.userId);
        
        if (user) {
          const profile = await this.userRepository.getProfile(entry.userId);
          
          formattedEntries.push({
            rank: entry.rank,
            userId: entry.userId,
            displayName: user.display_name,
            avatarUrl: profile?.avatar_url,
            score: entry.score,
            change: entry.change
          });
        }
      }
      
      return formattedEntries;
    } catch (error) {
      logger.error('Error formatting leaderboard entries', { error, entriesCount: entries.length });
      throw error;
    }
  }
  
  /**
   * Get a user's rank on a specific leaderboard
   */
  private async getUserRank(
    userId: string,
    category: LeaderboardCategory,
    period: LeaderboardPeriod
  ): Promise<LeaderboardEntry | undefined> {
    try {
      const userRank = await this.leaderboardRepository.getUserRank(
        userId,
        category,
        period
      );
      
      if (!userRank) {
        return undefined;
      }
      
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return undefined;
      }
      
      const profile = await this.userRepository.getProfile(userId);
      
      return {
        rank: userRank.rank,
        userId,
        displayName: user.display_name,
        avatarUrl: profile?.avatar_url,
        score: userRank.score,
        change: userRank.change
      };
    } catch (error) {
      logger.error('Error getting user rank', { error, userId, category, period });
      return undefined;
    }
  }
  
  /**
   * Check if a user has reached the top of a leaderboard
   * Used for achievement tracking
   */
  async checkUserLeaderboardAchievement(
    userId: string,
    category: LeaderboardCategory,
    requiredRank: number = 10
  ): Promise<boolean> {
    try {
      // Check across different time periods
      const periods = [
        LeaderboardPeriod.DAY,
        LeaderboardPeriod.WEEK,
        LeaderboardPeriod.MONTH
      ];
      
      for (const period of periods) {
        const userRank = await this.getUserRank(userId, category, period);
        
        if (userRank && userRank.rank <= requiredRank) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking user leaderboard achievement', { 
        error, 
        userId, 
        category, 
        requiredRank
      });
      return false;
    }
  }
}
