/**
 * Referral Services Index
 * 
 * Exports all referral-related services
 */
import { Pool } from 'pg';
import { PointsService } from '../points/points-service';
import { UserRepository } from '../../repositories/user-repository';
import { ReferralCodeRepository } from '../../repositories/referral-code-repository';
import { ReferralTrackingRepository } from '../../repositories/referral-tracking-repository';
import { ReferralRewardRepository } from '../../repositories/referral-reward-repository';
import { ReferralCampaignRepository } from '../../repositories/referral-campaign-repository';
import { ReferralService } from './referral-service';
import { ReferralVerificationService } from './verification-service';
import { ReferralCampaignService } from './campaign-service';

/**
 * Factory function to create all referral services
 */
export function createReferralServices(
  db: Pool,
  pointsService: PointsService
) {
  // Create repositories
  const referralCodeRepository = new ReferralCodeRepository(db);
  const referralTrackingRepository = new ReferralTrackingRepository(db);
  const referralRewardRepository = new ReferralRewardRepository(db);
  const referralCampaignRepository = new ReferralCampaignRepository(db);
  const userRepository = new UserRepository({ db });
  
  // Create core referral service
  const referralService = new ReferralService(
    db,
    pointsService,
    referralCodeRepository,
    referralTrackingRepository,
    referralRewardRepository
  );
  
  // Create verification service
  const verificationService = new ReferralVerificationService(
    db,
    referralTrackingRepository,
    userRepository
  );
  
  // Create campaign service
  const campaignService = new ReferralCampaignService(
    db,
    referralCampaignRepository,
    referralCodeRepository,
    referralTrackingRepository,
    referralRewardRepository,
    referralService
  );
  
  return {
    referralService,
    verificationService,
    campaignService,
    referralCodeRepository,
    referralTrackingRepository,
    referralRewardRepository,
    referralCampaignRepository
  };
}

// Export individual services
export { ReferralService } from './referral-service';
export { ReferralVerificationService } from './verification-service';
export { ReferralCampaignService } from './campaign-service';

// Export types
export type { 
  ReferralCodeOptions,
  ReferralStats,
  ReferralAttributionResult,
  ReferralNetwork,
  ReferralNode,
  ReferralServiceConfig
} from './referral-service';

export type {
  VerificationSignal,
  VerificationResult,
  ReviewDecision,
  ReferralVerificationConfig
} from './verification-service';

export type {
  CampaignRewardConfig,
  CampaignServiceConfig
} from './campaign-service';
