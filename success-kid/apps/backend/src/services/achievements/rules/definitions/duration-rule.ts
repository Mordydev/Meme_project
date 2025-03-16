/**
 * Duration Rule
 * 
 * Evaluates time-based criteria, such as "Member for X days" or "Active for Y weeks"
 */
import { Pool } from 'pg';
import { 
  AchievementCriteria,
  AchievementTrigger
} from '../../../../models/achievement';
import { RuleEvaluator } from '../engine';
import { logger } from '../../../../lib/logger';

export class DurationRule implements RuleEvaluator {
  constructor(private db: Pool) {}
  
  /**
   * Evaluate a duration-based criteria
   */
  async evaluate(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    if (criteria.threshold === undefined) {
      logger.warn('Duration criteria missing threshold value (days)', { criteria });
      return false;
    }
    
    try {
      // Get the duration metric based on criteria
      const durationType = criteria.metadata?.durationType || 'membership';
      
      // Get current duration in days
      const durationDays = await this.getDurationDays(userId, durationType);
      
      // Check if threshold is met
      return durationDays >= criteria.threshold;
    } catch (error) {
      logger.error('Error evaluating duration criteria', { error, userId, criteria });
      return false;
    }
  }
  
  /**
   * Get the duration in days for the specified metric
   */
  private async getDurationDays(
    userId: string, 
    durationType: string
  ): Promise<number> {
    try {
      switch (durationType) {
        case 'membership':
          return this.getMembershipDuration(userId);
          
        case 'active_posting':
          return this.getActivePostingDuration(userId);
          
        case 'wallet_connection':
          return this.getWalletConnectionDuration(userId);
          
        default:
          logger.warn(`Unsupported duration type: ${durationType}`);
          return 0;
      }
    } catch (error) {
      logger.error('Error getting duration days', { error, userId, durationType });
      return 0;
    }
  }
  
  /**
   * Get membership duration in days
   */
  private async getMembershipDuration(userId: string): Promise<number> {
    try {
      const query = `
        SELECT 
          EXTRACT(DAY FROM (NOW() - created_at)) AS days
        FROM users
        WHERE id = $1
      `;
      
      const result = await this.db.query<{ days: number }>(query, [userId]);
      
      if (result.rows.length === 0) {
        return 0;
      }
      
      return Math.floor(result.rows[0].days);
    } catch (error) {
      logger.error('Error getting membership duration', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get active posting duration in days
   * This calculates the time between first and most recent content
   */
  private async getActivePostingDuration(userId: string): Promise<number> {
    try {
      const query = `
        SELECT 
          EXTRACT(DAY FROM (
            (SELECT MAX(created_at) FROM content WHERE user_id = $1) - 
            (SELECT MIN(created_at) FROM content WHERE user_id = $1)
          )) AS days
      `;
      
      const result = await this.db.query<{ days: number }>(query, [userId]);
      
      if (result.rows.length === 0 || result.rows[0].days === null) {
        return 0;
      }
      
      return Math.floor(result.rows[0].days);
    } catch (error) {
      logger.error('Error getting active posting duration', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get wallet connection duration in days
   */
  private async getWalletConnectionDuration(userId: string): Promise<number> {
    try {
      const query = `
        SELECT 
          EXTRACT(DAY FROM (NOW() - connected_at)) AS days
        FROM wallet_connections
        WHERE user_id = $1
        ORDER BY connected_at ASC
        LIMIT 1
      `;
      
      const result = await this.db.query<{ days: number }>(query, [userId]);
      
      if (result.rows.length === 0) {
        return 0;
      }
      
      return Math.floor(result.rows[0].days);
    } catch (error) {
      logger.error('Error getting wallet connection duration', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get progress for duration criteria
   */
  async getProgress(
    userId: string,
    criteria: AchievementCriteria
  ): Promise<{ current: number; target: number; complete: boolean }> {
    if (!criteria.threshold) {
      return { current: 0, target: 1, complete: false };
    }
    
    try {
      const durationType = criteria.metadata?.durationType || 'membership';
      const current = await this.getDurationDays(userId, durationType);
      const target = criteria.threshold;
      
      return {
        current,
        target,
        complete: current >= target
      };
    } catch (error) {
      logger.error('Error getting duration criteria progress', { error, userId, criteria });
      return {
        current: 0,
        target: criteria.threshold,
        complete: false
      };
    }
  }
}
