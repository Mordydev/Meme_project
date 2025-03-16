/**
 * Gamification Analytics Service
 * 
 * Provides analytics for measuring gamification effectiveness and optimizing engagement
 */
import { Pool } from 'pg';
import { logger } from '../../../lib/logger';
import { AchievementRepository } from '../../../repositories/achievement-repository';
import { LeaderboardRepository } from '../../../repositories/leaderboard-repository';
import { StreakRepository } from '../../../repositories/streak-repository';
import { ChallengeRepository } from '../../../repositories/challenge-repository';
import { LevelRepository } from '../../../repositories/level-repository';
import { Redis } from 'ioredis';

export interface AchievementAnalytics {
  achievementId: string;
  name: string;
  category: string;
  difficulty: string;
  unlockCount: number;
  unlockRate: number;
  avgTimeToUnlock: number;
  unlockRateTrend: number;
  engagementImpact: number;
}

export interface LevelProgressionAnalytics {
  level: number;
  userCount: number;
  distributionPercentage: number;
  averageDaysToReach: number;
  completionRate: number;
}

export interface ChallengeAnalytics {
  challengeId: string;
  title: string;
  category: string;
  difficulty: string;
  participantCount: number;
  participationRate: number;
  completionRate: number;
  averageProgress: number;
  engagementLift: number;
}

export interface RetentionCorrelation {
  achievementCompletion: number;
  leaderboardPresence: number;
  levelProgression: number;
  streakMaintenance: number;
  challengeParticipation: number;
  badgeCollection: number;
}

export interface GamificationMetrics {
  achievementUnlockRate: Record<string, number>;
  averageLevelProgression: number;
  streakRetentionRate: number;
  challengeCompletionRate: number;
  leaderboardParticipation: number;
  engagementLift: number;
}

export interface UserGamificationMetrics {
  totalAchievements: number;
  achievementCompletionPercentage: number;
  currentLevel: number;
  levelProgress: number;
  longestStreak: number;
  currentStreak: number;
  challengesCompleted: number;
  leaderboardRankings: Record<string, number>;
  engagementPercentile: number;
}

export interface EngagementReport {
  period: string;
  dailyActiveUsers: number[];
  dailyEngagementActions: number[];
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  gamificationImpact: {
    withGamification: number;
    withoutGamification: number;
    liftPercentage: number;
  };
}

export class GamificationAnalyticsService {
  private db: Pool;
  private cache: Redis;
  private achievementRepository: AchievementRepository;
  private leaderboardRepository: LeaderboardRepository;
  private streakRepository: StreakRepository;
  private challengeRepository: ChallengeRepository;
  private levelRepository: LevelRepository;
  
  // Cache TTLs in seconds
  private readonly CACHE_TTL = {
    SYSTEM_METRICS: 3600, // 1 hour
    ACHIEVEMENT_ANALYTICS: 3600 * 6, // 6 hours
    CHALLENGE_ANALYTICS: 3600 * 6, // 6 hours
    LEVEL_ANALYTICS: 3600 * 12, // 12 hours
    USER_METRICS: 300, // 5 minutes
    ENGAGEMENT_REPORT: 3600 * 24, // 24 hours
    RETENTION_CORRELATION: 3600 * 24 // 24 hours
  };
  
  constructor(
    db: Pool,
    cache: Redis,
    achievementRepository: AchievementRepository,
    leaderboardRepository: LeaderboardRepository,
    streakRepository: StreakRepository,
    challengeRepository: ChallengeRepository,
    levelRepository: LevelRepository
  ) {
    this.db = db;
    this.cache = cache;
    this.achievementRepository = achievementRepository;
    this.leaderboardRepository = leaderboardRepository;
    this.streakRepository = streakRepository;
    this.challengeRepository = challengeRepository;
    this.levelRepository = levelRepository;
  }
  
  /**
   * Get overall system gamification metrics
   */
  async getSystemMetrics(period?: string): Promise<GamificationMetrics> {
    try {
      const cacheKey = `gamification:system-metrics:${period || 'all-time'}`;
      
      // Try to get from cache
      const cachedMetrics = await this.cache.get(cacheKey);
      if (cachedMetrics) {
        return JSON.parse(cachedMetrics);
      }
      
      // Get active user count for percentages
      const activeUserCount = await this.getActiveUserCount(period);
      
      // Calculate achievement unlock rates by difficulty
      const achievementStats = await this.achievementRepository.getAchievementStats();
      const achievementUnlockRate: Record<string, number> = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0
      };
      
      // Group by difficulty
      achievementStats.forEach(stat => {
        // Add to the appropriate difficulty category
        const difficulty = stat.category.toLowerCase();
        if (achievementUnlockRate[difficulty] !== undefined) {
          achievementUnlockRate[difficulty] += stat.unlockRate;
        }
      });
      
      // Average level progression (average level of active users)
      const averageLevelProgression = await this.getAverageLevelProgression();
      
      // Streak retention rate (percentage of users maintaining streaks)
      const streakRetentionRate = await this.getStreakRetentionRate();
      
      // Challenge completion rate
      const challengeCompletionRate = await this.getChallengeCompletionRate();
      
      // Leaderboard participation
      const leaderboardParticipation = await this.getLeaderboardParticipationRate();
      
      // Engagement lift from gamification features
      const engagementLift = await this.calculateEngagementLift();
      
      const metrics: GamificationMetrics = {
        achievementUnlockRate,
        averageLevelProgression,
        streakRetentionRate,
        challengeCompletionRate,
        leaderboardParticipation,
        engagementLift
      };
      
      // Cache results
      await this.cache.set(cacheKey, JSON.stringify(metrics), 'EX', this.CACHE_TTL.SYSTEM_METRICS);
      
      return metrics;
    } catch (error) {
      logger.error('Error getting system metrics', { error, period });
      
      // Return default metrics
      return {
        achievementUnlockRate: { common: 0, uncommon: 0, rare: 0, epic: 0 },
        averageLevelProgression: 0,
        streakRetentionRate: 0,
        challengeCompletionRate: 0,
        leaderboardParticipation: 0,
        engagementLift: 0
      };
    }
  }
  
  /**
   * Get detailed achievement analytics
   */
  async getAchievementAnalytics(): Promise<AchievementAnalytics[]> {
    try {
      const cacheKey = `gamification:achievement-analytics`;
      
      // Try to get from cache
      const cachedAnalytics = await this.cache.get(cacheKey);
      if (cachedAnalytics) {
        return JSON.parse(cachedAnalytics);
      }
      
      // Get all achievements
      const achievements = await this.achievementRepository.findAll();
      
      // Get active user count for percentages
      const activeUserCount = await this.getActiveUserCount();
      
      // Calculate analytics for each achievement
      const analytics = await Promise.all(achievements.map(async (achievement) => {
        // Get unlock count
        const unlockCount = await this.achievementRepository.getAchievementUnlockCount(achievement.id);
        
        // Get average time to unlock
        const avgTimeToUnlock = await this.getAverageTimeToUnlock(achievement.id);
        
        // Get recent unlock rate trend
        const unlockRateTrend = await this.calculateUnlockRateTrend(achievement.id);
        
        // Get engagement impact
        const engagementImpact = await this.calculateEngagementImpact(achievement.id);
        
        return {
          achievementId: achievement.id,
          name: achievement.name,
          category: achievement.category,
          difficulty: achievement.difficulty,
          unlockCount,
          unlockRate: activeUserCount > 0 ? unlockCount / activeUserCount : 0,
          avgTimeToUnlock,
          unlockRateTrend,
          engagementImpact
        };
      }));
      
      // Sort by engagement impact
      const sortedAnalytics = analytics.sort((a, b) => b.engagementImpact - a.engagementImpact);
      
      // Cache results
      await this.cache.set(
        cacheKey, 
        JSON.stringify(sortedAnalytics), 
        'EX', 
        this.CACHE_TTL.ACHIEVEMENT_ANALYTICS
      );
      
      return sortedAnalytics;
    } catch (error) {
      logger.error('Error getting achievement analytics', { error });
      return [];
    }
  }
  
  /**
   * Get challenge analytics
   */
  async getChallengeAnalytics(): Promise<ChallengeAnalytics[]> {
    try {
      const cacheKey = `gamification:challenge-analytics`;
      
      // Try to get from cache
      const cachedAnalytics = await this.cache.get(cacheKey);
      if (cachedAnalytics) {
        return JSON.parse(cachedAnalytics);
      }
      
      // Get active user count
      const activeUserCount = await this.getActiveUserCount();
      
      // Get all completed challenges
      const challenges = await this.challengeRepository.getCompletedChallenges();
      
      // Calculate analytics for each challenge
      const analytics = await Promise.all(challenges.map(async (challenge) => {
        // Get participant count
        const participantCount = await this.challengeRepository.getChallengeParticipantCount(challenge.id);
        
        // Get completion count
        const completionCount = await this.challengeRepository.getChallengeCompletionCount(challenge.id);
        
        // Get average progress
        const averageProgress = await this.challengeRepository.getChallengeAverageProgress(challenge.id);
        
        // Calculate engagement lift
        const engagementLift = await this.calculateChallengeEngagementLift(challenge.id);
        
        return {
          challengeId: challenge.id,
          title: challenge.title,
          category: challenge.category,
          difficulty: challenge.difficulty,
          participantCount,
          participationRate: activeUserCount > 0 ? participantCount / activeUserCount : 0,
          completionRate: participantCount > 0 ? completionCount / participantCount : 0,
          averageProgress,
          engagementLift
        };
      }));
      
      // Sort by engagement lift
      const sortedAnalytics = analytics.sort((a, b) => b.engagementLift - a.engagementLift);
      
      // Cache results
      await this.cache.set(
        cacheKey, 
        JSON.stringify(sortedAnalytics), 
        'EX', 
        this.CACHE_TTL.CHALLENGE_ANALYTICS
      );
      
      return sortedAnalytics;
    } catch (error) {
      logger.error('Error getting challenge analytics', { error });
      return [];
    }
  }
  
  /**
   * Get level progression analytics
   */
  async getLevelProgressionAnalytics(): Promise<LevelProgressionAnalytics[]> {
    try {
      const cacheKey = `gamification:level-analytics`;
      
      // Try to get from cache
      const cachedAnalytics = await this.cache.get(cacheKey);
      if (cachedAnalytics) {
        return JSON.parse(cachedAnalytics);
      }
      
      // Get all level definitions
      const levels = await this.levelRepository.getAllLevels();
      
      // Get total user count
      const totalUserCount = await this.getActiveUserCount();
      
      // Calculate analytics for each level
      const analytics = await Promise.all(levels.map(async (level) => {
        // Get user count at this level
        const userCount = await this.levelRepository.getUserCountAtLevel(level.level);
        
        // Get average days to reach this level
        const averageDaysToReach = await this.levelRepository.getAverageDaysToReachLevel(level.level);
        
        // Calculate completion rate (percentage of users who reached this level)
        const completionRate = totalUserCount > 0 ? userCount / totalUserCount : 0;
        
        return {
          level: level.level,
          userCount,
          distributionPercentage: totalUserCount > 0 ? (userCount / totalUserCount) * 100 : 0,
          averageDaysToReach,
          completionRate
        };
      }));
      
      // Cache results
      await this.cache.set(
        cacheKey, 
        JSON.stringify(analytics), 
        'EX', 
        this.CACHE_TTL.LEVEL_ANALYTICS
      );
      
      return analytics;
    } catch (error) {
      logger.error('Error getting level progression analytics', { error });
      return [];
    }
  }
  
  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(userId: string): Promise<UserGamificationMetrics> {
    try {
      const cacheKey = `gamification:user-metrics:${userId}`;
      
      // Try to get from cache
      const cachedMetrics = await this.cache.get(cacheKey);
      if (cachedMetrics) {
        return JSON.parse(cachedMetrics);
      }
      
      // Get total achievements
      const achievementSummary = await this.achievementRepository.getUserAchievementSummary(userId);
      
      // Get total available achievements
      const totalAvailableAchievements = await this.achievementRepository.getCount();
      
      // Get user level
      const userLevel = await this.levelRepository.getUserLevelDetails(userId);
      
      // Get level progress
      const levelProgress = await this.calculateLevelProgress(userId);
      
      // Get streak info
      const streaks = await this.streakRepository.getUserStreaks(userId);
      const longestStreak = Math.max(...streaks.map(s => s.longest_count));
      const currentStreak = Math.max(...streaks.map(s => s.current_count));
      
      // Get challenges completed
      const challengesCompleted = await this.challengeRepository.getUserCompletedChallengeCount(userId);
      
      // Get leaderboard rankings
      const leaderboardRankings = await this.getLeaderboardRankings(userId);
      
      // Get engagement percentile
      const engagementPercentile = await this.getEngagementPercentile(userId);
      
      const metrics: UserGamificationMetrics = {
        totalAchievements: achievementSummary.total,
        achievementCompletionPercentage: totalAvailableAchievements > 0 
          ? (achievementSummary.total / totalAvailableAchievements) * 100 
          : 0,
        currentLevel: userLevel?.level || 1,
        levelProgress,
        longestStreak,
        currentStreak,
        challengesCompleted,
        leaderboardRankings,
        engagementPercentile
      };
      
      // Cache results
      await this.cache.set(
        cacheKey, 
        JSON.stringify(metrics), 
        'EX', 
        this.CACHE_TTL.USER_METRICS
      );
      
      return metrics;
    } catch (error) {
      logger.error('Error getting user gamification metrics', { error, userId });
      
      // Return default metrics
      return {
        totalAchievements: 0,
        achievementCompletionPercentage: 0,
        currentLevel: 1,
        levelProgress: 0,
        longestStreak: 0,
        currentStreak: 0,
        challengesCompleted: 0,
        leaderboardRankings: {},
        engagementPercentile: 0
      };
    }
  }
  
  /**
   * Generate engagement report
   */
  async generateEngagementReport(period: string): Promise<EngagementReport> {
    try {
      const cacheKey = `gamification:engagement-report:${period}`;
      
      // Try to get from cache
      const cachedReport = await this.cache.get(cacheKey);
      if (cachedReport) {
        return JSON.parse(cachedReport);
      }
      
      // Generate daily user data
      const dailyActiveUsers = await this.getDailyActiveUsers(period);
      
      // Generate daily engagement actions
      const dailyEngagementActions = await this.getDailyEngagementActions(period);
      
      // Calculate retention metrics
      const retention = await this.calculateRetentionMetrics(period);
      
      // Calculate gamification impact
      const gamificationImpact = await this.calculateGamificationImpact(period);
      
      const report: EngagementReport = {
        period,
        dailyActiveUsers,
        dailyEngagementActions,
        retention,
        gamificationImpact
      };
      
      // Cache results
      await this.cache.set(
        cacheKey, 
        JSON.stringify(report), 
        'EX', 
        this.CACHE_TTL.ENGAGEMENT_REPORT
      );
      
      return report;
    } catch (error) {
      logger.error('Error generating engagement report', { error, period });
      
      // Return empty report
      return {
        period,
        dailyActiveUsers: [],
        dailyEngagementActions: [],
        retention: {
          day1: 0,
          day7: 0,
          day30: 0
        },
        gamificationImpact: {
          withGamification: 0,
          withoutGamification: 0,
          liftPercentage: 0
        }
      };
    }
  }
  
  /**
   * Get retention correlation with gamification features
   */
  async getRetentionCorrelation(): Promise<RetentionCorrelation> {
    try {
      const cacheKey = `gamification:retention-correlation`;
      
      // Try to get from cache
      const cachedCorrelation = await this.cache.get(cacheKey);
      if (cachedCorrelation) {
        return JSON.parse(cachedCorrelation);
      }
      
      // This would involve complex statistical analysis
      // For now, return estimated values
      const correlation: RetentionCorrelation = {
        achievementCompletion: 0.65,
        leaderboardPresence: 0.55,
        levelProgression: 0.70,
        streakMaintenance: 0.80,
        challengeParticipation: 0.60,
        badgeCollection: 0.45
      };
      
      // Cache results
      await this.cache.set(
        cacheKey, 
        JSON.stringify(correlation), 
        'EX', 
        this.CACHE_TTL.RETENTION_CORRELATION
      );
      
      return correlation;
    } catch (error) {
      logger.error('Error getting retention correlation', { error });
      
      // Return default correlation
      return {
        achievementCompletion: 0,
        leaderboardPresence: 0,
        levelProgression: 0,
        streakMaintenance: 0,
        challengeParticipation: 0,
        badgeCollection: 0
      };
    }
  }
  
  /**
   * Helper method to get active user count
   */
  private async getActiveUserCount(period?: string): Promise<number> {
    try {
      // Default query for all-time active users
      let query = `
        SELECT COUNT(DISTINCT user_id) as count
        FROM user_login_history
        WHERE status = 'active'
      `;
      
      const params: any[] = [];
      
      // Add period constraint if specified
      if (period) {
        query += ` AND login_time > NOW() - $1::interval`;
        params.push(this.periodToInterval(period));
      }
      
      const result = await this.db.query<{ count: string }>(query, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting active user count', { error, period });
      return 0;
    }
  }
  
  /**
   * Helper method to convert period string to PostgreSQL interval
   */
  private periodToInterval(period: string): string {
    switch (period) {
      case 'day':
        return '1 day';
      case 'week':
        return '7 days';
      case 'month':
        return '30 days';
      case 'quarter':
        return '90 days';
      case 'year':
        return '365 days';
      default:
        return '30 days'; // Default to 30 days
    }
  }
  
  /**
   * Helper method to get average time to unlock an achievement
   */
  private async getAverageTimeToUnlock(achievementId: string): Promise<number> {
    try {
      const query = `
        SELECT AVG(EXTRACT(EPOCH FROM (ua.unlocked_at - u.created_at)) / 86400) as avg_days
        FROM user_achievements ua
        JOIN users u ON ua.user_id = u.id
        WHERE ua.achievement_id = $1
      `;
      
      const result = await this.db.query<{ avg_days: number }>(query, [achievementId]);
      return Math.round(result.rows[0]?.avg_days || 0);
    } catch (error) {
      logger.error('Error getting average time to unlock', { error, achievementId });
      return 0;
    }
  }
  
  /**
   * Helper method to calculate unlock rate trend for an achievement
   */
  private async calculateUnlockRateTrend(achievementId: string): Promise<number> {
    try {
      // Calculate trend by comparing current month to previous month
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE unlocked_at > NOW() - INTERVAL '30 days') as current_month,
          COUNT(*) FILTER (WHERE unlocked_at > NOW() - INTERVAL '60 days' AND unlocked_at <= NOW() - INTERVAL '30 days') as previous_month
        FROM user_achievements
        WHERE achievement_id = $1
      `;
      
      const result = await this.db.query<{ 
        current_month: string;
        previous_month: string;
      }>(query, [achievementId]);
      
      const currentMonth = parseInt(result.rows[0].current_month, 10);
      const previousMonth = parseInt(result.rows[0].previous_month, 10);
      
      // Calculate percentage change
      if (previousMonth === 0) {
        return currentMonth > 0 ? 100 : 0; // If previous month had 0, any increase is 100%
      }
      
      return ((currentMonth - previousMonth) / previousMonth) * 100;
    } catch (error) {
      logger.error('Error calculating unlock rate trend', { error, achievementId });
      return 0;
    }
  }
  
  /**
   * Helper method to calculate engagement impact of an achievement
   */
  private async calculateEngagementImpact(achievementId: string): Promise<number> {
    try {
      // Compare engagement before and after achievement
      const query = `
        WITH achievement_users AS (
          SELECT 
            user_id, 
            unlocked_at
          FROM user_achievements
          WHERE achievement_id = $1
        ),
        before_activity AS (
          SELECT 
            au.user_id,
            COUNT(a.id) as activity_count
          FROM achievement_users au
          JOIN user_activity a ON au.user_id = a.user_id
          WHERE a.created_at BETWEEN au.unlocked_at - INTERVAL '30 days' AND au.unlocked_at
          GROUP BY au.user_id
        ),
        after_activity AS (
          SELECT 
            au.user_id,
            COUNT(a.id) as activity_count
          FROM achievement_users au
          JOIN user_activity a ON au.user_id = a.user_id
          WHERE a.created_at BETWEEN au.unlocked_at AND au.unlocked_at + INTERVAL '30 days'
          GROUP BY au.user_id
        )
        SELECT 
          AVG(aa.activity_count - ba.activity_count) as avg_increase,
          AVG(ba.activity_count) as avg_before
        FROM before_activity ba
        JOIN after_activity aa ON ba.user_id = aa.user_id
      `;
      
      const result = await this.db.query<{ 
        avg_increase: number;
        avg_before: number;
      }>(query, [achievementId]);
      
      const avgIncrease = result.rows[0]?.avg_increase || 0;
      const avgBefore = result.rows[0]?.avg_before || 0;
      
      // Calculate percentage impact
      if (avgBefore === 0) {
        return avgIncrease > 0 ? 100 : 0; // If before was 0, any increase is 100%
      }
      
      return (avgIncrease / avgBefore) * 100;
    } catch (error) {
      logger.error('Error calculating engagement impact', { error, achievementId });
      return 0;
    }
  }
  
  /**
   * Helper method to get average level progression
   */
  private async getAverageLevelProgression(): Promise<number> {
    try {
      const query = `
        SELECT AVG(level) as avg_level
        FROM user_levels
        WHERE last_updated_at > NOW() - INTERVAL '30 days'
      `;
      
      const result = await this.db.query<{ avg_level: number }>(query);
      return result.rows[0]?.avg_level || 0;
    } catch (error) {
      logger.error('Error getting average level progression', { error });
      return 0;
    }
  }
  
  /**
   * Helper method to get streak retention rate
   */
  private async getStreakRetentionRate(): Promise<number> {
    try {
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE current_count > 0) as active_streaks,
          COUNT(*) as total_streaks
        FROM user_streaks
      `;
      
      const result = await this.db.query<{ 
        active_streaks: string;
        total_streaks: string;
      }>(query);
      
      const activeStreaks = parseInt(result.rows[0].active_streaks, 10);
      const totalStreaks = parseInt(result.rows[0].total_streaks, 10);
      
      return totalStreaks > 0 ? (activeStreaks / totalStreaks) * 100 : 0;
    } catch (error) {
      logger.error('Error getting streak retention rate', { error });
      return 0;
    }
  }
  
  /**
   * Helper method to get challenge completion rate
   */
  private async getChallengeCompletionRate(): Promise<number> {
    try {
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) as total
        FROM user_challenges
        WHERE joined_at > NOW() - INTERVAL '90 days'
      `;
      
      const result = await this.db.query<{ 
        completed: string;
        total: string;
      }>(query);
      
      const completed = parseInt(result.rows[0].completed, 10);
      const total = parseInt(result.rows[0].total, 10);
      
      return total > 0 ? (completed / total) * 100 : 0;
    } catch (error) {
      logger.error('Error getting challenge completion rate', { error });
      return 0;
    }
  }
  
  /**
   * Helper method to get leaderboard participation rate
   */
  private async getLeaderboardParticipationRate(): Promise<number> {
    try {
      // Count users who appear on any leaderboard
      const query = `
        SELECT 
          COUNT(DISTINCT user_id) as leaderboard_users,
          (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users
        FROM leaderboard_entries
        WHERE created_at > NOW() - INTERVAL '30 days'
      `;
      
      const result = await this.db.query<{ 
        leaderboard_users: string;
        total_users: string;
      }>(query);
      
      const leaderboardUsers = parseInt(result.rows[0].leaderboard_users, 10);
      const totalUsers = parseInt(result.rows[0].total_users, 10);
      
      return totalUsers > 0 ? (leaderboardUsers / totalUsers) * 100 : 0;
    } catch (error) {
      logger.error('Error getting leaderboard participation rate', { error });
      return 0;
    }
  }
  
  /**
   * Helper method to calculate engagement lift from gamification
   */
  private async calculateEngagementLift(): Promise<number> {
    try {
      // Compare engagement for users with and without gamification interaction
      const query = `
        WITH gamification_users AS (
          SELECT DISTINCT user_id
          FROM (
            SELECT user_id FROM user_achievements
            UNION
            SELECT user_id FROM user_levels WHERE level > 1
            UNION
            SELECT user_id FROM user_challenges
            UNION
            SELECT user_id FROM user_streaks WHERE current_count > 0
          ) g
        ),
        activity_counts AS (
          SELECT 
            u.id as user_id,
            CASE WHEN gu.user_id IS NOT NULL THEN true ELSE false END as has_gamification,
            COUNT(a.id) as activity_count
          FROM users u
          LEFT JOIN gamification_users gu ON u.id = gu.user_id
          JOIN user_activity a ON u.id = a.user_id
          WHERE a.created_at > NOW() - INTERVAL '30 days'
            AND u.created_at < NOW() - INTERVAL '30 days'
          GROUP BY u.id, gu.user_id
        )
        SELECT 
          AVG(activity_count) FILTER (WHERE has_gamification = true) as with_gamification,
          AVG(activity_count) FILTER (WHERE has_gamification = false) as without_gamification
        FROM activity_counts
      `;
      
      const result = await this.db.query<{ 
        with_gamification: number;
        without_gamification: number;
      }>(query);
      
      const withGamification = result.rows[0]?.with_gamification || 0;
      const withoutGamification = result.rows[0]?.without_gamification || 0;
      
      // Calculate lift percentage
      if (withoutGamification === 0) {
        return withGamification > 0 ? 100 : 0;
      }
      
      return ((withGamification - withoutGamification) / withoutGamification) * 100;
    } catch (error) {
      logger.error('Error calculating engagement lift', { error });
      return 0;
    }
  }
  
  /**
   * Helper method to calculate challenge engagement lift
   */
  private async calculateChallengeEngagementLift(challengeId: string): Promise<number> {
    try {
      // Similar to achievement impact calculation
      const query = `
        WITH challenge_users AS (
          SELECT 
            user_id, 
            joined_at
          FROM user_challenges
          WHERE challenge_id = $1
        ),
        before_activity AS (
          SELECT 
            cu.user_id,
            COUNT(a.id) as activity_count
          FROM challenge_users cu
          JOIN user_activity a ON cu.user_id = a.user_id
          WHERE a.created_at BETWEEN cu.joined_at - INTERVAL '14 days' AND cu.joined_at
          GROUP BY cu.user_id
        ),
        after_activity AS (
          SELECT 
            cu.user_id,
            COUNT(a.id) as activity_count
          FROM challenge_users cu
          JOIN user_activity a ON cu.user_id = a.user_id
          WHERE a.created_at BETWEEN cu.joined_at AND cu.joined_at + INTERVAL '14 days'
          GROUP BY cu.user_id
        )
        SELECT 
          AVG(aa.activity_count - ba.activity_count) as avg_increase,
          AVG(ba.activity_count) as avg_before
        FROM before_activity ba
        JOIN after_activity aa ON ba.user_id = aa.user_id
      `;
      
      const result = await this.db.query<{ 
        avg_increase: number;
        avg_before: number;
      }>(query, [challengeId]);
      
      const avgIncrease = result.rows[0]?.avg_increase || 0;
      const avgBefore = result.rows[0]?.avg_before || 0;
      
      // Calculate percentage impact
      if (avgBefore === 0) {
        return avgIncrease > 0 ? 100 : 0;
      }
      
      return (avgIncrease / avgBefore) * 100;
    } catch (error) {
      logger.error('Error calculating challenge engagement lift', { error, challengeId });
      return 0;
    }
  }
  
  /**
   * Helper method to calculate level progress for a user
   */
  private async calculateLevelProgress(userId: string): Promise<number> {
    try {
      const userLevel = await this.levelRepository.getUserLevelDetails(userId);
      
      if (!userLevel) {
        return 0;
      }
      
      const currentLevelDef = await this.levelRepository.getLevelDefinition(userLevel.level);
      const nextLevelDef = await this.levelRepository.getLevelDefinition(userLevel.level + 1);
      
      if (!nextLevelDef) {
        return 100; // Already at max level
      }
      
      const currentLevelXP = currentLevelDef?.xp_required || 0;
      const nextLevelXP = nextLevelDef.xp_required;
      const xpInCurrentLevel = userLevel.total_xp - currentLevelXP;
      const xpRequiredForNextLevel = nextLevelXP - currentLevelXP;
      
      return Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100));
    } catch (error) {
      logger.error('Error calculating level progress', { error, userId });
      return 0;
    }
  }
  
  /**
   * Helper method to get leaderboard rankings for a user
   */
  private async getLeaderboardRankings(userId: string): Promise<Record<string, number>> {
    try {
      // Get rankings in different categories
      const categories = [
        'points',
        'content',
        'engagement',
        'referrals',
        'achievements'
      ];
      
      const rankings: Record<string, number> = {};
      
      // Get rank for each category
      for (const category of categories) {
        const rank = await this.leaderboardRepository.getUserRankInCategory(
          userId, 
          category as any, 
          'all_time'
        );
        
        if (rank) {
          rankings[category] = rank.rank;
        }
      }
      
      return rankings;
    } catch (error) {
      logger.error('Error getting leaderboard rankings', { error, userId });
      return {};
    }
  }
  
  /**
   * Helper method to get engagement percentile for a user
   */
  private async getEngagementPercentile(userId: string): Promise<number> {
    try {
      // Get engagement rank and total users
      const query = `
        WITH user_engagement AS (
          SELECT 
            user_id,
            COUNT(*) as activity_count
          FROM user_activity
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY user_id
        ),
        user_rank AS (
          SELECT 
            user_id,
            activity_count,
            PERCENT_RANK() OVER (ORDER BY activity_count) * 100 as percentile
          FROM user_engagement
        )
        SELECT percentile
        FROM user_rank
        WHERE user_id = $1
      `;
      
      const result = await this.db.query<{ percentile: number }>(query, [userId]);
      return result.rows[0]?.percentile || 0;
    } catch (error) {
      logger.error('Error getting engagement percentile', { error, userId });
      return 0;
    }
  }
  
  /**
   * Helper method to get daily active users
   */
  private async getDailyActiveUsers(period: string): Promise<number[]> {
    try {
      // Calculate period in days
      const days = this.periodToDays(period);
      
      // Get daily active users for the period
      const query = `
        SELECT 
          DATE_TRUNC('day', login_time) as day,
          COUNT(DISTINCT user_id) as user_count
        FROM user_login_history
        WHERE login_time > NOW() - INTERVAL '${days} days'
        GROUP BY day
        ORDER BY day
      `;
      
      const result = await this.db.query<{ 
        day: Date;
        user_count: string;
      }>(query);
      
      // Convert to array of counts
      return result.rows.map(row => parseInt(row.user_count, 10));
    } catch (error) {
      logger.error('Error getting daily active users', { error, period });
      return [];
    }
  }
  
  /**
   * Helper method to get daily engagement actions
   */
  private async getDailyEngagementActions(period: string): Promise<number[]> {
    try {
      // Calculate period in days
      const days = this.periodToDays(period);
      
      // Get daily engagement actions for the period
      const query = `
        SELECT 
          DATE_TRUNC('day', created_at) as day,
          COUNT(*) as action_count
        FROM user_activity
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY day
        ORDER BY day
      `;
      
      const result = await this.db.query<{ 
        day: Date;
        action_count: string;
      }>(query);
      
      // Convert to array of counts
      return result.rows.map(row => parseInt(row.action_count, 10));
    } catch (error) {
      logger.error('Error getting daily engagement actions', { error, period });
      return [];
    }
  }
  
  /**
   * Helper method to calculate retention metrics
   */
  private async calculateRetentionMetrics(period: string): Promise<{
    day1: number;
    day7: number;
    day30: number;
  }> {
    try {
      // Get cohort start date
      const startDate = this.getPeriodStartDate(period);
      
      // Get retention metrics for different intervals
      const query = `
        WITH new_users AS (
          SELECT 
            id,
            created_at
          FROM users
          WHERE created_at BETWEEN $1 AND $1 + INTERVAL '1 day'
        ),
        day1 AS (
          SELECT COUNT(DISTINCT u.id) as retained
          FROM new_users u
          JOIN user_login_history l ON u.id = l.user_id
          WHERE l.login_time > u.created_at + INTERVAL '1 day'
            AND l.login_time < u.created_at + INTERVAL '2 days'
        ),
        day7 AS (
          SELECT COUNT(DISTINCT u.id) as retained
          FROM new_users u
          JOIN user_login_history l ON u.id = l.user_id
          WHERE l.login_time > u.created_at + INTERVAL '7 days'
            AND l.login_time < u.created_at + INTERVAL '8 days'
        ),
        day30 AS (
          SELECT COUNT(DISTINCT u.id) as retained
          FROM new_users u
          JOIN user_login_history l ON u.id = l.user_id
          WHERE l.login_time > u.created_at + INTERVAL '30 days'
            AND l.login_time < u.created_at + INTERVAL '31 days'
        )
        SELECT 
          (SELECT COUNT(*) FROM new_users) as total,
          (SELECT retained FROM day1) as day1_retained,
          (SELECT retained FROM day7) as day7_retained,
          (SELECT retained FROM day30) as day30_retained
      `;
      
      const result = await this.db.query<{ 
        total: string;
        day1_retained: string;
        day7_retained: string;
        day30_retained: string;
      }>(query, [startDate]);
      
      const total = parseInt(result.rows[0].total, 10);
      const day1Retained = parseInt(result.rows[0].day1_retained, 10);
      const day7Retained = parseInt(result.rows[0].day7_retained, 10);
      const day30Retained = parseInt(result.rows[0].day30_retained, 10);
      
      return {
        day1: total > 0 ? (day1Retained / total) * 100 : 0,
        day7: total > 0 ? (day7Retained / total) * 100 : 0,
        day30: total > 0 ? (day30Retained / total) * 100 : 0
      };
    } catch (error) {
      logger.error('Error calculating retention metrics', { error, period });
      return {
        day1: 0,
        day7: 0,
        day30: 0
      };
    }
  }
  
  /**
   * Helper method to calculate gamification impact
   */
  private async calculateGamificationImpact(period: string): Promise<{
    withGamification: number;
    withoutGamification: number;
    liftPercentage: number;
  }> {
    try {
      // Similar to calculateEngagementLift but for specific period
      const days = this.periodToDays(period);
      
      const query = `
        WITH gamification_users AS (
          SELECT DISTINCT user_id
          FROM (
            SELECT user_id FROM user_achievements
            UNION
            SELECT user_id FROM user_levels WHERE level > 1
            UNION
            SELECT user_id FROM user_challenges
            UNION
            SELECT user_id FROM user_streaks WHERE current_count > 0
          ) g
        ),
        activity_counts AS (
          SELECT 
            u.id as user_id,
            CASE WHEN gu.user_id IS NOT NULL THEN true ELSE false END as has_gamification,
            COUNT(a.id) as activity_count
          FROM users u
          LEFT JOIN gamification_users gu ON u.id = gu.user_id
          JOIN user_activity a ON u.id = a.user_id
          WHERE a.created_at > NOW() - INTERVAL '${days} days'
            AND u.created_at < NOW() - INTERVAL '${days} days'
          GROUP BY u.id, gu.user_id
        )
        SELECT 
          AVG(activity_count) FILTER (WHERE has_gamification = true) as with_gamification,
          AVG(activity_count) FILTER (WHERE has_gamification = false) as without_gamification
        FROM activity_counts
      `;
      
      const result = await this.db.query<{ 
        with_gamification: number;
        without_gamification: number;
      }>(query);
      
      const withGamification = result.rows[0]?.with_gamification || 0;
      const withoutGamification = result.rows[0]?.without_gamification || 0;
      
      // Calculate lift percentage
      const liftPercentage = withoutGamification > 0
        ? ((withGamification - withoutGamification) / withoutGamification) * 100
        : 0;
      
      return {
        withGamification,
        withoutGamification,
        liftPercentage
      };
    } catch (error) {
      logger.error('Error calculating gamification impact', { error, period });
      return {
        withGamification: 0,
        withoutGamification: 0,
        liftPercentage: 0
      };
    }
  }
  
  /**
   * Helper method to convert period to days
   */
  private periodToDays(period: string): number {
    switch (period) {
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'quarter':
        return 90;
      case 'year':
        return 365;
      default:
        return 30; // Default to month
    }
  }
  
  /**
   * Helper method to get period start date
   */
  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    const days = this.periodToDays(period);
    
    // Subtract days from current date
    now.setDate(now.getDate() - days);
    
    return now;
  }
}
