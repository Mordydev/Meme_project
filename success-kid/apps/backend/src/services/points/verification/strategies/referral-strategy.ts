import { Activity, VerificationResult, VerificationStrategy } from '../points-verifier';
import { logger } from '../../../../lib/logger'; // Adjust path as needed
// TODO: Import UserRepository or relevant service to check user status

/**
 * Referral verification strategy
 */
export class ReferralVerificationStrategy implements VerificationStrategy {
  supports(activity: Activity): boolean {
    return activity.activityType === 'referral' ||
           activity.activityType === 'referral_conversion';
  }

  async verify(activity: Activity): Promise<VerificationResult> {
    logger.debug('Verifying referral activity', { activity });
    try {
      // Verify referral has a valid reference (referred user ID)
      if (!activity.referenceId) {
        logger.warn('Referral verification failed: Missing referred user ID', { userId: activity.userId });
        return {
          isValid: false,
          confidenceScore: 1.0,
          reason: 'Missing referred user ID'
        };
      }

      // Check for self-referrals
      if (activity.userId === activity.referenceId) {
          logger.warn('Referral verification failed: Self-referral attempt', { userId: activity.userId });
          return {
              isValid: false,
              confidenceScore: 1.0,
              reason: 'Self-referral not allowed'
          };
      }

      // TODO: Implement checks for referral farm detection (many referrals from same IP/device)
      // const ipAddress = activity.metadata?.ipAddress;
      // const deviceId = activity.metadata?.deviceId;
      // if (ipAddress || deviceId) {
      //    const recentReferrals = await referralRepository.getRecentReferralsByIpOrDevice(ipAddress, deviceId, '1 hour');
      //    if (recentReferrals.length > 5) { // Example threshold
      //        return { isValid: false, confidenceScore: 0.9, reason: 'Potential referral farm detected' };
      //    }
      // }

      // TODO: Check if the referred user account is valid/active (requires UserRepository/Service)
      // const referredUser = await userRepository.findById(activity.referenceId);
      // if (!referredUser || referredUser.status !== 'active') {
      //     return { isValid: false, confidenceScore: 0.95, reason: 'Referred user account is invalid or inactive' };
      // }

      // For referral_conversion, check if the referred user completed necessary steps
      if (activity.activityType === 'referral_conversion') {
          // TODO: Check if the referred user actually completed onboarding steps
          // const onboardingComplete = await userRepository.hasCompletedOnboarding(activity.referenceId);
          // if (!onboardingComplete) {
          //     return { isValid: false, confidenceScore: 0.9, reason: 'Referred user did not complete onboarding' };
          // }
          logger.debug('Referral conversion verification placeholder passed', { userId: activity.userId, referredUserId: activity.referenceId });
      }

      logger.debug('Referral verification successful', { userId: activity.userId, referredUserId: activity.referenceId });
      return {
        isValid: true,
        confidenceScore: 0.9 // Base confidence, can be lowered if checks fail
      };
    } catch (error) {
        logger.error('Error during referral verification', { activity, error });
        return {
            isValid: true, // Fail open on error, but low confidence
            confidenceScore: 0.3,
            reason: 'Referral verification system error'
        };
    }
  }
}
