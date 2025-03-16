/**
 * Cap Enforcement Service
 * 
 * Handles the enforcement of daily and weekly caps for point earning activities
 * to ensure fair distribution and prevent system exploitation.
 */
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { PointsSource } from '../../models/user-points';
import { logger } from '../../lib/logger';
import { getRedisClient } from '../../lib/db-client';
import { PointsConfig } from './points-service';

export interface CapCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export interface CapOverride {
  userId: string;
  source: PointsSource;
  multiplier?: number;
  absoluteLimit?: number;
  expirationTime: Date;
  reason: string;
  adminId: string;
}

/**
 * Service to enforce points earning caps
 */
export class CapEnforcementService {
  private redis = getRedisClient();
  
  constructor(
    private userPointsRepository: UserPointsRepository,
    private config: PointsConfig
  ) {}

  /**
   * Check if an activity would exceed the daily cap
   */
  async checkDailyCap(
    userId: string, 
    source: PointsSource, 
    amount: number
  ): Promise<CapCheckResult> {
    try {
      // Get points earned today for this source
      const pointsToday = await this.userPointsRepository.getPointsEarnedTodayBySource(userId, source);
      
      // Check override
      const override = await this.getCapOverride(userId, source);
      let limit = this.config.dailyLimits[source] || this.config.defaultDailyLimit;
      
      if (override) {
        if (override.absoluteLimit !== undefined) {
          limit = override.absoluteLimit;
        } else if (override.multiplier !== undefined) {
          limit = Math.floor(limit * override.multiplier);
        }
      }
      
      const remaining = Math.max(0, limit - pointsToday);
      const allowed = amount <= remaining;
      
      return {
        allowed,
        used: pointsToday,
        limit,
        remaining
      };
    } catch (error) {
      logger.error('Error checking daily cap', { error, userId, source, amount });
      // Default to permissive behavior on system errors
      return {
        allowed: true,
        used: 0,
        limit: this.config.dailyLimits[source] || this.config.defaultDailyLimit,
        remaining: this.config.dailyLimits[source] || this.config.defaultDailyLimit
      };
    }
  }

  /**
   * Check if a redemption would exceed the weekly cap
   */
  async checkWeeklyRedemptionCap(
    userId: string, 
    amount: number
  ): Promise<CapCheckResult> {
    try {
      // Get points redeemed this week
      const redeemedThisWeek = await this.userPointsRepository.getPointsRedeemedThisWeek(userId);
      
      // Weekly redemption cap check
      const weeklyLimit = this.config.weeklyRedemptionCap;
      const remaining = Math.max(0, weeklyLimit - redeemedThisWeek);
      const allowed = amount <= remaining;
      
      return {
        allowed,
        used: redeemedThisWeek,
        limit: weeklyLimit,
        remaining
      };
    } catch (error) {
      logger.error('Error checking weekly redemption cap', { error, userId, amount });
      // Be strict on redemption errors
      return {
        allowed: false,
        used: 0,
        limit: this.config.weeklyRedemptionCap,
        remaining: 0
      };
    }
  }

  /**
   * Get status of all daily caps for a user
   */
  async getDailyCapsStatus(
    userId: string
  ): Promise<Record<PointsSource, { used: number; limit: number; remaining: number }>> {
    const result: Record<PointsSource, { used: number; limit: number; remaining: number }> = {} as any;
    
    try {
      // Get each source's daily cap status
      for (const source of Object.keys(this.config.dailyLimits) as PointsSource[]) {
        // Skip sources that shouldn't be user-visible
        if (['redemption', 'admin_adjustment', 'transfer_in', 'transfer_out'].includes(source)) {
          continue;
        }
        
        const pointsToday = await this.userPointsRepository.getPointsEarnedTodayBySource(userId, source);
        
        // Check override
        const override = await this.getCapOverride(userId, source);
        let limit = this.config.dailyLimits[source] || this.config.defaultDailyLimit;
        
        if (override) {
          if (override.absoluteLimit !== undefined) {
            limit = override.absoluteLimit;
          } else if (override.multiplier !== undefined) {
            limit = Math.floor(limit * override.multiplier);
          }
        }
        
        const remaining = Math.max(0, limit - pointsToday);
        
        result[source] = {
          used: pointsToday,
          limit,
          remaining
        };
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting daily caps status', { error, userId });
      // Return default limits on error
      return Object.keys(this.config.dailyLimits).reduce((acc, source) => {
        const src = source as PointsSource;
        acc[src] = {
          used: 0,
          limit: this.config.dailyLimits[src] || this.config.defaultDailyLimit,
          remaining: this.config.dailyLimits[src] || this.config.defaultDailyLimit
        };
        return acc;
      }, {} as Record<PointsSource, { used: number; limit: number; remaining: number }>);
    }
  }

  /**
   * Set a cap override for a user and source
   */
  async setCapOverride(override: CapOverride): Promise<boolean> {
    try {
      const key = `cap_override:${override.userId}:${override.source}`;
      
      // Save override to Redis with expiration
      await this.redis.set(
        key,
        JSON.stringify(override),
        'PX',
        override.expirationTime.getTime() - Date.now()
      );
      
      logger.info('Cap override set', { override });
      
      return true;
    } catch (error) {
      logger.error('Error setting cap override', { error, override });
      return false;
    }
  }

  /**
   * Get cap override for a user and source
   */
  private async getCapOverride(
    userId: string, 
    source: PointsSource
  ): Promise<CapOverride | null> {
    try {
      const key = `cap_override:${userId}:${source}`;
      const data = await this.redis.get(key);
      
      if (!data) {
        return null;
      }
      
      const override = JSON.parse(data) as CapOverride;
      
      // Ensure expiration time is a Date object
      override.expirationTime = new Date(override.expirationTime);
      
      return override;
    } catch (error) {
      logger.error('Error getting cap override', { error, userId, source });
      return null;
    }
  }

  /**
   * Remove a cap override
   */
  async removeCapOverride(userId: string, source: PointsSource): Promise<boolean> {
    try {
      const key = `cap_override:${userId}:${source}`;
      await this.redis.del(key);
      
      logger.info('Cap override removed', { userId, source });
      
      return true;
    } catch (error) {
      logger.error('Error removing cap override', { error, userId, source });
      return false;
    }
  }
}
