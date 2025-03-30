import { Activity, VerificationResult, VerificationStrategy } from '../points-verifier';
import { logger } from '../../../../lib/logger'; // Adjust path as needed

/**
 * Default verification strategy (fallback)
 */
export class DefaultVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    // This strategy supports any activity not handled by more specific strategies
    return true;
  }

  async verify(activity: Activity): Promise<VerificationResult> {
    logger.debug('Applying default verification strategy', { activity });
    try {
      // For other activity types (e.g., admin_award, milestone, profile_completion),
      // we generally assume validity but with lower confidence unless specific checks are needed.
      // These might be awarded directly by the system or admins.

      // Example: Check if admin_award has a valid admin user ID in metadata
      if (activity.activityType === 'admin_award') {
        if (!activity.metadata?.adminUserId) {
          logger.warn('Default verification: Admin award missing admin user ID', { userId: activity.userId });
          // Still consider it valid, but lower confidence significantly
          return { isValid: true, confidenceScore: 0.5, reason: 'Admin award missing admin reference' };
        }
      }

      // Add checks for other specific types handled by default if necessary

      logger.debug('Default verification successful', { userId: activity.userId, activityType: activity.activityType });
      return {
        isValid: true,
        confidenceScore: 0.7 // Moderate confidence for unverified types
      };
    } catch (error) {
        logger.error('Error during default verification', { activity, error });
        return {
            isValid: true, // Fail open on error, but low confidence
            confidenceScore: 0.3,
            reason: 'Default verification system error'
        };
    }
  }
}
