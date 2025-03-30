import { Activity, VerificationResult, VerificationStrategy } from '../points-verifier';
import { logger } from '../../../../lib/logger'; // Adjust path as needed

/**
 * Engagement verification strategy (for comments, reactions)
 */
export class EngagementVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    return activity.activityType === 'comment' ||
           activity.activityType === 'reaction_received';
  }

  async verify(activity: Activity): Promise<VerificationResult> {
    logger.debug('Verifying engagement activity', { activity });
    try {
      // For comments, check content
      if (activity.activityType === 'comment') {
        const commentLength = activity.metadata?.contentLength || 0;

        // Super short comments may be spam
        if (commentLength < 5) {
          logger.warn('Engagement verification failed: Comment too short', { userId: activity.userId, length: commentLength });
          return {
            isValid: false,
            confidenceScore: 0.8,
            reason: 'Comment too short'
          };
        }

        // TODO: Implement checks for repetitive/spam comments from the same user

        // Quality bonus for thoughtful comments
        let qualityScore = 1.0;
        if (commentLength > 50) qualityScore += 0.2;
        if (commentLength > 100) qualityScore += 0.1;
        qualityScore = Math.min(qualityScore, 1.3); // Max 1.3x bonus for comments

        logger.debug('Comment verification successful', { userId: activity.userId, qualityScore });
        return {
          isValid: true,
          confidenceScore: 0.9,
          qualityScore
        };
      }

      // For reactions, just verify the reference exists
      if (activity.activityType === 'reaction_received') {
        if (!activity.referenceId) {
          logger.warn('Engagement verification failed: Missing reference content for reaction', { userId: activity.userId });
          return {
            isValid: false,
            confidenceScore: 1.0,
            reason: 'Missing reference content'
          };
        }

        // TODO: Implement checks for reaction velocity (preventing spam reactions)

        logger.debug('Reaction verification successful', { userId: activity.userId, referenceId: activity.referenceId });
        return {
          isValid: true,
          confidenceScore: 1.0 // High confidence if reference exists
        };
      }

      // Default fallback (should not be reached if supports() is correct)
      logger.warn('Engagement strategy called for unsupported type', { activityType: activity.activityType });
      return { isValid: true, confidenceScore: 0.7 };

    } catch (error) {
        logger.error('Error during engagement verification', { activity, error });
        return {
            isValid: true, // Fail open on error, but low confidence
            confidenceScore: 0.3,
            reason: 'Engagement verification system error'
        };
    }
  }
}
