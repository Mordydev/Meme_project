import { Activity, VerificationResult, VerificationStrategy } from '../points-verifier';
import { logger } from '../../../../lib/logger'; // Adjust path as needed

/**
 * Content verification strategy
 */
export class ContentVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    return activity.activityType === 'content_creation';
  }

  async verify(activity: Activity): Promise<VerificationResult> {
    logger.debug('Verifying content creation activity', { activity });
    try {
      // Basic content length check
      const contentLength = activity.metadata?.contentLength || 0;
      if (contentLength < 10) {
        logger.warn('Content verification failed: Content too short', { userId: activity.userId, length: contentLength });
        return {
          isValid: false,
          confidenceScore: 1.0,
          reason: 'Content too short'
        };
      }

      // TODO: Implement duplicated content check (requires repository access or dedicated service)
      // const isDuplicate = await contentRepository.checkForDuplicate(activity.userId, activity.metadata?.contentHash);
      // if (isDuplicate) {
      //   return { isValid: false, confidenceScore: 0.9, reason: 'Duplicate content detected' };
      // }

      // Calculate quality score based on content length and complexity
      let qualityScore = 1.0;

      // Longer content gets a bonus
      if (contentLength > 200) qualityScore += 0.2;
      if (contentLength > 500) qualityScore += 0.2;

      // Media content gets a bonus
      const hasMedia = activity.metadata?.hasMedia || false;
      if (hasMedia) qualityScore += 0.1;

      // Clamp quality score (e.g., max 1.5x bonus)
      qualityScore = Math.min(qualityScore, 1.5);

      logger.debug('Content verification successful', { userId: activity.userId, qualityScore });
      return {
        isValid: true,
        confidenceScore: 0.9, // Base confidence for passing basic checks
        qualityScore
      };
    } catch (error) {
        logger.error('Error during content verification', { activity, error });
        return {
            isValid: true, // Fail open on error, but low confidence
            confidenceScore: 0.3,
            reason: 'Content verification system error'
        };
    }
  }
}
