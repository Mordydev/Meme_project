import { Activity, VerificationResult, VerificationStrategy } from '../points-verifier';
import { logger } from '../../../../lib/logger'; // Adjust path as needed
// TODO: Import AchievementRepository or relevant service to check achievement validity

/**
 * Achievement verification strategy
 */
export class AchievementVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    return activity.activityType === 'achievement';
  }

  async verify(activity: Activity): Promise<VerificationResult> {
    logger.debug('Verifying achievement activity', { activity });
    try {
      // Achievement verification should primarily ensure the achievement ID is valid
      // and that the points awarded match the achievement's definition.
      // The core logic of *earning* the achievement should reside in the AchievementService.

      if (!activity.referenceId) {
        logger.warn('Achievement verification failed: Missing achievement ID', { userId: activity.userId });
        return {
          isValid: false,
          confidenceScore: 1.0,
          reason: 'Missing achievement ID reference'
        };
      }

      // TODO: Verify the achievement ID exists and is valid (requires AchievementRepository/Service)
      // const achievementDefinition = await achievementRepository.findById(activity.referenceId);
      // if (!achievementDefinition) {
      //     return { isValid: false, confidenceScore: 1.0, reason: `Achievement ID ${activity.referenceId} not found` };
      // }

      // TODO: Verify the points amount matches the achievement's defined reward
      // const expectedPoints = achievementDefinition.pointsReward;
      // if (activity.amount !== expectedPoints) {
      //     logger.warn('Achievement points mismatch', { userId: activity.userId, achievementId: activity.referenceId, expected: expectedPoints, actual: activity.amount });
      //     // Decide whether to invalidate or just adjust points (adjusting might be better)
      //     // For now, invalidate for simplicity
      //     return { isValid: false, confidenceScore: 0.9, reason: 'Points awarded do not match achievement definition' };
      // }

      logger.debug('Achievement verification successful', { userId: activity.userId, achievementId: activity.referenceId });
      return {
        isValid: true,
        confidenceScore: 0.95 // High confidence if basic checks pass
      };
    } catch (error) {
        logger.error('Error during achievement verification', { activity, error });
        return {
            isValid: true, // Fail open on error, but low confidence
            confidenceScore: 0.3,
            reason: 'Achievement verification system error'
        };
    }
  }
}
