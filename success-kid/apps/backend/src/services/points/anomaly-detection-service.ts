/**
 * Anomaly Detection Service
 * 
 * Provides advanced detection of suspicious or potentially fraudulent activity
 * related to points earning and redemption.
 */
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { PointsSource } from '../../models/user-points';
import { logger } from '../../lib/logger';
import { getRedisClient } from '../../lib/db-client';

export interface ActivityDetails {
  userId: string;
  source: PointsSource;
  amount: number;
  referenceId?: string;
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  confidence: number; // 0-1 scale
  reasons: string[];
  riskScore: number; // 0-100 scale
  suggestedAction: 'allow' | 'review' | 'block';
}

export enum DetectionPattern {
  VELOCITY = 'velocity',
  VOLUME = 'volume',
  TIMING = 'timing',
  PATTERN = 'pattern',
  LOCATION = 'location',
  DEVICE = 'device'
}

export class AnomalyDetectionService {
  private redis = getRedisClient();
  
  // Configuration for anomaly detection
  private config = {
    // Time windows for velocity checks (in seconds)
    velocityWindows: {
      veryShort: 60, // 1 minute
      short: 600, // 10 minutes
      medium: 3600, // 1 hour
      long: 86400 // 24 hours
    },
    
    // Threshold multipliers for different sources
    sourceThresholds: {
      content_creation: { base: 3, multiplier: 2 },
      comment: { base: 5, multiplier: 3 },
      upvote_received: { base: 10, multiplier: 4 },
      daily_login: { base: 1, multiplier: 1 },
      achievement: { base: 3, multiplier: 1.5 },
      referral: { base: 3, multiplier: 2 },
      profile_completion: { base: 1, multiplier: 1 },
      wallet_connection: { base: 1, multiplier: 1 },
      streak_bonus: { base: 1, multiplier: 1 },
      transfer_in: { base: 3, multiplier: 2 },
      transfer_out: { base: 3, multiplier: 2 },
      redemption: { base: 2, multiplier: 1.5 },
      special_event: { base: 5, multiplier: 2 },
      admin_adjustment: { base: 3, multiplier: 1 }
    },
    
    // Global alert thresholds
    dailyPointsThreshold: 5000, // Alert if user earns more than this in a day
    hourlyPointsThreshold: 1000, // Alert if user earns more than this in an hour
    
    // Retention periods
    retentionPeriods: {
      userProfiles: 60 * 60 * 24 * 30, // 30 days
      activityPatterns: 60 * 60 * 24 * 7 // 7 days
    }
  };
  
  constructor(private userPointsRepository: UserPointsRepository) {}
  
  /**
   * Check for anomalous activity
   * 
   * @param activity - Details of the activity to check
   * @returns Analysis result with anomaly detection
   */
  async detectAnomaly(activity: ActivityDetails): Promise<AnomalyResult> {
    const result: AnomalyResult = {
      isAnomaly: false,
      confidence: 0,
      reasons: [],
      riskScore: 0,
      suggestedAction: 'allow'
    };
    
    try {
      // Run various detection algorithms
      await Promise.all([
        this.checkActivityVelocity(activity, result),
        this.checkActivityVolume(activity, result),
        this.checkActivityPatterns(activity, result),
        this.checkTimeAnomaly(activity, result)
      ]);
      
      // Calculate overall risk score based on individual checks
      result.riskScore = Math.min(100, result.reasons.length * 20);
      
      // Determine if this is an anomaly based on risk score
      result.isAnomaly = result.riskScore >= 40;
      
      // Set confidence level based on risk score
      result.confidence = result.riskScore / 100;
      
      // Determine suggested action
      if (result.riskScore >= 70) {
        result.suggestedAction = 'block';
      } else if (result.riskScore >= 40) {
        result.suggestedAction = 'review';
      } else {
        result.suggestedAction = 'allow';
      }
      
      // Log high-risk activities
      if (result.riskScore >= 40) {
        logger.warn('Detected anomalous activity', {
          userId: activity.userId,
          source: activity.source,
          amount: activity.amount,
          riskScore: result.riskScore,
          reasons: result.reasons,
          suggestedAction: result.suggestedAction
        });
        
        // Record the anomaly for further analysis
        await this.recordAnomaly(activity, result);
      }
      
      return result;
    } catch (error) {
      logger.error('Error in anomaly detection', { error, activity });
      
      // Default to permissive behavior on system errors
      return {
        isAnomaly: false,
        confidence: 0,
        reasons: ['Error in anomaly detection'],
        riskScore: 0,
        suggestedAction: 'allow'
      };
    }
  }
  
  /**
   * Check velocity of activity (rate of points earned over time)
   */
  private async checkActivityVelocity(activity: ActivityDetails, result: AnomalyResult): Promise<void> {
    const { userId, source, amount } = activity;
    
    try {
      // Get counts from various time windows
      const [veryShortCount, shortCount, mediumCount, longCount] = await Promise.all([
        this.countActivitiesInWindow(userId, source, this.config.velocityWindows.veryShort),
        this.countActivitiesInWindow(userId, source, this.config.velocityWindows.short),
        this.countActivitiesInWindow(userId, source, this.config.velocityWindows.medium),
        this.countActivitiesInWindow(userId, source, this.config.velocityWindows.long)
      ]);
      
      // Get the threshold for this source
      const threshold = this.config.sourceThresholds[source] || { base: 3, multiplier: 2 };
      
      // Check against thresholds
      if (veryShortCount > threshold.base * 3) {
        result.reasons.push(`Extremely high velocity: ${veryShortCount} ${source} activities in the last minute`);
      } else if (shortCount > threshold.base * threshold.multiplier * 3) {
        result.reasons.push(`Very high velocity: ${shortCount} ${source} activities in the last 10 minutes`);
      } else if (mediumCount > threshold.base * threshold.multiplier * 6) {
        result.reasons.push(`High velocity: ${mediumCount} ${source} activities in the last hour`);
      } else if (longCount > threshold.base * threshold.multiplier * 10) {
        result.reasons.push(`Elevated velocity: ${longCount} ${source} activities in the last 24 hours`);
      }
    } catch (error) {
      logger.error('Error checking activity velocity', { error, userId, source });
    }
  }
  
  /**
   * Check volume of points earned over various timeframes
   */
  private async checkActivityVolume(activity: ActivityDetails, result: AnomalyResult): Promise<void> {
    const { userId, source, amount } = activity;
    
    try {
      // Get total points earned today and in the last hour
      const pointsToday = await this.userPointsRepository.getPointsEarnedToday(userId);
      const hourlyPoints = await this.getTotalPointsInWindow(userId, this.config.velocityWindows.medium);
      
      // Calculate what this activity would bring the total to
      const projectedDailyTotal = pointsToday + amount;
      const projectedHourlyTotal = hourlyPoints + amount;
      
      // Check against thresholds
      if (projectedHourlyTotal > this.config.hourlyPointsThreshold) {
        result.reasons.push(`High hourly points volume: ${projectedHourlyTotal} points in the last hour`);
      }
      
      if (projectedDailyTotal > this.config.dailyPointsThreshold) {
        result.reasons.push(`High daily points volume: ${projectedDailyTotal} points today`);
      }
      
      // Check against user's historical average (if available)
      const averageDailyPoints = await this.getUserAverageDailyPoints(userId);
      if (averageDailyPoints && projectedDailyTotal > averageDailyPoints * 3) {
        result.reasons.push(`Points volume significantly higher than user average: ${projectedDailyTotal} vs avg ${averageDailyPoints}`);
      }
    } catch (error) {
      logger.error('Error checking activity volume', { error, userId, source });
    }
  }
  
  /**
   * Check for suspicious patterns in activity
   */
  private async checkActivityPatterns(activity: ActivityDetails, result: AnomalyResult): Promise<void> {
    const { userId, source, amount } = activity;
    
    try {
      // Check for unusual source distribution
      // This looks for users who are heavily focused on a single points source
      const sourceDistribution = await this.getSourceDistribution(userId);
      const sourceCount = Object.keys(sourceDistribution).length;
      
      // If user has multiple sources but one dominates (>85% from one source)
      if (sourceCount > 1) {
        const currentSourcePercentage = (sourceDistribution[source] || 0) * 100;
        
        if (currentSourcePercentage > 85) {
          result.reasons.push(`Unusual concentration: ${Math.round(currentSourcePercentage)}% of points from ${source}`);
        }
      }
      
      // Check for abnormally large amount for this source
      const averageAmountForSource = await this.getAverageAmountForSource(userId, source);
      if (averageAmountForSource && amount > averageAmountForSource * 3) {
        result.reasons.push(`Amount much larger than usual for ${source}: ${amount} vs avg ${Math.round(averageAmountForSource)}`);
      }
      
      // Check for other pattern-based detection
      // Additional pattern detection could be added here
    } catch (error) {
      logger.error('Error checking activity patterns', { error, userId, source });
    }
  }
  
  /**
   * Check for time-based anomalies (unusual activity times)
   */
  private async checkTimeAnomaly(activity: ActivityDetails, result: AnomalyResult): Promise<void> {
    const { userId, source, timestamp = new Date() } = activity;
    
    try {
      // Check for unusual activity times (e.g., user who normally acts during daytime suddenly active at 3am)
      const userActiveHours = await this.getUserActiveHours(userId);
      
      if (userActiveHours && userActiveHours.count > 10) { // Only if we have sufficient data
        const hour = timestamp.getUTCHours();
        
        // If this hour is not in the user's top 75% of active hours
        if (!userActiveHours.topHours.includes(hour)) {
          result.reasons.push(`Activity at unusual time for this user: UTC hour ${hour}`);
        }
      }
    } catch (error) {
      logger.error('Error checking time anomaly', { error, userId, source });
    }
  }
  
  /**
   * Count activities in a time window
   */
  private async countActivitiesInWindow(userId: string, source: PointsSource, windowSeconds: number): Promise<number> {
    const key = `anomaly:count:${userId}:${source}:${windowSeconds}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return parseInt(cached, 10);
    }
    
    // Calculate window start time
    const windowStart = new Date(Date.now() - (windowSeconds * 1000));
    
    // Query database
    const count = await this.userPointsRepository.countActivitiesSince(userId, source, windowStart);
    
    // Cache result (for half the window duration to ensure freshness)
    await this.redis.set(key, count.toString(), 'EX', Math.floor(windowSeconds / 2));
    
    return count;
  }
  
  /**
   * Get total points earned in a time window
   */
  private async getTotalPointsInWindow(userId: string, windowSeconds: number): Promise<number> {
    const key = `anomaly:points:${userId}:${windowSeconds}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return parseInt(cached, 10);
    }
    
    // Calculate window start time
    const windowStart = new Date(Date.now() - (windowSeconds * 1000));
    
    // Query database
    const points = await this.userPointsRepository.getPointsEarnedSince(userId, windowStart);
    
    // Cache result (for half the window duration to ensure freshness)
    await this.redis.set(key, points.toString(), 'EX', Math.floor(windowSeconds / 2));
    
    return points;
  }
  
  /**
   * Get user's average daily points (based on history)
   */
  private async getUserAverageDailyPoints(userId: string): Promise<number | null> {
    const key = `anomaly:avgdaily:${userId}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return parseFloat(cached);
    }
    
    // Get recent history (last 30 days)
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    // Query database - this would be simplified with a dedicated repository method
    // For now, we'll get all transactions and calculate ourselves
    const transactions = await this.userPointsRepository.getUserPointsHistorySince(userId, startDate);
    
    if (transactions.length === 0) {
      return null;
    }
    
    // Group by day and calculate average
    const pointsByDay = transactions.reduce((acc, tx) => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const days = Object.keys(pointsByDay).length;
    const totalPoints = Object.values(pointsByDay).reduce((sum, points) => sum + points, 0);
    
    const averageDaily = days > 0 ? totalPoints / days : null;
    
    // Cache result (for 6 hours to ensure reasonable freshness)
    if (averageDaily !== null) {
      await this.redis.set(key, averageDaily.toString(), 'EX', 6 * 60 * 60);
    }
    
    return averageDaily;
  }
  
  /**
   * Get distribution of points by source for a user
   */
  private async getSourceDistribution(userId: string): Promise<Record<PointsSource, number>> {
    const key = `anomaly:srcdist:${userId}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Get recent history (last 30 days)
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    // Query database
    const transactions = await this.userPointsRepository.getUserPointsHistorySince(userId, startDate);
    
    // Calculate distribution
    const totalPoints = transactions.reduce((sum, tx) => sum + Math.max(0, tx.amount), 0);
    
    const distribution = transactions.reduce((acc, tx) => {
      if (tx.amount > 0) { // Only count positive points
        acc[tx.source] = (acc[tx.source] || 0) + tx.amount;
      }
      return acc;
    }, {} as Record<PointsSource, number>);
    
    // Convert to percentages
    if (totalPoints > 0) {
      Object.keys(distribution).forEach(source => {
        distribution[source as PointsSource] /= totalPoints;
      });
    }
    
    // Cache result (for 6 hours)
    await this.redis.set(key, JSON.stringify(distribution), 'EX', 6 * 60 * 60);
    
    return distribution;
  }
  
  /**
   * Get average amount for a specific source
   */
  private async getAverageAmountForSource(userId: string, source: PointsSource): Promise<number | null> {
    const key = `anomaly:srcavg:${userId}:${source}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return parseFloat(cached);
    }
    
    // Get recent history (last 30 days)
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    // Query database
    const transactions = await this.userPointsRepository.getUserPointsHistoryBySource(userId, source, startDate);
    
    if (transactions.length === 0) {
      return null;
    }
    
    // Calculate average
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const average = totalAmount / transactions.length;
    
    // Cache result (for 6 hours)
    await this.redis.set(key, average.toString(), 'EX', 6 * 60 * 60);
    
    return average;
  }
  
  /**
   * Get user's active hours pattern
   */
  private async getUserActiveHours(userId: string): Promise<{ count: number; topHours: number[] } | null> {
    const key = `anomaly:activehours:${userId}`;
    
    // Try to get from cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Get recent history (last 30 days)
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    // Query database
    const transactions = await this.userPointsRepository.getUserPointsHistorySince(userId, startDate);
    
    if (transactions.length < 10) { // Not enough data
      return null;
    }
    
    // Count activities by hour (UTC)
    const hourCounts = transactions.reduce((acc, tx) => {
      const hour = new Date(tx.created_at).getUTCHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // Sort hours by activity count
    const sortedHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([hour]) => parseInt(hour, 10)); // Get just the hour
    
    // Take top 75% of active hours
    const topCount = Math.ceil(sortedHours.length * 0.75);
    const topHours = sortedHours.slice(0, topCount);
    
    const result = { count: transactions.length, topHours };
    
    // Cache result (for 24 hours)
    await this.redis.set(key, JSON.stringify(result), 'EX', 24 * 60 * 60);
    
    return result;
  }
  
  /**
   * Record detected anomaly for further analysis
   */
  private async recordAnomaly(activity: ActivityDetails, result: AnomalyResult): Promise<void> {
    try {
      // Store anomaly details in Redis with TTL
      const key = `anomaly:record:${activity.userId}:${Date.now()}`;
      const data = JSON.stringify({
        activity,
        assessment: result,
        timestamp: new Date().toISOString()
      });
      
      await this.redis.set(key, data, 'EX', 30 * 24 * 60 * 60); // 30 days retention
      
      // Also update a counter for quick access to anomaly counts
      await this.redis.incr(`anomaly:count:${activity.userId}`);
      await this.redis.expire(`anomaly:count:${activity.userId}`, 30 * 24 * 60 * 60);
    } catch (error) {
      logger.error('Error recording anomaly', { error, activity });
    }
  }
  
  /**
   * Get count of anomalies for a user
   */
  async getAnomalyCount(userId: string): Promise<number> {
    try {
      const count = await this.redis.get(`anomaly:count:${userId}`);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error('Error getting anomaly count', { error, userId });
      return 0;
    }
  }
  
  /**
   * Reset user's risk profile (for testing or after manual review)
   */
  async resetUserRiskProfile(userId: string): Promise<boolean> {
    try {
      // Get all keys related to this user's risk profile
      const keys = await this.redis.keys(`anomaly:*:${userId}*`);
      
      // Delete all keys
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      return true;
    } catch (error) {
      logger.error('Error resetting user risk profile', { error, userId });
      return false;
    }
  }
}
