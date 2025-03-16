/**
 * Onboarding Service
 * 
 * Manages user onboarding flows and progress tracking
 */
import { db } from '../../lib/db';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import { 
  OnboardingStepType, 
  REQUIRED_ONBOARDING_STEPS,
  getStepByType,
  getPointsFromCompletedSteps
} from './steps';
import { auditService } from '../audit/service';
import { AuditEventType } from '../audit/events';

/**
 * Onboarding progress interface
 */
export interface OnboardingProgress {
  userId: string;
  completedSteps: OnboardingStepType[];
  currentStep: OnboardingStepType;
  isComplete: boolean;
  lastUpdated: Date;
}

/**
 * Redis key prefix for onboarding progress
 */
const ONBOARDING_PROGRESS_PREFIX = 'onboarding:progress:';

/**
 * Redis TTL for onboarding progress (30 days)
 */
const ONBOARDING_PROGRESS_TTL = 60 * 60 * 24 * 30;

/**
 * Onboarding Service class
 */
export class OnboardingService {
  /**
   * Initialize onboarding for a new user
   * 
   * @param userId User ID
   * @returns Onboarding progress
   */
  async initializeOnboarding(userId: string): Promise<OnboardingProgress> {
    try {
      // Get existing progress first
      const existingProgress = await this.getProgress(userId);
      
      if (existingProgress) {
        // Onboarding already initialized
        return existingProgress;
      }
      
      // Create new onboarding progress
      const progress: OnboardingProgress = {
        userId,
        completedSteps: [],
        currentStep: OnboardingStepType.PROFILE_CREATION, // First step
        isComplete: false,
        lastUpdated: new Date()
      };
      
      // Save progress
      await this.saveProgress(progress);
      
      // Log audit event
      await auditService.logEvent({
        type: AuditEventType.USER_REGISTERED,
        userId,
        metadata: {
          action: 'onboarding_initialized'
        }
      });
      
      return progress;
    } catch (error) {
      logger.error('Error initializing onboarding', { error, userId });
      throw error;
    }
  }
  
  /**
   * Get onboarding progress for a user
   * 
   * @param userId User ID
   * @returns Onboarding progress or null if not found
   */
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      // Check Redis first for faster access
      const cacheKey = `${ONBOARDING_PROGRESS_PREFIX}${userId}`;
      const cachedProgress = await redis.get(cacheKey);
      
      if (cachedProgress) {
        return JSON.parse(cachedProgress) as OnboardingProgress;
      }
      
      // Fallback to database
      const result = await db.query<OnboardingProgress>(
        `SELECT * FROM user_onboarding WHERE user_id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const progress = result.rows[0];
      
      // Cache for future access
      await redis.setex(
        cacheKey,
        ONBOARDING_PROGRESS_TTL,
        JSON.stringify(progress)
      );
      
      return progress;
    } catch (error) {
      logger.error('Error getting onboarding progress', { error, userId });
      return null;
    }
  }
  
  /**
   * Save onboarding progress
   * 
   * @param progress Onboarding progress to save
   * @returns Whether the save was successful
   */
  private async saveProgress(progress: OnboardingProgress): Promise<boolean> {
    try {
      // Update database
      await db.query(
        `INSERT INTO user_onboarding
         (user_id, completed_steps, current_step, is_complete, last_updated)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id)
         DO UPDATE SET
           completed_steps = $2,
           current_step = $3,
           is_complete = $4,
           last_updated = $5`,
        [
          progress.userId,
          JSON.stringify(progress.completedSteps),
          progress.currentStep,
          progress.isComplete,
          progress.lastUpdated
        ]
      );
      
      // Update cache
      const cacheKey = `${ONBOARDING_PROGRESS_PREFIX}${progress.userId}`;
      await redis.setex(
        cacheKey,
        ONBOARDING_PROGRESS_TTL,
        JSON.stringify(progress)
      );
      
      return true;
    } catch (error) {
      logger.error('Error saving onboarding progress', { error, progress });
      return false;
    }
  }
  
  /**
   * Complete an onboarding step
   * 
   * @param userId User ID
   * @param stepType Step type to complete
   * @returns Updated onboarding progress
   */
  async completeStep(
    userId: string,
    stepType: OnboardingStepType
  ): Promise<OnboardingProgress> {
    try {
      // Get current progress
      let progress = await this.getProgress(userId);
      
      // Initialize if not found
      if (!progress) {
        progress = await this.initializeOnboarding(userId);
      }
      
      // Check if step is already completed
      if (progress.completedSteps.includes(stepType)) {
        return progress;
      }
      
      // Update completed steps
      const completedSteps = [...progress.completedSteps, stepType];
      
      // Check if all required steps are completed
      const allRequiredStepsCompleted = REQUIRED_ONBOARDING_STEPS.every(step => 
        completedSteps.includes(step)
      );
      
      // Calculate next step
      // If current step was completed, move to the next uncompleted step
      let nextStep = progress.currentStep;
      
      if (stepType === progress.currentStep) {
        // Find the next uncompleted step
        const remainingSteps = Object.values(OnboardingStepType)
          .filter(step => !completedSteps.includes(step))
          .sort((a, b) => {
            const stepA = getStepByType(a);
            const stepB = getStepByType(b);
            return (stepA?.displayOrder || 0) - (stepB?.displayOrder || 0);
          });
        
        nextStep = remainingSteps.length > 0 ? remainingSteps[0] : progress.currentStep;
      }
      
      // Update progress
      const updatedProgress: OnboardingProgress = {
        ...progress,
        completedSteps,
        currentStep: nextStep,
        isComplete: allRequiredStepsCompleted,
        lastUpdated: new Date()
      };
      
      // Save updated progress
      await this.saveProgress(updatedProgress);
      
      // Log audit event
      await auditService.logEvent({
        type: AuditEventType.USER_PROFILE_UPDATED,
        userId,
        metadata: {
          action: 'onboarding_step_completed',
          step: stepType,
          onboardingComplete: allRequiredStepsCompleted
        }
      });
      
      // Award points for step completion
      await this.awardPointsForStep(userId, stepType);
      
      return updatedProgress;
    } catch (error) {
      logger.error('Error completing onboarding step', { error, userId, stepType });
      throw error;
    }
  }
  
  /**
   * Award points for completing an onboarding step
   * 
   * @param userId User ID
   * @param stepType Step type completed
   * @returns Whether points were awarded
   */
  private async awardPointsForStep(
    userId: string,
    stepType: OnboardingStepType
  ): Promise<boolean> {
    try {
      const step = getStepByType(stepType);
      
      if (!step) {
        return false;
      }
      
      // TODO: Integrate with points service
      // For now, just log the points that would be awarded
      logger.info('Onboarding points awarded', {
        userId,
        stepType,
        points: step.reward
      });
      
      return true;
    } catch (error) {
      logger.error('Error awarding points for onboarding step', { error, userId, stepType });
      return false;
    }
  }
  
  /**
   * Reset onboarding for a user
   * 
   * @param userId User ID
   * @returns Whether the reset was successful
   */
  async resetOnboarding(userId: string): Promise<OnboardingProgress> {
    try {
      // Get current progress to check completed steps
      const currentProgress = await this.getProgress(userId);
      
      // Create new progress
      const progress: OnboardingProgress = {
        userId,
        completedSteps: [],
        currentStep: OnboardingStepType.PROFILE_CREATION,
        isComplete: false,
        lastUpdated: new Date()
      };
      
      // Save reset progress
      await this.saveProgress(progress);
      
      // Log audit event
      await auditService.logEvent({
        type: AuditEventType.USER_PROFILE_UPDATED,
        userId,
        metadata: {
          action: 'onboarding_reset',
          previousCompletedSteps: currentProgress?.completedSteps || []
        }
      });
      
      return progress;
    } catch (error) {
      logger.error('Error resetting onboarding', { error, userId });
      throw error;
    }
  }
  
  /**
   * Check if a user has completed onboarding
   * 
   * @param userId User ID
   * @returns Whether onboarding is complete
   */
  async isOnboardingComplete(userId: string): Promise<boolean> {
    try {
      const progress = await this.getProgress(userId);
      
      if (!progress) {
        return false;
      }
      
      return progress.isComplete;
    } catch (error) {
      logger.error('Error checking onboarding completion', { error, userId });
      return false;
    }
  }
  
  /**
   * Check if a user has completed a specific step
   * 
   * @param userId User ID
   * @param stepType Step type to check
   * @returns Whether the step is completed
   */
  async isStepCompleted(userId: string, stepType: OnboardingStepType): Promise<boolean> {
    try {
      const progress = await this.getProgress(userId);
      
      if (!progress) {
        return false;
      }
      
      return progress.completedSteps.includes(stepType);
    } catch (error) {
      logger.error('Error checking step completion', { error, userId, stepType });
      return false;
    }
  }
  
  /**
   * Calculate onboarding completion percentage
   * 
   * @param userId User ID
   * @returns Completion percentage (0-100)
   */
  async getCompletionPercentage(userId: string): Promise<number> {
    try {
      const progress = await this.getProgress(userId);
      
      if (!progress) {
        return 0;
      }
      
      // Calculate based on required steps
      const completedRequiredSteps = REQUIRED_ONBOARDING_STEPS.filter(step => 
        progress.completedSteps.includes(step)
      );
      
      return Math.round(
        (completedRequiredSteps.length / REQUIRED_ONBOARDING_STEPS.length) * 100
      );
    } catch (error) {
      logger.error('Error calculating onboarding completion percentage', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get total points earned from onboarding
   * 
   * @param userId User ID
   * @returns Total points earned
   */
  async getEarnedPoints(userId: string): Promise<number> {
    try {
      const progress = await this.getProgress(userId);
      
      if (!progress) {
        return 0;
      }
      
      return getPointsFromCompletedSteps(progress.completedSteps);
    } catch (error) {
      logger.error('Error getting onboarding earned points', { error, userId });
      return 0;
    }
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService();
