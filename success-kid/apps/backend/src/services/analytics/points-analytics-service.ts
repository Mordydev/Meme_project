/**
 * Points Analytics Service
 * 
 * Provides analytics and insights for the points economy, tracking patterns,
 * user behavior, and system-wide metrics for the Success Points system.
 */
import { Redis } from 'ioredis';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { logger } from '../../lib/logger';
import { getRedisClient } from '../../lib/db-client';
import { PointsSource } from '../../models/user-points';

export interface PointsDistribution {
  source: PointsSource;
  amount: number;
  percentage: number;
}

export interface UserPointsMetrics {
  totalPoints: number;
  totalEarned: number;
  totalSpent: number;
  sourceDistribution: PointsDistribution[];
  monthlyTrend: { month: string; earned: number; spent: number }[];
  dailyAverage: number;
  maxSingleDay: number;
  recentActivity: { date: string; amount: number; source: PointsSource }[];
}

export interface SystemPointsMetrics {
  totalPointsInSystem: number;
  dailyActivityRate: { date: string; awarded: number; redeemed: number }[];
  sourceDistribution: PointsDistribution[];
  userCountByPointsRange: { range: string; count: number }[];
  redemptionRate: number;
  averagePointsPerUser: number;
  topSources: { source: PointsSource; total: number }[];
}

export class PointsAnalyticsService {
  private redis: Redis;
  private readonly CACHE_TTL = 60 * 60; // 1 hour cache
  
  constructor(private userPointsRepository: UserPointsRepository) {
    this.redis = getRedisClient();
  }
  
  /**
   * Get points metrics for a specific user
   * 
   * @param userId - User ID to analyze
   * @returns User-specific points metrics
   */
  async getUserPointsMetrics(userId: string): Promise<UserPointsMetrics> {
    const cacheKey = `analytics:user:${userId}`;
    
    try {
      // Try to get from cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Get all user's points transactions
      const transactions = await this.userPointsRepository.getUserPointsHistory(userId);
      
      if (transactions.length === 0) {
        // Return empty metrics if no transactions
        const emptyMetrics: UserPointsMetrics = {
          totalPoints: 0,
          totalEarned: 0,
          totalSpent: 0,
          sourceDistribution: [],
          monthlyTrend: [],
          dailyAverage: 0,
          maxSingleDay: 0,
          recentActivity: []
        };
        
        return emptyMetrics;
      }
      
      // Calculate total points
      const totalPoints = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate total earned and spent
      const totalEarned = transactions
        .filter(tx => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const totalSpent = transactions
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      // Calculate source distribution
      const sourceMap = new Map<PointsSource, number>();
      
      transactions
        .filter(tx => tx.amount > 0) // Only consider earned points
        .forEach(tx => {
          sourceMap.set(tx.source, (sourceMap.get(tx.source) || 0) + tx.amount);
        });
      
      const sourceDistribution: PointsDistribution[] = Array.from(sourceMap.entries())
        .map(([source, amount]) => ({
          source,
          amount,
          percentage: totalEarned > 0 ? (amount / totalEarned) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);
      
      // Calculate monthly trend (last 6 months)
      const monthlyTrend = await this.calculateMonthlyTrend(userId, 6);
      
      // Calculate daily average (from last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTransactions = transactions.filter(tx => 
        new Date(tx.created_at) >= thirtyDaysAgo
      );
      
      // Group by day
      const dailyMap = new Map<string, number>();
      
      recentTransactions
        .filter(tx => tx.amount > 0)
        .forEach(tx => {
          const dateStr = new Date(tx.created_at).toISOString().split('T')[0];
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + tx.amount);
        });
      
      const dailyValues = Array.from(dailyMap.values());
      const dailyAverage = dailyValues.length > 0 
        ? dailyValues.reduce((sum, amount) => sum + amount, 0) / dailyValues.length
        : 0;
      
      const maxSingleDay = dailyValues.length > 0
        ? Math.max(...dailyValues)
        : 0;
      
      // Get recent activity (last 10 transactions)
      const recentActivity = transactions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(tx => ({
          date: new Date(tx.created_at).toISOString(),
          amount: tx.amount,
          source: tx.source
        }));
      
      // Compile metrics
      const metrics: UserPointsMetrics = {
        totalPoints,
        totalEarned,
        totalSpent,
        sourceDistribution,
        monthlyTrend,
        dailyAverage,
        maxSingleDay,
        recentActivity
      };
      
      // Cache results
      await this.redis.set(cacheKey, JSON.stringify(metrics), 'EX', this.CACHE_TTL);
      
      return metrics;
    } catch (error) {
      logger.error('Error getting user points metrics', { error, userId });
      throw error;
    }
  }
  
  /**
   * Get system-wide points metrics
   * 
   * @returns System-wide points metrics
   */
  async getSystemPointsMetrics(): Promise<SystemPointsMetrics> {
    const cacheKey = 'analytics:system:points';
    
    try {
      // Try to get from cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // NOTE: These are placeholder implementations that would need to be
      // replaced with actual database queries in a real system. The current
      // implementation is simplified for illustration purposes.
      
      // Get system-wide points totals
      const totalPointsInSystem = await this.userPointsRepository.getTotalPointsInSystem();
      
      // Get daily activity rate (last 7 days)
      const dailyActivityRate = await this.calculateDailyActivityRate(7);
      
      // Get system-wide source distribution
      const sourceDistribution = await this.calculateSystemSourceDistribution();
      
      // Get user count by points range
      const userCountByPointsRange = await this.calculateUserCountByPointsRange();
      
      // Calculate redemption rate (redeemed points / earned points)
      const redemptionRate = await this.calculateRedemptionRate();
      
      // Calculate average points per user
      const averagePointsPerUser = await this.calculateAveragePointsPerUser();
      
      // Get top sources by volume
      const topSources = sourceDistribution
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(sd => ({ source: sd.source, total: sd.amount }));
      
      // Compile metrics
      const metrics: SystemPointsMetrics = {
        totalPointsInSystem,
        dailyActivityRate,
        sourceDistribution,
        userCountByPointsRange,
        redemptionRate,
        averagePointsPerUser,
        topSources
      };
      
      // Cache results
      await this.redis.set(cacheKey, JSON.stringify(metrics), 'EX', this.CACHE_TTL);
      
      return metrics;
    } catch (error) {
      logger.error('Error getting system points metrics', { error });
      throw error;
    }
  }
  
  /**
   * Calculate monthly trend for a user
   * 
   * @param userId - User ID to analyze
   * @param months - Number of months to include
   * @returns Monthly points trend
   */
  private async calculateMonthlyTrend(userId: string, months: number): Promise<{ month: string; earned: number; spent: number }[]> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);
      startDate.setDate(1);
      
      // Get transactions in range
      const transactions = await this.userPointsRepository.getUserPointsHistoryInRange(
        userId, 
        startDate,
        endDate
      );
      
      // Group by month
      const monthlyData = new Map<string, { earned: number; spent: number }>();
      
      // Initialize all months in range
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        monthlyData.set(monthKey, { earned: 0, spent: 0 });
      }
      
      // Populate with actual data
      transactions.forEach(tx => {
        const date = new Date(tx.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData.has(monthKey)) {
          const data = monthlyData.get(monthKey)!;
          
          if (tx.amount > 0) {
            data.earned += tx.amount;
          } else {
            data.spent += Math.abs(tx.amount);
          }
        }
      });
      
      // Convert to array and sort by month
      return Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          earned: data.earned,
          spent: data.spent
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      logger.error('Error calculating monthly trend', { error, userId });
      return [];
    }
  }
  
  /**
   * Calculate daily activity rate
   * 
   * @param days - Number of days to include
   * @returns Daily activity rate
   */
  private async calculateDailyActivityRate(days: number): Promise<{ date: string; awarded: number; redeemed: number }[]> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      
      // Get system-wide transactions in range
      const transactions = await this.userPointsRepository.getSystemPointsHistoryInRange(
        startDate,
        endDate
      );
      
      // Group by day
      const dailyData = new Map<string, { awarded: number; redeemed: number }>();
      
      // Initialize all days in range
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        dailyData.set(dateKey, { awarded: 0, redeemed: 0 });
      }
      
      // Populate with actual data
      transactions.forEach(tx => {
        const dateKey = new Date(tx.created_at).toISOString().split('T')[0];
        
        if (dailyData.has(dateKey)) {
          const data = dailyData.get(dateKey)!;
          
          if (tx.amount > 0 && tx.source !== 'redemption') {
            data.awarded += tx.amount;
          } else if (tx.source === 'redemption') {
            data.redeemed += Math.abs(tx.amount);
          }
        }
      });
      
      // Convert to array and sort by date
      return Array.from(dailyData.entries())
        .map(([date, data]) => ({
          date,
          awarded: data.awarded,
          redeemed: data.redeemed
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      logger.error('Error calculating daily activity rate', { error });
      return [];
    }
  }
  
  /**
   * Calculate system-wide source distribution
   * 
   * @returns System-wide source distribution
   */
  private async calculateSystemSourceDistribution(): Promise<PointsDistribution[]> {
    try {
      // Get distribution from repository
      const distribution = await this.userPointsRepository.getSystemSourceDistribution();
      
      // Calculate total points awarded
      const totalPoints = distribution.reduce((sum, [_, amount]) => sum + amount, 0);
      
      // Convert to PointsDistribution format
      return distribution.map(([source, amount]) => ({
        source: source as PointsSource,
        amount,
        percentage: totalPoints > 0 ? (amount / totalPoints) * 100 : 0
      }));
    } catch (error) {
      logger.error('Error calculating system source distribution', { error });
      return [];
    }
  }
  
  /**
   * Calculate user count by points range
   * 
   * @returns User counts grouped by points range
   */
  private async calculateUserCountByPointsRange(): Promise<{ range: string; count: number }[]> {
    try {
      // Define ranges
      const ranges = [
        { min: 0, max: 100, label: '0-100' },
        { min: 101, max: 1000, label: '101-1,000' },
        { min: 1001, max: 5000, label: '1,001-5,000' },
        { min: 5001, max: 10000, label: '5,001-10,000' },
        { min: 10001, max: 50000, label: '10,001-50,000' },
        { min: 50001, max: Infinity, label: '50,001+' }
      ];
      
      // Get user counts for each range
      const counts = await Promise.all(
        ranges.map(range => 
          this.userPointsRepository.countUsersInPointsRange(range.min, range.max)
        )
      );
      
      // Combine ranges with counts
      return ranges.map((range, index) => ({
        range: range.label,
        count: counts[index]
      }));
    } catch (error) {
      logger.error('Error calculating user count by points range', { error });
      return [];
    }
  }
  
  /**
   * Calculate redemption rate (redeemed points / earned points)
   * 
   * @returns Redemption rate as a percentage
   */
  private async calculateRedemptionRate(): Promise<number> {
    try {
      // Get total points earned and redeemed
      const totalEarned = await this.userPointsRepository.getTotalPointsEarned();
      const totalRedeemed = await this.userPointsRepository.getTotalPointsRedeemed();
      
      // Calculate rate
      return totalEarned > 0 ? (totalRedeemed / totalEarned) * 100 : 0;
    } catch (error) {
      logger.error('Error calculating redemption rate', { error });
      return 0;
    }
  }
  
  /**
   * Calculate average points per user
   * 
   * @returns Average points per user
   */
  private async calculateAveragePointsPerUser(): Promise<number> {
    try {
      // Get total points in system and user count
      const totalPoints = await this.userPointsRepository.getTotalPointsInSystem();
      const userCount = await this.userPointsRepository.countUsersWithPoints();
      
      // Calculate average
      return userCount > 0 ? totalPoints / userCount : 0;
    } catch (error) {
      logger.error('Error calculating average points per user', { error });
      return 0;
    }
  }
  
  /**
   * Invalidate cache for a specific user
   * 
   * @param userId - User ID to invalidate cache for
   */
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      const key = `analytics:user:${userId}`;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Error invalidating user cache', { error, userId });
    }
  }
  
  /**
   * Invalidate system-wide metrics cache
   */
  async invalidateSystemCache(): Promise<void> {
    try {
      const key = 'analytics:system:points';
      await this.redis.del(key);
    } catch (error) {
      logger.error('Error invalidating system cache', { error });
    }
  }
}
