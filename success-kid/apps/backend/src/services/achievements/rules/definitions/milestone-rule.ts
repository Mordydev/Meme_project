/**
 * Milestone Rule
 * 
 * Evaluates one-time events or milestones, such as "Connect wallet" or "Complete profile"
 */
import { Pool } from 'pg';
import { 
  AchievementCriteria,
  AchievementTrigger
} from '../../../../models/achievement';
import { RuleEvaluator } from '../engine';
import { logger } from '../../../../lib/logger';

export class MilestoneRule implements RuleEvaluator {
  constructor(private db: Pool) {}
  
  /**
   * Evaluate a milestone-based criteria
   */
  async evaluate(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    try {
      // For milestone criteria, we simply need to check if the event happened
      // as the trigger already matched the event type
      
      // For most milestone events, we can use the event data directly
      // But for some specific types, we might need to validate details
      
      switch (eventType) {
        case 'wallet.connected':
          return this.validateWalletConnection(userId, criteria, eventData);
          
        case 'profile.updated':
          return this.validateProfileUpdate(userId, criteria, eventData);
          
        case 'market.milestone.reached':
          return this.validateMarketMilestone(userId, criteria, eventData);
          
        case 'user.levelUp':
          return this.validateLevelUp(userId, criteria, eventData);
          
        // For other event types, just return true as the event happened
        default:
          return true;
      }
    } catch (error) {
      logger.error('Error evaluating milestone criteria', { error, userId, criteria });
      return false;
    }
  }
  
  /**
   * Validate wallet connection milestone
   */
  private async validateWalletConnection(
    userId: string, 
    criteria: AchievementCriteria, 
    eventData: any
  ): Promise<boolean> {
    // Check if verification is required
    const requireVerified = criteria.metadata?.requireVerified === true;
    
    if (requireVerified && !eventData.isVerified) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate profile update milestone
   */
  private async validateProfileUpdate(
    userId: string, 
    criteria: AchievementCriteria, 
    eventData: any
  ): Promise<boolean> {
    // Check if specific profile fields are required
    const requiredFields = criteria.metadata?.requiredFields as string[] | undefined;
    
    if (requiredFields && requiredFields.length > 0) {
      // Check if all required fields are present in updated profile
      const updatedFields = Object.keys(eventData.updatedFields || {});
      
      const allFieldsPresent = requiredFields.every(field => 
        updatedFields.includes(field) && 
        eventData.updatedFields[field] !== null && 
        eventData.updatedFields[field] !== ''
      );
      
      if (!allFieldsPresent) {
        return false;
      }
    }
    
    // Check if profile completion percentage is required
    const requiredCompletion = criteria.metadata?.completionPercentage as number | undefined;
    
    if (requiredCompletion !== undefined) {
      // This would need to fetch the profile and calculate completion percentage
      const completionPercentage = await this.getProfileCompletionPercentage(userId);
      
      if (completionPercentage < requiredCompletion) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate market milestone reached
   */
  private async validateMarketMilestone(
    userId: string, 
    criteria: AchievementCriteria, 
    eventData: any
  ): Promise<boolean> {
    // Check if specific milestone is required
    const requiredMilestone = criteria.metadata?.milestone as number | undefined;
    
    if (requiredMilestone !== undefined && eventData.milestone !== requiredMilestone) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate level up milestone
   */
  private async validateLevelUp(
    userId: string, 
    criteria: AchievementCriteria, 
    eventData: any
  ): Promise<boolean> {
    // Check if specific level is required
    const requiredLevel = criteria.metadata?.level as number | undefined;
    
    if (requiredLevel !== undefined && eventData.newLevel !== requiredLevel) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Helper to calculate profile completion percentage
   */
  private async getProfileCompletionPercentage(userId: string): Promise<number> {
    try {
      const query = `
        SELECT * FROM profiles WHERE user_id = $1
      `;
      
      const result = await this.db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return 0;
      }
      
      const profile = result.rows[0];
      
      // Calculate completion based on filled fields
      const fields = [
        'bio',
        'avatar_url',
        'title',
        'social_links'
      ];
      
      let completedFields = 0;
      
      for (const field of fields) {
        if (profile[field] !== null && profile[field] !== '') {
          // For JSON fields like social_links, check if they contain data
          if (field === 'social_links' && Object.keys(profile[field]).length === 0) {
            continue;
          }
          
          completedFields++;
        }
      }
      
      return Math.round((completedFields / fields.length) * 100);
    } catch (error) {
      logger.error('Error calculating profile completion', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get progress for milestone criteria
   */
  async getProgress(
    userId: string,
    criteria: AchievementCriteria
  ): Promise<{ current: number; target: number; complete: boolean }> {
    try {
      // For milestone criteria, progress is either 0 or 100%
      // So we check if the milestone has been completed
      
      let isComplete = false;
      
      switch (criteria.trigger) {
        case 'wallet.connected':
          isComplete = await this.checkWalletConnected(userId, criteria);
          break;
          
        case 'profile.updated':
          isComplete = await this.checkProfileComplete(userId, criteria);
          break;
          
        case 'market.milestone.reached':
          isComplete = await this.checkMarketMilestoneReached(criteria);
          break;
          
        case 'user.levelUp':
          isComplete = await this.checkLevelReached(userId, criteria);
          break;
          
        default:
          isComplete = false;
      }
      
      return {
        current: isComplete ? 1 : 0,
        target: 1,
        complete: isComplete
      };
    } catch (error) {
      logger.error('Error getting milestone criteria progress', { error, userId, criteria });
      return {
        current: 0,
        target: 1,
        complete: false
      };
    }
  }
  
  /**
   * Check if wallet is connected
   */
  private async checkWalletConnected(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<boolean> {
    try {
      const requireVerified = criteria.metadata?.requireVerified === true;
      
      const query = `
        SELECT COUNT(*) as count 
        FROM wallet_connections 
        WHERE user_id = $1
        ${requireVerified ? ' AND is_verified = true' : ''}
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0].count, 10) > 0;
    } catch (error) {
      logger.error('Error checking wallet connection', { error, userId });
      return false;
    }
  }
  
  /**
   * Check if profile is complete according to criteria
   */
  private async checkProfileComplete(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<boolean> {
    try {
      // Get profile data
      const query = `
        SELECT * FROM profiles WHERE user_id = $1
      `;
      
      const result = await this.db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const profile = result.rows[0];
      
      // Check required fields if specified
      const requiredFields = criteria.metadata?.requiredFields as string[] | undefined;
      
      if (requiredFields && requiredFields.length > 0) {
        const allFieldsPresent = requiredFields.every(field => 
          profile[field] !== null && profile[field] !== ''
        );
        
        if (!allFieldsPresent) {
          return false;
        }
      }
      
      // Check completion percentage if specified
      const requiredCompletion = criteria.metadata?.completionPercentage as number | undefined;
      
      if (requiredCompletion !== undefined) {
        const completionPercentage = await this.getProfileCompletionPercentage(userId);
        
        if (completionPercentage < requiredCompletion) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking profile completion', { error, userId });
      return false;
    }
  }
  
  /**
   * Check if market milestone has been reached
   */
  private async checkMarketMilestoneReached(criteria: AchievementCriteria): Promise<boolean> {
    try {
      const requiredMilestone = criteria.metadata?.milestone as number | undefined;
      
      if (requiredMilestone === undefined) {
        return false;
      }
      
      // Check if this milestone has been reached yet
      const query = `
        SELECT * FROM market_milestones
        WHERE milestone = $1 AND reached_at IS NOT NULL
      `;
      
      const result = await this.db.query(query, [requiredMilestone]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking market milestone', { error });
      return false;
    }
  }
  
  /**
   * Check if user has reached a specific level
   */
  private async checkLevelReached(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<boolean> {
    try {
      const requiredLevel = criteria.metadata?.level as number | undefined;
      
      if (requiredLevel === undefined) {
        return false;
      }
      
      const query = `
        SELECT level FROM profiles WHERE user_id = $1
      `;
      
      const result = await this.db.query<{ level: number }>(query, [userId]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      return result.rows[0].level >= requiredLevel;
    } catch (error) {
      logger.error('Error checking user level', { error, userId });
      return false;
    }
  }
}
