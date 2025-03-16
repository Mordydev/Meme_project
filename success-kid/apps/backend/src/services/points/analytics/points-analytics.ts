/**
 * Points Analytics Service
 * 
 * Provides analytics and anomaly detection for the points system.
 */
import { Pool } from 'pg';
import { logger } from '../../../lib/logger';

/**
 * System-wide points metrics
 */
export interface SystemPointsMetrics {
  totalPointsAwarded: number;
  totalPointsRedeemed: number;
  netPointsIssued: number;
  activeUsers: number;
  averagePointsPerUser: number;
  topActivities: Array<{ source: string; percentage: number }>;
  redemptionRate: number;
}

/**
 * User-specific points metrics
 */
export interface UserPointsMetrics {
  totalEarned: number;
  totalRedeemed: number;
  netBalance: number;
  activityBreakdown: Array<{ source: string; amount: number; percentage: number }>;
  dailyAverage: number;
  weeklyTrend: Array<{ day: string; amount: number }>;
  comparisonToAverage: number; // Percentage above/below system average
}

/**
 * Points activity anomaly data
 */
export interface PointsAnomaly {
  userId: string;
  pattern: string;
  confidence: number;
  details: {
    expected: number;
    actual: number;
    deviation: number;
    timeWindow: string;
  };
  timestamp: Date;
}

/**
 * Analytics service for points system
 */
export class PointsAnalyticsService {
  /**
   * Create a new PointsAnalyticsService
   * 
   * @param db Database connection pool
   */
  constructor(private db: Pool) {}
  
  /**
   * Get system-wide points metrics
   * 
   * @param timeframe Optional timeframe to filter metrics (e.g., "today", "week", "month")
   * @returns System-wide points metrics
   */
  async getSystemMetrics(timeframe: string = 'month'): Promise<SystemPointsMetrics> {
    try {
      // Calculate timeframe date range
      const { startDate, endDate } = this.getTimeframeDates(timeframe);
      
      // Get total points awarded
      const awardedResult = await this.db.query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM user_points 
         WHERE amount > 0 AND created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );
      const totalPointsAwarded = parseInt(awardedResult.rows[0].total, 10);
      
      // Get total points redeemed
      const redeemedResult = await this.db.query(
        `SELECT COALESCE(SUM(ABS(amount)), 0) as total 
         FROM user_points 
         WHERE amount < 0 AND source = 'redemption' AND created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );
      const totalPointsRedeemed = parseInt(redeemedResult.rows[0].total, 10);
      
      // Get active users count
      const usersResult = await this.db.query(
        `SELECT COUNT(DISTINCT user_id) as count
         FROM user_points
         WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );
      const activeUsers = parseInt(usersResult.rows[0].count, 10);
      
      // Get top activities
      const activitiesResult = await this.db.query(
        `SELECT source, SUM(amount) as total
         FROM user_points
         WHERE amount > 0 AND created_at BETWEEN $1 AND $2
         GROUP BY source
         ORDER BY total DESC
         LIMIT 5`,
        [startDate, endDate]
      );
      
      const topActivities = activitiesResult.rows.map(row => ({
        source: row.source,
        percentage: totalPointsAwarded > 0 
          ? Math.round((parseInt(row.total, 10) / totalPointsAwarded) * 100) 
          : 0
      }));
      
      // Calculate metrics
      const netPointsIssued = totalPointsAwarded - totalPointsRedeemed;
      const averagePointsPerUser = activeUsers > 0 ? Math.round(totalPointsAwarded / activeUsers) : 0;
      const redemptionRate = totalPointsAwarded > 0 
        ? Math.round((totalPointsRedeemed / totalPointsAwarded) * 100) 
        : 0;
      
      return {
        totalPointsAwarded,
        totalPointsRedeemed,
        netPointsIssued,
        activeUsers,
        averagePointsPerUser,
        topActivities,
        redemptionRate
      };
    } catch (error) {
      logger.error('Error getting system points metrics', { error, timeframe });
      throw error;
    }
  }
  
  /**
   * Get user-specific points metrics
   * 
   * @param userId User ID
   * @param timeframe Optional timeframe to filter metrics (e.g., "today", "week", "month")
   * @returns User-specific points metrics
   */
  async getUserMetrics(userId: string, timeframe: string = 'month'): Promise<UserPointsMetrics> {
    try {
      // Calculate timeframe date range
      const { startDate, endDate } = this.getTimeframeDates(timeframe);
      
      // Get total earned
      const earnedResult = await this.db.query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM user_points 
         WHERE user_id = $1 AND amount > 0 AND created_at BETWEEN $2 AND $3`,
        [userId, startDate, endDate]
      );
      const totalEarned = parseInt(earnedResult.rows[0].total, 10);
      
      // Get total redeemed
      const redeemedResult = await this.db.query(
        `SELECT COALESCE(SUM(ABS(amount)), 0) as total 
         FROM user_points 
         WHERE user_id = $1 AND amount < 0 AND source = 'redemption' AND created_at BETWEEN $2 AND $3`,
        [userId, startDate, endDate]
      );
      const totalRedeemed = parseInt(redeemedResult.rows[0].total, 10);
      
      // Get activity breakdown
      const activityResult = await this.db.query(
        `SELECT source, SUM(amount) as total
         FROM user_points
         WHERE user_id = $1 AND amount > 0 AND created_at BETWEEN $2 AND $3
         GROUP BY source
         ORDER BY total DESC`,
        [userId, startDate, endDate]
      );
      
      const activityBreakdown = activityResult.rows.map(row => ({
        source: row.source,
        amount: parseInt(row.total, 10),
        percentage: totalEarned > 0 
          ? Math.round((parseInt(row.total, 10) / totalEarned) * 100) 
          : 0
      }));
      
      // Get weekly trend
      const weeklyResult = await this.db.query(
        `SELECT 
           TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as day,
           COALESCE(SUM(amount), 0) as total
         FROM user_points
         WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
         GROUP BY day
         ORDER BY day ASC`,
        [userId, startDate, endDate]
      );
      
      const weeklyTrend = weeklyResult.rows.map(row => ({
        day: row.day,
        amount: parseInt(row.total, 10)
      }));
      
      // Calculate daily average
      const dayCount = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyAverage = Math.round(totalEarned / dayCount);
      
      // Compare to system average
      const systemMetrics = await this.getSystemMetrics(timeframe);
      const comparisonToAverage = systemMetrics.averagePointsPerUser > 0
        ? Math.round((totalEarned / systemMetrics.averagePointsPerUser) * 100) - 100
        : 0;
      
      return {
        totalEarned,
        totalRedeemed,
        netBalance: totalEarned - totalRedeemed,
        activityBreakdown,
        dailyAverage,
        weeklyTrend,
        comparisonToAverage
      };
    } catch (error) {
      logger.error('Error getting user points metrics', { userId, timeframe, error });
      throw error;
    }
  }
  
  /**
   * Detect anomalies in user points activity
   * 
   * @returns Array of detected anomalies
   */
  async detectAnomalies(): Promise<PointsAnomaly[]> {
    try {
      const anomalies: PointsAnomaly[] = [];
      
      // Get system averages for various metrics
      const systemAverages = await this.getSystemAverages();
      
      // 1. Detect rapid point accumulation anomalies
      const rapidAccumulationResults = await this.db.query(
        `SELECT user_id, COUNT(*) as transactions, SUM(amount) as total
         FROM user_points
         WHERE amount > 0 AND created_at > NOW() - INTERVAL '1 hour'
         GROUP BY user_id
         HAVING COUNT(*) > $1 OR SUM(amount) > $2
         ORDER BY SUM(amount) DESC
         LIMIT 20`,
        [systemAverages.hourlyTransactionCount * 5, systemAverages.hourlyPointsAverage * 5]
      );
      
      for (const row of rapidAccumulationResults.rows) {
        anomalies.push({
          userId: row.user_id,
          pattern: 'rapid_accumulation',
          confidence: this.calculateAnomalyConfidence(
            parseInt(row.total, 10), 
            systemAverages.hourlyPointsAverage
          ),
          details: {
            expected: systemAverages.hourlyPointsAverage,
            actual: parseInt(row.total, 10),
            deviation: Math.round((parseInt(row.total, 10) / systemAverages.hourlyPointsAverage) * 100),
            timeWindow: '1 hour'
          },
          timestamp: new Date()
        });
      }
      
      // 2. Detect unusual source distribution anomalies
      const sourceDistributionResults = await this.db.query(
        `SELECT user_id, source, COUNT(*) as count, SUM(amount) as total
         FROM user_points
         WHERE amount > 0 AND created_at > NOW() - INTERVAL '1 day'
         GROUP BY user_id, source
         HAVING COUNT(*) > $1
         ORDER BY COUNT(*) DESC
         LIMIT 20`,
        [systemAverages.dailySourceAverage * 10]
      );
      
      for (const row of sourceDistributionResults.rows) {
        anomalies.push({
          userId: row.user_id,
          pattern: `unusual_${row.source}_frequency`,
          confidence: this.calculateAnomalyConfidence(
            parseInt(row.count, 10), 
            systemAverages.dailySourceAverage
          ),
          details: {
            expected: systemAverages.dailySourceAverage,
            actual: parseInt(row.count, 10),
            deviation: Math.round((parseInt(row.count, 10) / systemAverages.dailySourceAverage) * 100),
            timeWindow: '1 day'
          },
          timestamp: new Date()
        });
      }
      
      // Return sorted by confidence
      return anomalies.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error('Error detecting points anomalies', { error });
      return [];
    }
  }
  
  /**
   * Get system-wide averages for anomaly detection
   * 
   * @returns System average metrics
   */
  private async getSystemAverages(): Promise<{
    hourlyTransactionCount: number;
    hourlyPointsAverage: number;
    dailySourceAverage: number;
  }> {
    // Get hourly transaction average
    const hourlyTransactionResult = await this.db.query(
      `SELECT AVG(transaction_count) as avg
       FROM (
         SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*) as transaction_count
         FROM user_points
         WHERE created_at > NOW() - INTERVAL '7 days'
         GROUP BY hour
       ) as hourly_counts`
    );
    
    // Get hourly points average
    const hourlyPointsResult = await this.db.query(
      `SELECT AVG(points_total) as avg
       FROM (
         SELECT DATE_TRUNC('hour', created_at) as hour, SUM(amount) as points_total
         FROM user_points
         WHERE amount > 0 AND created_at > NOW() - INTERVAL '7 days'
         GROUP BY hour
       ) as hourly_points`
    );
    
    // Get daily source average
    const dailySourceResult = await this.db.query(
      `SELECT AVG(source_count) as avg
       FROM (
         SELECT DATE_TRUNC('day', created_at) as day, source, COUNT(*) as source_count
         FROM user_points
         WHERE amount > 0 AND created_at > NOW() - INTERVAL '7 days'
         GROUP BY day, source
       ) as daily_source_counts`
    );
    
    return {
      hourlyTransactionCount: Math.round(parseFloat(hourlyTransactionResult.rows[0].avg) || 10),
      hourlyPointsAverage: Math.round(parseFloat(hourlyPointsResult.rows[0].avg) || 100),
      dailySourceAverage: Math.round(parseFloat(dailySourceResult.rows[0].avg) || 5)
    };
  }
  
  /**
   * Calculate timeframe date range
   * 
   * @param timeframe Timeframe string ("today", "week", "month", "year")
   * @returns Start and end dates
   */
  private getTimeframeDates(timeframe: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeframe.toLowerCase()) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // Default to month
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    return { startDate, endDate };
  }
  
  /**
   * Calculate anomaly confidence based on deviation from expected value
   * 
   * @param actual Actual value
   * @param expected Expected value
   * @returns Confidence score between 0 and 1
   */
  private calculateAnomalyConfidence(actual: number, expected: number): number {
    if (expected === 0) return 0;
    
    // Calculate deviation ratio
    const ratio = actual / expected;
    
    // Scale confidence based on deviation
    if (ratio <= 1) return 0; // Not an anomaly if below expected
    if (ratio > 50) return 1; // Extremely anomalous
    
    // Scale confidence from 0 to 1 based on ratio
    return Math.min(1, (ratio - 1) / 49);
  }
}
