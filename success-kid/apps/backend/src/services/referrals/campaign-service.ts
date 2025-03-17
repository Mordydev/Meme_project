/**
 * Referral Campaign Service
 * 
 * Handles management of time-limited referral campaigns with special rewards
 */
import { Pool } from 'pg';
import { ReferralCampaignRepository } from '../../repositories/referral-campaign-repository';
import { ReferralCodeRepository } from '../../repositories/referral-code-repository';
import { ReferralTrackingRepository } from '../../repositories/referral-tracking-repository';
import { ReferralRewardRepository } from '../../repositories/referral-reward-repository';
import { CreateCampaignDto, UpdateCampaignDto, CampaignStatus, CampaignPerformance } from '../../models/referral-campaign';
import { ReferralService } from './referral-service';
import { logger } from '../../lib/logger';
import { ValidationError, NotFoundError, ConflictError } from '../../lib/errors';

export interface CampaignRewardConfig {
  defaultMultiplier: number;
  maxMultiplier: number;
  minMultiplier: number;
}

export interface CampaignServiceConfig {
  maxActiveCampaigns?: number;
  minCampaignDuration?: number; // in hours
  maxCampaignDuration?: number; // in hours
  rewardConfig?: CampaignRewardConfig;
}

export class ReferralCampaignService {
  private config: CampaignServiceConfig;
  
  // Default configuration
  private defaultConfig: CampaignServiceConfig = {
    maxActiveCampaigns: 3,
    minCampaignDuration: 24, // 1 day
    maxCampaignDuration: 720, // 30 days
    rewardConfig: {
      defaultMultiplier: 2,
      maxMultiplier: 5,
      minMultiplier: 1.2
    }
  };
  
  constructor(
    private db: Pool,
    private campaignRepository: ReferralCampaignRepository,
    private referralCodeRepository: ReferralCodeRepository,
    private referralTrackingRepository: ReferralTrackingRepository,
    private referralRewardRepository: ReferralRewardRepository,
    private referralService: ReferralService,
    config?: Partial<CampaignServiceConfig>
  ) {
    this.config = { ...this.defaultConfig, ...config };
  }
  
  /**
   * Create a new referral campaign
   */
  async createCampaign(campaignData: CreateCampaignDto): Promise<any> {
    try {
      // Validate campaign constraints
      await this.validateCampaignConstraints(campaignData);
      
      // Create the campaign
      const campaign = await this.campaignRepository.createCampaign(campaignData);
      
      // If campaign has a special code, generate it
      if (campaign.special_code) {
        // Check if code is unique
        const isUnique = await this.referralCodeRepository.isCodeUnique(campaign.special_code);
        if (!isUnique) {
          // Update campaign to remove special code
          await this.campaignRepository.update(campaign.id, {
            special_code: null
          });
          
          logger.warn('Campaign special code already exists, removed from campaign', {
            campaignId: campaign.id,
            code: campaign.special_code
          });
        }
      }
      
      return campaign;
    } catch (error) {
      logger.error('Error creating campaign', { error, campaignData });
      throw error;
    }
  }
  
  /**
   * Update an existing campaign
   */
  async updateCampaign(
    campaignId: string, 
    updateData: UpdateCampaignDto
  ): Promise<any> {
    try {
      // Get existing campaign
      const existingCampaign = await this.campaignRepository.findById(campaignId);
      if (!existingCampaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Prevent updates to active/completed campaigns
      if (existingCampaign.status !== 'draft' && 
          (updateData.name || updateData.start_date || updateData.end_date || 
           updateData.reward_multiplier || updateData.special_code)) {
        throw new ValidationError('Cannot update core details of an active or completed campaign');
      }
      
      // If updating special code, check uniqueness
      if (updateData.special_code && 
          updateData.special_code !== existingCampaign.special_code) {
        const isUnique = await this.referralCodeRepository.isCodeUnique(updateData.special_code);
        if (!isUnique) {
          throw new ValidationError('Special code is already in use');
        }
      }
      
      // If updating dates, validate constraints
      if (updateData.start_date || updateData.end_date) {
        const startDate = updateData.start_date || existingCampaign.start_date;
        const endDate = updateData.end_date || existingCampaign.end_date;
        
        await this.validateCampaignDates(startDate, endDate, campaignId);
      }
      
      // Update the campaign
      return await this.campaignRepository.update(campaignId, updateData);
    } catch (error) {
      logger.error('Error updating campaign', { error, campaignId, updateData });
      throw error;
    }
  }
  
  /**
   * Validate campaign constraints before creation/update
   */
  private async validateCampaignConstraints(
    campaignData: CreateCampaignDto | UpdateCampaignDto,
    campaignId?: string
  ): Promise<void> {
    // Validate campaign dates
    if ('start_date' in campaignData && 'end_date' in campaignData) {
      await this.validateCampaignDates(
        campaignData.start_date, 
        campaignData.end_date,
        campaignId
      );
    }
    
    // Validate reward multiplier
    if ('reward_multiplier' in campaignData) {
      this.validateRewardMultiplier(campaignData.reward_multiplier);
    }
    
    // Check active campaign limit
    if ('status' in campaignData && campaignData.status === 'active') {
      await this.checkActiveCampaignLimit(campaignId);
    }
  }
  
  /**
   * Validate campaign dates
   */
  private async validateCampaignDates(
    startDate: Date, 
    endDate: Date, 
    campaignId?: string
  ): Promise<void> {
    // Start date must be in the future
    const now = new Date();
    if (startDate < now) {
      throw new ValidationError('Campaign start date must be in the future');
    }
    
    // End date must be after start date
    if (endDate <= startDate) {
      throw new ValidationError('Campaign end date must be after start date');
    }
    
    // Campaign duration must be within limits
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    
    if (durationHours < this.config.minCampaignDuration!) {
      throw new ValidationError(`Campaign must be at least ${this.config.minCampaignDuration} hours long`);
    }
    
    if (durationHours > this.config.maxCampaignDuration!) {
      throw new ValidationError(`Campaign cannot be longer than ${this.config.maxCampaignDuration} hours`);
    }
    
    // Check for date overlap with existing campaigns
    const hasOverlap = await this.campaignRepository.checkDateOverlap(
      startDate, 
      endDate,
      campaignId
    );
    
    if (hasOverlap) {
      throw new ValidationError('Campaign dates overlap with an existing campaign');
    }
  }
  
  /**
   * Validate reward multiplier
   */
  private validateRewardMultiplier(multiplier: number): void {
    const { minMultiplier, maxMultiplier } = this.config.rewardConfig!;
    
    if (multiplier < minMultiplier || multiplier > maxMultiplier) {
      throw new ValidationError(`Reward multiplier must be between ${minMultiplier} and ${maxMultiplier}`);
    }
  }
  
  /**
   * Check if active campaign limit is reached
   */
  private async checkActiveCampaignLimit(excludeCampaignId?: string): Promise<void> {
    // Count active campaigns
    const activeQuery = `
      SELECT COUNT(*) as count
      FROM referral_campaigns
      WHERE status = 'active'
      ${excludeCampaignId ? ' AND id != $1' : ''}
    `;
    
    const params = excludeCampaignId ? [excludeCampaignId] : [];
    const result = await this.db.query<{ count: string }>(activeQuery, params);
    
    const activeCount = parseInt(result.rows[0]?.count || '0', 10);
    
    if (activeCount >= this.config.maxActiveCampaigns!) {
      throw new ValidationError(`Maximum of ${this.config.maxActiveCampaigns} active campaigns allowed`);
    }
  }
  
  /**
   * Activate a campaign
   */
  async activateCampaign(campaignId: string): Promise<any> {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Check if campaign can be activated
      if (campaign.status !== 'draft') {
        throw new ValidationError(`Cannot activate campaign with status: ${campaign.status}`);
      }
      
      // Validate campaign dates
      const now = new Date();
      if (campaign.start_date < now) {
        throw new ValidationError('Cannot activate campaign with past start date');
      }
      
      // Check active campaign limit
      await this.checkActiveCampaignLimit(campaignId);
      
      // Update campaign status
      return await this.campaignRepository.updateStatus(campaignId, 'active');
    } catch (error) {
      logger.error('Error activating campaign', { error, campaignId });
      throw error;
    }
  }
  
  /**
   * Cancel a campaign
   */
  async cancelCampaign(campaignId: string): Promise<any> {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Check if campaign can be cancelled
      if (campaign.status === 'completed') {
        throw new ValidationError('Cannot cancel a completed campaign');
      }
      
      // Update campaign status
      return await this.campaignRepository.updateStatus(campaignId, 'cancelled');
    } catch (error) {
      logger.error('Error cancelling campaign', { error, campaignId });
      throw error;
    }
  }
  
  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<any[]> {
    try {
      return await this.campaignRepository.findActiveCampaigns();
    } catch (error) {
      logger.error('Error getting active campaigns', { error });
      throw error;
    }
  }
  
  /**
   * Get campaigns by status
   */
  async getCampaignsByStatus(
    status: CampaignStatus | CampaignStatus[],
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    data: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    try {
      const result = await this.campaignRepository.findByStatus(status, options);
      
      return {
        data: result.data,
        pagination: {
          total: result.total,
          limit: options.limit || 20,
          offset: options.offset || 0,
          hasMore: result.total > (options.offset || 0) + (options.limit || 20)
        }
      };
    } catch (error) {
      logger.error('Error getting campaigns by status', { error, status });
      throw error;
    }
  }
  
  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(campaignId: string): Promise<CampaignPerformance> {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Get performance metrics
      const metrics = await this.campaignRepository.getCampaignPerformance(campaignId);
      
      // Calculate cost per acquisition
      const cpa = metrics.signups > 0 
        ? metrics.totalPointsAwarded / metrics.signups 
        : 0;
      
      return {
        campaignId,
        name: campaign.name,
        totalVisits: metrics.totalVisits,
        uniqueVisitors: metrics.uniqueVisitors,
        signups: metrics.signups,
        conversionRate: metrics.conversionRate,
        totalRewards: metrics.totalRewards,
        totalPointsAwarded: metrics.totalPointsAwarded,
        costPerAcquisition: cpa
      };
    } catch (error) {
      logger.error('Error getting campaign performance', { error, campaignId });
      throw error;
    }
  }
  
  /**
   * Generate a campaign-specific referral code for a user
   */
  async generateCampaignCode(
    userId: string, 
    campaignId: string
  ): Promise<{
    code: string;
    url: string;
  }> {
    try {
      // Get campaign
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Check if campaign is active
      if (campaign.status !== 'active') {
        throw new ValidationError('Campaign is not active');
      }
      
      // Check if user already has a code for this campaign
      const existingCodes = await this.referralCodeRepository.findByCampaign(campaignId);
      const userCode = existingCodes.find(code => code.user_id === userId);
      
      if (userCode && userCode.status === 'active') {
        return {
          code: userCode.code,
          url: this.buildCampaignUrl(userCode.code, campaign)
        };
      }
      
      // Generate a campaign-prefixed code
      const prefix = campaign.name.substring(0, 3).toUpperCase();
      const newCode = await this.referralService.generateReferralCode({
        userId,
        prefix,
        type: 'campaign',
        campaignId,
        expiresAt: campaign.end_date
      });
      
      // Create code in database
      const codeRecord = await this.referralCodeRepository.createReferralCode({
        user_id: userId,
        code: newCode,
        type: 'campaign',
        status: 'active',
        expires_at: campaign.end_date,
        campaign_id: campaignId
      });
      
      return {
        code: codeRecord.code,
        url: this.buildCampaignUrl(codeRecord.code, campaign)
      };
    } catch (error) {
      logger.error('Error generating campaign code', { error, userId, campaignId });
      throw error;
    }
  }
  
  /**
   * Build a campaign-specific referral URL
   */
  private buildCampaignUrl(code: string, campaign: any): string {
    const baseUrl = process.env.FRONTEND_URL || 'https://successcommunity.app';
    return `${baseUrl}/join?ref=${code}&campaign=${campaign.id}`;
  }
  
  /**
   * Check if a referral is eligible for campaign rewards
   */
  async checkCampaignEligibility(
    referralId: string
  ): Promise<{
    eligible: boolean;
    campaign?: any;
    multiplier?: number;
  }> {
    try {
      // Get referral tracking
      const tracking = await this.referralTrackingRepository.findById(referralId);
      if (!tracking || !tracking.converted_user_id) {
        return { eligible: false };
      }
      
      // Check if referral code is associated with a campaign
      const code = await this.referralCodeRepository.findByCode(tracking.referral_code);
      if (!code || !code.campaign_id) {
        return { eligible: false };
      }
      
      // Get campaign
      const campaign = await this.campaignRepository.findById(code.campaign_id);
      if (!campaign || campaign.status !== 'active') {
        return { eligible: false };
      }
      
      // Check campaign date range
      const conversionDate = new Date(tracking.conversion_date);
      if (conversionDate < campaign.start_date || conversionDate > campaign.end_date) {
        return { eligible: false };
      }
      
      // Check max rewards if defined
      if (campaign.max_rewards) {
        // Count existing rewards for this campaign
        const rewardsQuery = `
          SELECT COUNT(*) as count
          FROM referral_rewards
          WHERE campaign_id = $1
        `;
        
        const rewardsResult = await this.db.query<{ count: string }>(
          rewardsQuery, 
          [campaign.id]
        );
        
        const rewardsCount = parseInt(rewardsResult.rows[0]?.count || '0', 10);
        
        if (rewardsCount >= campaign.max_rewards) {
          return { eligible: false };
        }
      }
      
      return {
        eligible: true,
        campaign,
        multiplier: campaign.reward_multiplier
      };
    } catch (error) {
      logger.error('Error checking campaign eligibility', { error, referralId });
      return { eligible: false };
    }
  }
  
  /**
   * Apply campaign reward to a referral
   */
  async applyCampaignReward(referralId: string): Promise<{
    applied: boolean;
    campaignId?: string;
    multiplier?: number;
    pointsAwarded?: number;
    reason?: string;
  }> {
    try {
      // Check eligibility
      const eligibility = await this.checkCampaignEligibility(referralId);
      if (!eligibility.eligible) {
        return { 
          applied: false, 
          reason: 'Not eligible for campaign rewards'
        };
      }
      
      // Get referral tracking
      const tracking = await this.referralTrackingRepository.findById(referralId);
      
      // Calculate campaign reward
      const baseReward = 500; // Standard signup reward
      const campaignReward = Math.round(baseReward * eligibility.multiplier!);
      const bonusAmount = campaignReward - baseReward;
      
      // Create campaign reward record
      const reward = await this.referralRewardRepository.createReward({
        referral_id: referralId,
        referrer_id: tracking.referrer_id,
        referee_id: tracking.converted_user_id,
        type: 'signup',
        points_amount: bonusAmount, // Only the bonus amount
        status: 'pending',
        campaign_id: eligibility.campaign.id
      });
      
      // Award bonus points to referrer
      const pointsResult = await this.db.query(
        'SELECT award_points($1, $2, $3, $4, $5) as success',
        [
          tracking.referrer_id,
          bonusAmount,
          'referral',
          reward.id,
          `Campaign bonus: ${eligibility.campaign.name}`
        ]
      );
      
      if (!pointsResult.rows[0]?.success) {
        // Update reward status to rejected if points award fails
        await this.referralRewardRepository.updateStatus(reward.id, 'rejected');
        
        return {
          applied: false,
          reason: 'Failed to award campaign bonus points'
        };
      }
      
      // Update reward status to processed
      await this.referralRewardRepository.updateStatus(reward.id, 'processed');
      
      return {
        applied: true,
        campaignId: eligibility.campaign.id,
        multiplier: eligibility.multiplier,
        pointsAwarded: bonusAmount
      };
    } catch (error) {
      logger.error('Error applying campaign reward', { error, referralId });
      return {
        applied: false,
        reason: 'Error processing campaign reward'
      };
    }
  }
}
