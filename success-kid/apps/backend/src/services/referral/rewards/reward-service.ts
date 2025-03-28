/**
 * Referral Reward Service
 * 
 * Service for managing and distributing rewards for successful referrals
 */
import { 
  ReferralRepository,
  ReferralCodeRepository
} from '../../../repositories/referral';
import { PointsService } from '../../points/points-service';
import { EventBus } from '../../../lib/event-bus';
import { logger } from '../../../lib/logger';
import { NotFoundError, ValidationError } from '../../../errors';
import { ReferralStatus } from '../../../models/entities/referral.model';
import { db } from '../../../database';

/**
 * Reward type for different milestones
 */
export type RewardType = 'signup' | 'engagement' | 'wallet_connection' | 'points_milestone';

/**
 * Reward condition for qualification
 */
export interface RewardCondition {
  type: string;
  value: any;
}

/**
 * Reward configuration for different types
 */
export interface RewardConfig {
  type: RewardType;
  pointsAmount: number;
  conditions?: RewardCondition[];
  description: string;
}

/**
 * Result of reward processing
 */
export interface RewardResult {
  success: boolean;
  rewardId?: string;
  alreadyProcessed?: boolean;
  conditionsNotMet?: boolean;
  error?: string;
}

/**
 * Reward summary for a user
 */
export interface RewardSummary {
  totalRewards: number;
  pendingRewards: number;
  processedRewards: number;
  totalPointsEarned: number;
  byType: Record<RewardType, {
    count: number;
    points: number;
  }>;
}

/**
 * Reward history entry
 */
export interface RewardHistory {
  id: string;
  referralId: string;
  referrerId: string;
  refereeId: string;
  type: RewardType;
  pointsAmount: number;
  createdAt: Date;
  status: 'pending' | 'processed' | 'failed';
  processedAt?: Date;
}

/**
 * Milestone check result
 */
export interface MilestoneCheck {
  milestone: string;
  eligible: boolean;
  processed: boolean;
  reason?: string;
}

/**
 * Service for managing referral rewards
 */
export class ReferralRewardService {
  // Reward configs for different reward types
  private rewardConfigs: Record<RewardType, RewardConfig> = {
    signup: {
      type: 'signup',
      pointsAmount: 500,
      description: 'Reward for referring a new user who completes signup'
    },
    engagement: {
      type: 'engagement',
      pointsAmount: 100,
      description: 'Reward for referred user engagement (posting content)'
    },
    wallet_connection: {
      type: 'wallet_connection',
      pointsAmount: 250,
      description: 'Reward for referred user connecting their wallet'
    },
    points_milestone: {
      type: 'points_milestone',
      pointsAmount: 100,
      conditions: [
        { type: 'points_threshold', value: 1000 }
      ],
      description: 'Reward for referred user reaching 1000 points'
    }
  };

  /**
   * Create a new ReferralRewardService instance
   */
  constructor(
    private referralRepository: ReferralRepository,
    private referralCodeRepository: ReferralCodeRepository,
    private pointsService: PointsService,
    private eventBus: EventBus
  ) {}

  /**
   * Process a referral reward
   * 
   * @param referralId Referral ID
   * @param type Reward type
   * @returns Reward processing result
   */
  async processReferralReward(referralId: string, type: RewardType): Promise<RewardResult> {
    // Get referral relationship
    const referral = await this.referralRepository.findById(referralId);
    if (!referral) {
      logger.warn(`Attempted to process reward for non-existent referral: ${referralId}`);
      return { success: false, error: 'Referral not found' };
    }
    
    // Check if this reward type has already been processed (idempotency)
    const isAlreadyProcessed = await this.isRewardAlreadyProcessed(referralId, type);
    if (isAlreadyProcessed) {
      logger.info(`Reward already processed for referral ${referralId}, type ${type}`);
      return { success: false, alreadyProcessed: true };
    }
    
    // Get reward configuration
    const rewardConfig = this.rewardConfigs[type];
    if (!rewardConfig) {
      logger.warn(`Unknown reward type: ${type}`);
      return { success: false, error: 'Invalid reward type' };
    }
    
    // Check if conditions are met
    const conditionsMet = await this.checkRewardConditions(referral, rewardConfig.conditions || []);
    if (!conditionsMet) {
      logger.info(`Reward conditions not met for referral ${referralId}, type ${type}`);
      return { success: false, conditionsNotMet: true };
    }
    
    // Process the reward in a transaction
    try {
      return await db.transaction(async (client) => {
        // Create reward record
        const rewardId = await this.createRewardRecord(
          referral.id,
          referral.referrer_id,
          referral.referred_id,
          type,
          rewardConfig.pointsAmount,
          client
        );
        
        // Award points to referrer
        await this.pointsService.awardPoints({
          userId: referral.referrer_id,
          amount: rewardConfig.pointsAmount,
          source: 'referral_reward',
          referenceId: rewardId,
          description: rewardConfig.description
        }, client);
        
        // Update referral status if needed
        if (type === 'signup' && referral.status === 'pending') {
          await this.referralRepository.updateStatus(referral.id, 'completed');
        } else if (type === 'wallet_connection') {
          // For wallet connection, we update to converted/rewarded
          await this.referralRepository.updateStatus(referral.id, 'rewarded', {
            reward_amount: rewardConfig.pointsAmount
          });
        }
        
        // Mark reward as processed
        await this.markRewardAsProcessed(rewardId, client);
        
        // Emit reward event
        await this.eventBus.publish('referral.reward_processed', { 
          referralId, 
          rewardId,
          referrerId: referral.referrer_id,
          refereeId: referral.referred_id,
          type,
          amount: rewardConfig.pointsAmount
        });
        
        logger.info(`Processed reward for referral ${referralId}, type ${type}, amount ${rewardConfig.pointsAmount}`);
        
        return { success: true, rewardId };
      });
    } catch (error) {
      logger.error(`Failed to process reward for referral ${referralId}`, { error });
      return { success: false, error: 'Failed to process reward' };
    }
  }

  /**
   * Calculate rewards for a referrer
   * 
   * @param referrerId Referrer user ID
   * @returns Reward summary
   */
  async calculateRewards(referrerId: string): Promise<RewardSummary> {
    // This would query a rewards table in a real implementation
    // For now, we'll return a simulated summary
    
    // Get basic stats
    const totalRewards = await this.countUserRewards(referrerId);
    const pendingRewards = await this.countUserRewards(referrerId, 'pending');
    const processedRewards = await this.countUserRewards(referrerId, 'processed');
    
    // Get points earned from referrals
    const totalPointsEarned = await this.sumRewardPoints(referrerId);
    
    // Get rewards by type
    const byType: Record<RewardType, { count: number; points: number }> = {
      signup: { count: 0, points: 0 },
      engagement: { count: 0, points: 0 },
      wallet_connection: { count: 0, points: 0 },
      points_milestone: { count: 0, points: 0 }
    };
    
    // This would be calculated from the reward records in a real implementation
    // For demonstration, we'll set some sample values
    byType.signup = { 
      count: Math.floor(totalRewards * 0.5), 
      points: Math.floor(totalPointsEarned * 0.5)
    };
    byType.wallet_connection = { 
      count: Math.floor(totalRewards * 0.3), 
      points: Math.floor(totalPointsEarned * 0.3)
    };
    byType.engagement = { 
      count: Math.floor(totalRewards * 0.15), 
      points: Math.floor(totalPointsEarned * 0.15)
    };
    byType.points_milestone = { 
      count: Math.floor(totalRewards * 0.05), 
      points: Math.floor(totalPointsEarned * 0.05)
    };
    
    return {
      totalRewards,
      pendingRewards,
      processedRewards,
      totalPointsEarned,
      byType
    };
  }

  /**
   * Get reward history for a user
   * 
   * @param userId User ID
   * @param limit Maximum number of records to return
   * @param offset Number of records to skip
   * @returns Reward history
   */
  async getRewardHistory(userId: string, limit: number = 20, offset: number = 0): Promise<RewardHistory[]> {
    // This would query a rewards table in a real implementation
    // For now, we'll return sample data
    
    // Get user's referrals to base our sample data on
    const referrals = await this.referralRepository.findByReferrerId(userId, limit, offset);
    
    // Create sample reward history
    const history: RewardHistory[] = [];
    
    for (const referral of referrals) {
      // Add signup reward
      history.push({
        id: `reward-signup-${referral.id}`,
        referralId: referral.id,
        referrerId: referral.referrer_id,
        refereeId: referral.referred_id,
        type: 'signup',
        pointsAmount: this.rewardConfigs.signup.pointsAmount,
        createdAt: new Date(referral.created_at.getTime() + 60000), // 1 minute after referral
        status: 'processed',
        processedAt: new Date(referral.created_at.getTime() + 65000) // 5 seconds after creation
      });
      
      // If referred user has converted, add wallet_connection reward
      if (referral.status === 'converted' || referral.status === 'rewarded') {
        history.push({
          id: `reward-wallet-${referral.id}`,
          referralId: referral.id,
          referrerId: referral.referrer_id,
          refereeId: referral.referred_id,
          type: 'wallet_connection',
          pointsAmount: this.rewardConfigs.wallet_connection.pointsAmount,
          createdAt: referral.converted_at || new Date(),
          status: 'processed',
          processedAt: new Date((referral.converted_at || new Date()).getTime() + 5000)
        });
      }
    }
    
    // Sort by created date, most recent first
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Check for referral milestones that might trigger rewards
   * 
   * @param refereeId Referred user ID
   * @returns Milestone check results
   */
  async checkReferralMilestones(refereeId: string): Promise<MilestoneCheck[]> {
    // Find the referral relationship
    const referral = await this.referralRepository.findByReferredId(refereeId);
    if (!referral) {
      logger.info(`No referral found for user ${refereeId}`);
      return [];
    }
    
    const results: MilestoneCheck[] = [];
    
    // Check signup milestone
    results.push(await this.checkSignupMilestone(referral));
    
    // Check wallet connection milestone
    results.push(await this.checkWalletMilestone(referral));
    
    // Check engagement milestone
    results.push(await this.checkEngagementMilestone(referral));
    
    // Check points milestone
    results.push(await this.checkPointsMilestone(referral));
    
    return results;
  }

  /**
   * Process all eligible milestones for a referred user
   * 
   * @param refereeId Referred user ID
   * @returns Processed milestones
   */
  async processEligibleMilestones(refereeId: string): Promise<{
    processed: string[];
    failed: string[];
  }> {
    const milestones = await this.checkReferralMilestones(refereeId);
    const processed: string[] = [];
    const failed: string[] = [];
    
    // Get the referral
    const referral = await this.referralRepository.findByReferredId(refereeId);
    if (!referral) {
      return { processed: [], failed: [] };
    }
    
    // Process each eligible but unprocessed milestone
    for (const milestone of milestones) {
      if (milestone.eligible && !milestone.processed) {
        // Map milestone to reward type
        const rewardType = this.getMilestoneRewardType(milestone.milestone);
        if (!rewardType) continue;
        
        // Process the reward
        const result = await this.processReferralReward(referral.id, rewardType);
        
        if (result.success) {
          processed.push(milestone.milestone);
        } else {
          failed.push(milestone.milestone);
        }
      }
    }
    
    return { processed, failed };
  }

  /**
   * Map milestone to reward type
   * 
   * @param milestone Milestone name
   * @returns Reward type
   */
  private getMilestoneRewardType(milestone: string): RewardType | null {
    const mapping: Record<string, RewardType> = {
      'signup_completion': 'signup',
      'wallet_connection': 'wallet_connection',
      'engagement_first_post': 'engagement',
      'points_milestone_1000': 'points_milestone'
    };
    
    return mapping[milestone] || null;
  }

  /**
   * Check if signup milestone is eligible and processed
   * 
   * @param referral Referral object
   * @returns Milestone check result
   */
  private async checkSignupMilestone(referral: any): Promise<MilestoneCheck> {
    return {
      milestone: 'signup_completion',
      eligible: true, // Always eligible once there's a referral
      processed: referral.status !== 'pending' // If not pending, it's been processed
    };
  }

  /**
   * Check if wallet connection milestone is eligible and processed
   * 
   * @param referral Referral object
   * @returns Milestone check result
   */
  private async checkWalletMilestone(referral: any): Promise<MilestoneCheck> {
    // Check if user has connected wallet
    const hasWallet = await this.checkUserHasWallet(referral.referred_id);
    
    return {
      milestone: 'wallet_connection',
      eligible: hasWallet,
      processed: referral.status === 'rewarded' || referral.status === 'converted'
    };
  }

  /**
   * Check if engagement milestone is eligible and processed
   * 
   * @param referral Referral object
   * @returns Milestone check result
   */
  private async checkEngagementMilestone(referral: any): Promise<MilestoneCheck> {
    // Check if user has created content
    const hasCreatedContent = await this.checkUserHasCreatedContent(referral.referred_id);
    
    // Check if this milestone has been rewarded
    const rewardProcessed = await this.isRewardAlreadyProcessed(referral.id, 'engagement');
    
    return {
      milestone: 'engagement_first_post',
      eligible: hasCreatedContent,
      processed: rewardProcessed
    };
  }

  /**
   * Check if points milestone is eligible and processed
   * 
   * @param referral Referral object
   * @returns Milestone check result
   */
  private async checkPointsMilestone(referral: any): Promise<MilestoneCheck> {
    // Check if user has reached points threshold
    const pointsThreshold = 1000;
    const hasReachedThreshold = await this.checkUserPointsThreshold(
      referral.referred_id, 
      pointsThreshold
    );
    
    // Check if this milestone has been rewarded
    const rewardProcessed = await this.isRewardAlreadyProcessed(referral.id, 'points_milestone');
    
    return {
      milestone: 'points_milestone_1000',
      eligible: hasReachedThreshold,
      processed: rewardProcessed,
      reason: hasReachedThreshold ? undefined : `User has not reached ${pointsThreshold} points`
    };
  }

  /**
   * Check if user has connected a wallet
   * 
   * @param userId User ID
   * @returns Whether user has a connected wallet
   */
  private async checkUserHasWallet(userId: string): Promise<boolean> {
    // In a real implementation, this would check the wallet connection table
    // For now, we'll simulate some users having wallets
    return userId.toLowerCase().includes('a') || userId.toLowerCase().includes('e');
  }

  /**
   * Check if user has created content
   * 
   * @param userId User ID
   * @returns Whether user has created content
   */
  private async checkUserHasCreatedContent(userId: string): Promise<boolean> {
    // In a real implementation, this would check the content table
    // For now, we'll simulate some users having created content
    return userId.toLowerCase().includes('b') || userId.toLowerCase().includes('d');
  }

  /**
   * Check if user has reached a points threshold
   * 
   * @param userId User ID
   * @param threshold Points threshold
   * @returns Whether user has reached the threshold
   */
  private async checkUserPointsThreshold(userId: string, threshold: number): Promise<boolean> {
    // In a real implementation, this would check the user's points balance
    // For now, we'll use the points service to get the user's points
    try {
      const points = await this.pointsService.getUserTotalPoints(userId);
      return points >= threshold;
    } catch (error) {
      logger.error(`Failed to check points threshold for user ${userId}`, { error });
      return false;
    }
  }

  /**
   * Check if reward has already been processed
   * 
   * @param referralId Referral ID
   * @param type Reward type
   * @returns Whether reward has been processed
   */
  private async isRewardAlreadyProcessed(referralId: string, type: RewardType): Promise<boolean> {
    // In a real implementation, this would check the reward records
    // For now, we'll simulate a check based on referral status and type
    
    // Get the referral
    const referral = await this.referralRepository.findById(referralId);
    if (!referral) return false;
    
    // For signup rewards, check if status is beyond pending
    if (type === 'signup') {
      return referral.status !== 'pending';
    }
    
    // For wallet connection, check if status is rewarded or converted
    if (type === 'wallet_connection') {
      return referral.status === 'rewarded' || referral.status === 'converted';
    }
    
    // For other types, we'd check the rewards table
    // For now, return false to allow processing
    return false;
  }

  /**
   * Check if reward conditions are met
   * 
   * @param referral Referral object
   * @param conditions Conditions to check
   * @returns Whether conditions are met
   */
  private async checkRewardConditions(
    referral: any, 
    conditions: RewardCondition[]
  ): Promise<boolean> {
    // If no conditions, always return true
    if (conditions.length === 0) {
      return true;
    }
    
    // Check each condition
    for (const condition of conditions) {
      switch (condition.type) {
        case 'points_threshold':
          const hasReachedThreshold = await this.checkUserPointsThreshold(
            referral.referred_id, 
            condition.value
          );
          if (!hasReachedThreshold) return false;
          break;
          
        case 'days_since_referral':
          const daysSinceReferral = this.getDaysSinceReferral(referral);
          if (daysSinceReferral < condition.value) return false;
          break;
          
        case 'status':
          if (referral.status !== condition.value) return false;
          break;
          
        default:
          logger.warn(`Unknown condition type: ${condition.type}`);
          break;
      }
    }
    
    // All conditions passed
    return true;
  }

  /**
   * Get days since referral was created
   * 
   * @param referral Referral object
   * @returns Number of days since referral
   */
  private getDaysSinceReferral(referral: any): number {
    const now = new Date();
    const referralDate = new Date(referral.created_at);
    const diffTime = Math.abs(now.getTime() - referralDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Create a reward record
   * 
   * @param referralId Referral ID
   * @param referrerId Referrer user ID
   * @param refereeId Referee user ID
   * @param type Reward type
   * @param pointsAmount Points amount
   * @param client Database client for transaction
   * @returns Created reward ID
   */
  private async createRewardRecord(
    referralId: string,
    referrerId: string,
    refereeId: string,
    type: RewardType,
    pointsAmount: number,
    client?: any
  ): Promise<string> {
    // In a real implementation, this would create a record in the rewards table
    // For now, we'll just return a dummy ID
    return `reward-${type}-${referralId}-${Date.now()}`;
  }

  /**
   * Mark a reward as processed
   * 
   * @param rewardId Reward ID
   * @param client Database client for transaction
   */
  private async markRewardAsProcessed(rewardId: string, client?: any): Promise<void> {
    // In a real implementation, this would update the reward record
    // For now, we'll just log it
    logger.info(`Marked reward ${rewardId} as processed`);
  }

  /**
   * Count rewards for a user
   * 
   * @param userId User ID
   * @param status Optional status filter
   * @returns Number of rewards
   */
  private async countUserRewards(userId: string, status?: string): Promise<number> {
    // In a real implementation, this would count records in the rewards table
    // For now, we'll generate a sample count based on the user's referrals
    const referrals = await this.referralRepository.findByReferrerId(userId, 100, 0);
    
    if (status === 'pending') {
      return Math.floor(referrals.length * 0.1); // 10% pending
    } else if (status === 'processed') {
      return Math.floor(referrals.length * 0.9); // 90% processed
    } else {
      return referrals.length;
    }
  }

  /**
   * Sum reward points for a user
   * 
   * @param userId User ID
   * @returns Total points from rewards
   */
  private async sumRewardPoints(userId: string): Promise<number> {
    // In a real implementation, this would sum points from the rewards table
    // For now, we'll estimate based on the user's referrals
    const referrals = await this.referralRepository.findByReferrerId(userId, 100, 0);
    
    let totalPoints = 0;
    
    for (const referral of referrals) {
      // Count signup reward for all referrals
      totalPoints += this.rewardConfigs.signup.pointsAmount;
      
      // Count wallet connection reward for converted/rewarded referrals
      if (referral.status === 'converted' || referral.status === 'rewarded') {
        totalPoints += this.rewardConfigs.wallet_connection.pointsAmount;
      }
      
      // Add some random engagement and milestone rewards
      if (Math.random() > 0.7) {
        totalPoints += this.rewardConfigs.engagement.pointsAmount;
      }
      
      if (Math.random() > 0.9) {
        totalPoints += this.rewardConfigs.points_milestone.pointsAmount;
      }
    }
    
    return totalPoints;
  }
}
