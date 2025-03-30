/**
 * Points Verifier
 * 
 * Verifies the validity of point-earning activities to prevent gaming the system.
 * Uses a strategy pattern to apply different verification rules based on activity type.
 */
import { logger } from '../../../lib/logger';
import { ContentVerificationStrategy } from './strategies/content-strategy';
import { EngagementVerificationStrategy } from './strategies/engagement-strategy';
import { ReferralVerificationStrategy } from './strategies/referral-strategy';
import { LoginVerificationStrategy } from './strategies/login-strategy';
import { AchievementVerificationStrategy } from './strategies/achievement-strategy';
import { DefaultVerificationStrategy } from './strategies/default-strategy';
import { StreakVerificationStrategy } from './strategies/streak-strategy'; // Import placeholder

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
} // Added missing closing brace

// Removed inline strategy class definitions

/**
 * Points Verifier service that coordinates verification strategies
 */
export class PointsVerifier {
  private strategies: VerificationStrategy[] = [];
  
  constructor() {
    // Register verification strategies (imported) in order of specificity
    this.registerStrategy(new ContentVerificationStrategy());
    this.registerStrategy(new EngagementVerificationStrategy());
    this.registerStrategy(new ReferralVerificationStrategy());
    this.registerStrategy(new LoginVerificationStrategy());
    // this.registerStrategy(new StreakVerificationStrategy()); // Register if/when implemented fully
    this.registerStrategy(new AchievementVerificationStrategy());
    // Default strategy must be last
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
