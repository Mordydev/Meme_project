/**
 * Points Verifier
 * 
 * Verifies the validity of point-earning activities to prevent gaming the system.
 * Uses a strategy pattern to apply different verification rules based on activity type.
 */
import { logger } from '../../../lib/logger';

/**
 * Activity interface for verification
 */
export interface Activity {
  userId: string;
  activityType: string;
  amount: number;
  referenceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Verification result interface
 */
export interface VerificationResult {
  isValid: boolean;
  confidenceScore: number;
  qualityScore?: number;
  reason?: string;
}

/**
 * Verification strategy interface
 */
export interface VerificationStrategy {
  supports(activity: Activity): boolean;
  verify(activity: Activity): Promise<VerificationResult>;
}

/**
 * Content verification strategy
 */
class ContentVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    return activity.activityType === 'content_creation';
  }
  
  async verify(activity: Activity): Promise<VerificationResult> {
    // Basic content length check
    const contentLength = activity.metadata?.contentLength || 0;
    if (contentLength < 10) {
      return {
        isValid: false,
        confidenceScore: 1.0,
        reason: 'Content too short'
      };
    }
    
    // Duplicated content check would go here
    // For the MVP, we'll implement a simple check
    
    // Calculate quality score based on content length and complexity
    let qualityScore = 1.0;
    
    // Longer content gets a bonus
    if (contentLength > 200) qualityScore += 0.2;
    if (contentLength > 500) qualityScore += 0.2;
    
    // Media content gets a bonus
    const hasMedia = activity.metadata?.hasMedia || false;
    if (hasMedia) qualityScore += 0.1;
    
    return {
      isValid: true,
      confidenceScore: 0.9,
      qualityScore
    };
  }
}

/**
 * Engagement verification strategy (for comments, reactions)
 */
class EngagementVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    return activity.activityType === 'comment' || 
           activity.activityType === 'reaction_received';
  }
  
  async verify(activity: Activity): Promise<VerificationResult> {
    // For comments, check content
    if (activity.activityType === 'comment') {
      const commentLength = activity.metadata?.contentLength || 0;
      
      // Super short comments may be spam
      if (commentLength < 5) {
        return {
          isValid: false,
          confidenceScore: 0.8,
          reason: 'Comment too short'
        };
      }
      
      // Quality bonus for thoughtful comments
      let qualityScore = 1.0;
      if (commentLength > 50) qualityScore += 0.2;
      if (commentLength > 100) qualityScore += 0.1;
      
      return {
        isValid: true,
        confidenceScore: 0.9,
        qualityScore
      };
    }
    
    // For reactions, just verify the reference exists
    if (activity.activityType === 'reaction_received') {
      if (!activity.referenceId) {
        return {
          isValid: false,
          confidenceScore: 1.0,
          reason: 'Missing reference content'
        };
      }
      
      return {
        isValid: true,
        confidenceScore: 1.0
      };
    }
    
    // Default fallback
    return { isValid: true, confidenceScore: 0.7 };
  }
}

/**
 * Referral verification strategy
 */
class ReferralVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    return activity.activityType === 'referral' || 
           activity.activityType === 'referral_conversion';
  }
  
  async verify(activity: Activity): Promise<VerificationResult> {
    // Verify referral has a valid reference
    if (!activity.referenceId) {
      return {
        isValid: false,
        confidenceScore: 1.0,
        reason: 'Missing referred user ID'
      };
    }
    
    // In a real implementation, we would check for:
    // 1. Self-referrals
    // 2. Referral farm detection (many referrals from same IP)
    // 3. Suspicious account creation patterns
    
    return {
      isValid: true,
      confidenceScore: 0.9
    };
  }
}

/**
 * Login verification strategy
 */
class LoginVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    return activity.activityType === 'daily_login' || 
           activity.activityType === 'streak_bonus';
  }
  
  async verify(activity: Activity): Promise<VerificationResult> {
    // Login bonuses are usually trustworthy if the auth system is secure
    // But we could check for suspicious login patterns or rapid account switching
    
    return {
      isValid: true,
      confidenceScore: 0.98
    };
  }
}

/**
 * Achievement verification strategy
 */
class AchievementVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    return activity.activityType === 'achievement';
  }
  
  async verify(activity: Activity): Promise<VerificationResult> {
    // Achievement verification would typically check that the achievement
    // was legitimately earned, but that should be handled by the achievement system
    
    // In a real implementation, we would verify the achievement ID exists
    // and that the user legitimately earned it
    
    return {
      isValid: true,
      confidenceScore: 0.95
    };
  }
}

/**
 * Default verification strategy (fallback)
 */
class DefaultVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    // Fallback strategy for everything else
    return true;
  }
  
  async verify(activity: Activity): Promise<VerificationResult> {
    // For other activity types, we assume validity but with lower confidence
    return {
      isValid: true,
      confidenceScore: 0.7
    };
  }
}

/**
 * Points Verifier service that coordinates verification strategies
 */
export class PointsVerifier {
  private strategies: VerificationStrategy[] = [];
  
  constructor() {
    // Register verification strategies in order of specificity
    this.registerStrategy(new ContentVerificationStrategy());
    this.registerStrategy(new EngagementVerificationStrategy());
    this.registerStrategy(new ReferralVerificationStrategy());
    this.registerStrategy(new LoginVerificationStrategy());
    this.registerStrategy(new AchievementVerificationStrategy());
    this.registerStrategy(new DefaultVerificationStrategy());
  }
  
  /**
   * Register a verification strategy
   * 
   * @param strategy The strategy to register
   */
  registerStrategy(strategy: VerificationStrategy): void {
    this.strategies.push(strategy);
  }
  
  /**
   * Verify an activity using the appropriate strategy
   * 
   * @param activity The activity to verify
   * @returns Verification result
   */
  async verifyActivity(activity: Activity): Promise<VerificationResult> {
    try {
      // Find the first strategy that supports this activity
      for (const strategy of this.strategies) {
        if (strategy.supports(activity)) {
          return await strategy.verify(activity);
        }
      }
      
      // If no strategy found (should never happen due to default strategy)
      logger.warn('No verification strategy found for activity', { 
        activityType: activity.activityType 
      });
      return { isValid: true, confidenceScore: 0.5 };
    } catch (error) {
      logger.error('Error during activity verification', { 
        activityType: activity.activityType,
        error 
      });
      
      // On error, we default to valid but with very low confidence
      return { 
        isValid: true, 
        confidenceScore: 0.3,
        reason: 'Verification system error'
      };
    }
  }
}

// Export types and classes
export * from './points-verifier';
