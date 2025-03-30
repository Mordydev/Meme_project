/**
 * Redis Cap Tracker
 * 
 * Implements a Redis-based system for tracking and enforcing daily and weekly caps on 
 * points-earning activities. Uses distributed counters with automatic expiration.
 */
import { redisClient } from '../../../lib/redis-client';
import { PointsSource, POINTS_CAPS } from '../../../models/entities/points.model';
import { logger } from '../../../lib/logger';

/**
 * Cap check result interface
 */
export interface CapCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  reason?: string;
  resetsAt: Date;
}

/**
 * Cap type enumeration
 */
export enum CapType {
  DAILY = 'daily',
  WEEKLY = 'weekly'
}

/**
 * Redis-based implementation of activity cap tracking and enforcement
 */
export class RedisCapTracker {
  // Redis key prefixes
  private readonly DAILY_CAP_PREFIX = 'caps:daily';
  private readonly WEEKLY_CAP_PREFIX = 'caps:weekly';
  
  /**
   * Check if an activity is within its daily cap
   * 
   * @param userId User ID
   * @param source Activity source
   * @param amount Points amount for this activity
   * @returns Cap check result
   */
  async checkDailyCap(userId: string, source: PointsSource, amount: number): Promise<CapCheckResult> {
    return this.checkCap(userId, source, amount, CapType.DAILY);
  }
  
  /**
   * Check if an activity is within its weekly cap
   * 
   * @param userId User ID
   * @param source Activity source
   * @param amount Points amount for this activity
   * @returns Cap check result
   */
  async checkWeeklyCap(userId: string, source: PointsSource, amount: number): Promise<CapCheckResult> {
    return this.checkCap(userId, source, amount, CapType.WEEKLY);
  }
  
  /**
   * Check if an activity is within its cap
   * 
   * @param userId User ID
   * @param source Activity source
   * @param amount Points amount for this activity
   * @param capType Cap type (daily or weekly)
   * @returns Cap check result
   */
  private async checkCap(
    userId: string,
    source: PointsSource,
    amount: number,
    capType: CapType
  ): Promise<CapCheckResult> {
    // Get the cap limit for this source safely, defaulting to 0 if not defined
    const limit = (POINTS_CAPS as Record<PointsSource, number>)[source] ?? 0;

    // If no cap, return unlimited
    if (limit === 0) {
      return {
        allowed: true,
        current: 0,
        limit: 0,
        remaining: Number.MAX_SAFE_INTEGER,
        resetsAt: this.getNextReset(capType)
      };
    }
    
    // Build Redis key for this user, source, and period
    const key = this.buildCapKey(userId, source, capType);
    
    // Get current usage from Redis
    let current = 0;
    try {
      const value = await redisClient.get(key);
      current = value ? parseInt(value, 10) : 0;
    } catch (error) {
      logger.error('Error getting cap usage from Redis', { userId, source, capType, error });
      // Fail open to avoid blocking users if Redis is down
      return {
        allowed: true,
        current: 0,
        limit,
        remaining: limit,
        resetsAt: this.getNextReset(capType)
      };
    }
    
    // Calculate remaining points
    const remaining = Math.max(0, limit - current);
    
    // Check if the cap would be exceeded
    if (remaining < amount) {
      return {
        allowed: false,
        current,
        limit,
        remaining,
        reason: `${capType.toUpperCase()}_CAP_REACHED`,
        resetsAt: this.getNextReset(capType)
      };
    }
    
    return {
      allowed: true,
      current,
      limit,
      remaining,
      resetsAt: this.getNextReset(capType)
    };
  }
  
  /**
   * Increment the usage counter for an activity
   * 
   * @param userId User ID
   * @param source Activity source
   * @param amount Points amount for this activity
   * @param capType Cap type (daily or weekly)
   * @returns The new value of the counter after incrementing.
   */
  async incrementCap(
    userId: string,
    source: PointsSource,
    amount: number,
    capType: CapType
  ): Promise<number> {
    // Build Redis key
    const key = this.buildCapKey(userId, source, capType);
    try {
      // Use INCRBY for atomic increment
      const newValue = await redisClient.client.incrby(key, amount); // Use .client

      // If this is the first increment for this period, set the expiry
      if (newValue === amount) {
        const expirySeconds = this.getExpirySeconds(capType);
        await redisClient.client.expire(key, expirySeconds); // Use .client
        logger.debug(`Set expiry for cap key`, { key, expirySeconds });
      }

      // Return the new value after incrementing
      return newValue;
    } catch (error) {
      logger.error('Error incrementing cap in Redis', { userId, source, amount, capType, error });
      // Rethrow error so the service layer knows the increment failed
      throw new Error(`Failed to increment cap for ${userId}:${source}:${capType}`);
    }
  }

  /**
   * Atomically decrement the usage counter for an activity (e.g., to compensate after exceeding cap).
   *
   * @param userId User ID
   * @param source Activity source
   * @param amount Points amount to decrement by
   * @param capType Cap type (daily or weekly)
   * @returns The new value of the counter after decrementing.
   */
  async decrementCap(
    userId: string,
    source: PointsSource,
    amount: number,
    capType: CapType
  ): Promise<number> {
    // Build Redis key
    const key = this.buildCapKey(userId, source, capType);
    try {
      // Use DECRBY for atomic decrement
      const newValue = await redisClient.client.decrby(key, amount);
      logger.debug('Decremented cap usage', { key, amount, newValue });
      return newValue;
    } catch (error) {
      logger.error('Error decrementing cap in Redis', { userId, source, amount, capType, error });
      // Log error but don't necessarily block - depends on context
      // Returning -1 or similar might indicate failure
      return -1; // Indicate failure
    }
  }

  /**
   * Build a Redis key for a cap
   * 
   * @param userId User ID
   * @param source Activity source
   * @param capType Cap type
   * @returns Redis key
   */
  private buildCapKey(userId: string, source: PointsSource, capType: CapType): string {
    const period = this.getCurrentPeriod(capType);
    const prefix = capType === CapType.DAILY ? this.DAILY_CAP_PREFIX : this.WEEKLY_CAP_PREFIX;
    return `${prefix}:${userId}:${source}:${period}`;
  }
  
  /**
   * Get the current period string
   * 
   * @param capType Cap type
   * @returns Period string
   */
  private getCurrentPeriod(capType: CapType): string {
    const date = new Date();
    
    if (capType === CapType.DAILY) {
      // Format: YYYY-MM-DD
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else {
      // Get week number (ISO week)
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      
      // Format: YYYY-WW
      return `${date.getFullYear()}-${String(weekNumber).padStart(2, '0')}`;
    }
  }
  
  /**
   * Get the next reset time
   * 
   * @param capType Cap type
   * @returns Next reset date
   */
  private getNextReset(capType: CapType): Date {
    const now = new Date();
    
    if (capType === CapType.DAILY) {
      // Next day at midnight UTC
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    } else {
      // Next week (Monday) at midnight UTC
      const daysUntilMonday = 1 - now.getDay();
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + (daysUntilMonday <= 0 ? daysUntilMonday + 7 : daysUntilMonday));
      nextMonday.setHours(0, 0, 0, 0);
      return nextMonday;
    }
  }
  
  /**
   * Get expiry seconds for cap keys
   * 
   * @param capType Cap type
   * @returns Seconds until reset
   */
  private getExpirySeconds(capType: CapType): number {
    const now = new Date();
    const resetDate = this.getNextReset(capType);
    
    // Add a small buffer (1 hour) to ensure key doesn't expire early due to clock differences
    return Math.ceil((resetDate.getTime() - now.getTime()) / 1000) + 3600;
  }
  
  /**
   * Get all caps for a user
   * 
   * @param userId User ID
   * @returns Map of sources to their current cap usage
   */
  async getAllCaps(userId: string): Promise<Map<PointsSource, { daily: CapCheckResult; weekly: CapCheckResult }>> {
    const result = new Map();
    const capsDefinition = POINTS_CAPS as Record<PointsSource, number>;

    // Get caps for all sources that have defined limits
    for (const source of Object.keys(capsDefinition) as PointsSource[]) {
      if (capsDefinition[source] > 0) {
        result.set(source, {
          daily: await this.checkCap(userId, source, 0, CapType.DAILY), // checkCap already handles default 0
          weekly: await this.checkCap(userId, source, 0, CapType.WEEKLY) // checkCap already handles default 0
        });
      }
    }
    
    return result;
  }
  
  /**
   * Reset a cap for testing or administrative purposes
   * 
   * @param userId User ID
   * @param source Activity source
   * @param capType Cap type
   */
  async resetCap(userId: string, source: PointsSource, capType: CapType): Promise<void> {
    const key = this.buildCapKey(userId, source, capType);
    await redisClient.del(key);
  }
}

export const redisCapTracker = new RedisCapTracker();
