/**
 * Referral Campaign Service
 * 
 * Service for managing referral campaigns
 */
import { 
  ReferralCampaignRepository,
  ReferralRepository,
  CreateCampaignDto,
  UpdateCampaignDto
} from '../../repositories/referral';
import { ReferralCampaign } from '../../models/entities/referral.model';
import { EventBus } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { NotFoundError, ValidationError } from '../../errors';

/**
 * Campaign performance metrics
 */
export interface CampaignPerformance {
  totalReferrals: number;
  completedReferrals: number;
  conversionRate: number;
  totalRewards: number;
  active: boolean;
  daysRemaining: number | null;
  referralsRemaining: number | null;
}

/**
 * Service for referral campaign management
 */
export class ReferralCampaignService {
  /**
   * Create a new ReferralCampaignService instance
   */
  constructor(
    private campaignRepository: ReferralCampaignRepository,
    private referralRepository: ReferralRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Create a new referral campaign
   * 
   * @param data Campaign data
   * @returns Created campaign
   */
  async createCampaign(data: CreateCampaignDto): Promise<ReferralCampaign> {
    // Validate start and end dates
    if (data.end_date && data.start_date > data.end_date) {
      throw new ValidationError('End date must be after start date');
    }
    
    // Create the campaign
    const campaign = await this.campaignRepository.createCampaign(data);
    
    // Emit event
    await this.eventBus.publish('referral.campaign_created', {
      campaignId: campaign.id,
      name: campaign.name,
      startDate: campaign.start_date,
      endDate: campaign.end_date
    });
    
    logger.info(`Referral campaign created: ${campaign.name}`);
    
    return campaign;
  }

  /**
   * Update a referral campaign
   * 
   * @param id Campaign ID
   * @param data Update data
   * @returns Updated campaign
   */
  async updateCampaign(id: string, data: UpdateCampaignDto): Promise<ReferralCampaign> {
    // Get the current campaign
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign', id);
    }
    
    // Validate that start date isn't being changed for active campaigns
    if (data.is_active && !campaign.is_active) {
      // Emit activation event
      await this.eventBus.publish('referral.campaign_activated', {
        campaignId: id,
        name: campaign.name
      });
    } else if (data.is_active === false && campaign.is_active) {
      // Emit deactivation event
      await this.eventBus.publish('referral.campaign_deactivated', {
        campaignId: id,
        name: campaign.name
      });
    }
    
    // Update the campaign
    const updatedCampaign = await this.campaignRepository.updateCampaign(id, data);
    
    // Emit update event
    await this.eventBus.publish('referral.campaign_updated', {
      campaignId: id,
      name: updatedCampaign.name,
      changes: Object.keys(data)
    });
    
    logger.info(`Referral campaign updated: ${id}`);
    
    return updatedCampaign;
  }

  /**
   * Get active campaigns
   * 
   * @returns Array of active campaigns
   */
  async getActiveCampaigns(): Promise<ReferralCampaign[]> {
    return this.campaignRepository.findActiveCampaigns();
  }

  /**
   * Get campaign performance metrics
   * 
   * @param campaignId Campaign ID
   * @returns Campaign performance metrics
   */
  async getCampaignPerformance(campaignId: string): Promise<CampaignPerformance> {
    // Get the campaign
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new NotFoundError('Campaign', campaignId);
    }
    
    // Get performance metrics
    const performance = await this.campaignRepository.getCampaignPerformance(campaignId);
    
    // Calculate days remaining
    let daysRemaining: number | null = null;
    if (campaign.end_date) {
      const now = new Date();
      const endDate = new Date(campaign.end_date);
      
      if (endDate > now) {
        const diffTime = Math.abs(endDate.getTime() - now.getTime());
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        daysRemaining = 0;
      }
    }
    
    // Calculate referrals remaining
    let referralsRemaining: number | null = null;
    if (campaign.max_referrals !== null) {
      referralsRemaining = Math.max(0, campaign.max_referrals - performance.totalReferrals);
    }
    
    // Return enhanced performance metrics
    return {
      ...performance,
      active: campaign.is_active,
      daysRemaining,
      referralsRemaining
    };
  }

  /**
   * Apply campaign reward to a referral
   * 
   * @param referralId Referral ID
   * @returns Whether campaign reward was applied
   */
  async applyCampaignReward(referralId: string): Promise<{
    applied: boolean;
    campaignId?: string;
    rewardAmount?: number;
    reason?: string;
  }> {
    try {
      // Get the referral
      const referral = await this.referralRepository.findById(referralId);
      if (!referral) {
        return { applied: false, reason: 'referral_not_found' };
      }
      
      // If already has a campaign, skip
      if (referral.campaign_id) {
        return { applied: false, reason: 'already_has_campaign' };
      }
      
      // Find active campaigns
      const activeCampaigns = await this.campaignRepository.findActiveCampaigns(referral.created_at);
      if (activeCampaigns.length === 0) {
        return { applied: false, reason: 'no_active_campaigns' };
      }
      
      // Get the campaign with highest reward
      const campaign = activeCampaigns.sort((a, b) => b.reward_amount - a.reward_amount)[0];
      
      // Update the referral with the campaign
      await this.referralRepository.update(referralId, {
        campaign_id: campaign.id
      });
      
      // Emit event
      await this.eventBus.publish('referral.campaign_applied', {
        referralId,
        campaignId: campaign.id,
        referrerId: referral.referrer_id,
        rewardAmount: campaign.reward_amount
      });
      
      logger.info(`Campaign applied to referral: ${referralId} -> ${campaign.id}`);
      
      return {
        applied: true,
        campaignId: campaign.id,
        rewardAmount: campaign.reward_amount
      };
    } catch (error) {
      logger.error('Failed to apply campaign reward', { referralId, error });
      return { applied: false, reason: 'error' };
    }
  }

  /**
   * Check if a user is eligible for a campaign
   * 
   * @param userId User ID
   * @param campaignId Campaign ID
   * @returns Eligibility status and reason
   */
  async checkUserEligibility(userId: string, campaignId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    // Get the campaign
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign) {
      return { eligible: false, reason: 'campaign_not_found' };
    }
    
    // Check if campaign is active
    if (!campaign.is_active) {
      return { eligible: false, reason: 'campaign_not_active' };
    }
    
    // Check date range
    const now = new Date();
    if (now < campaign.start_date) {
      return { eligible: false, reason: 'campaign_not_started' };
    }
    
    if (campaign.end_date && now > campaign.end_date) {
      return { eligible: false, reason: 'campaign_ended' };
    }
    
    // Check campaign requirements (would be more sophisticated in a real implementation)
    if (campaign.requirements && Object.keys(campaign.requirements).length > 0) {
      // Example: check user account age
      if (campaign.requirements.min_account_age) {
        // Would check user creation date against requirement
        // For now, assume eligible
      }
      
      // Example: check minimum level
      if (campaign.requirements.min_level) {
        // Would check user level against requirement
        // For now, assume eligible
      }
    }
    
    // Check max referrals
    if (campaign.max_referrals !== null) {
      const campaignReferrals = await this.referralRepository.findByCampaignId(campaignId, 0, 0);
      if (campaignReferrals.length >= campaign.max_referrals) {
        return { eligible: false, reason: 'campaign_full' };
      }
    }
    
    return { eligible: true };
  }
}
