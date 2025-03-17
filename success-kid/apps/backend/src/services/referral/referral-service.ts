/**
 * Referral Service
 * 
 * Core service for managing referrals and tracking user relationships
 */
import { ReferralRepository } from '../../repositories/referral';
import { ReferralCodeRepository } from '../../repositories/referral';
import { ReferralCampaignRepository } from '../../repositories/referral';
import { PointsService } from '../points/points-service';
import { EventBus, EventType } from '../../lib/event-bus';
import { 
  Referral, 
  ReferralStatus, 
  ReferralCode, 
  CreateReferralDto 
} from '../../models/entities/referral.model';
import { logger } from '../../lib/logger';
import { NotFoundError, ValidationError, ConflictError } from '../../errors';
import { ReferralVerifier } from './verification/referral-verifier';

/**
 * Interface for tracking a referral visit
 */
export interface VisitorData {
  visitorId: string;
  ipHash: string;
  userAgent: string;
  landingPage: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Interface for referral tracking result
 */
export interface ReferralTrackingResult {
  code: string;
  referrerId: string;
  tracked: boolean;
  visitorId: string;
}

/**
 * Interface for referral attribution result
 */
export interface ReferralAttributionResult {
  success: boolean;
  referralId?: string;
  referrerId?: string;
  code?: string;
}

/**
 * Interface for referral statistics
 */
export interface ReferralStatistics {
  referrals: {
    total: number;
    pending: number;
    completed: number;
    converted: number;
    rewarded: number;
    conversionRate: number;
  };
  rewards: {
    total: number;
    pending: number;
  };
  network: {
    size: number;
    depth: number;
    activity: {
      active: number;
      inactive: number;
    };
  };
}

/**
 * Interface for referral network visualization
 */
export interface ReferralNetwork {
  userId: string;
  level: number;
  children: ReferralNode[];
  totalReferrals: number;
  activeReferrals: number;
}

/**
 * Interface for referral node in network
 */
export interface ReferralNode {
  userId: string;
  referralDate: Date;
  level: number;
  status: ReferralStatus;
  children: ReferralNode[];
}

/**
 * Core service for managing referrals
 */
export class ReferralService {
  /**
   * Create a new ReferralService instance
   */
  constructor(
    private referralRepository: ReferralRepository,
    private referralCodeRepository: ReferralCodeRepository,
    private referralCampaignRepository: ReferralCampaignRepository,
    private pointsService: PointsService,
    private eventBus: EventBus,
    private referralVerifier: ReferralVerifier
  ) {}

  /**
   * Create a referral relationship between two users
   * 
   * @param data Referral data
   * @returns Created referral
   */
  async createReferral(data: CreateReferralDto): Promise<Referral> {
    // Validate that users are not the same
    if (data.referrer_id === data.referred_id) {
      throw new ValidationError('Referrer and referred user cannot be the same');
    }
    
    // Check if referred user already has a referrer
    const existingReferral = await this.referralRepository.findByReferredId(data.referred_id);
    if (existingReferral) {
      throw new ConflictError(`User ${data.referred_id} already has a referrer`);
    }

    // Check the referral code if provided
    if (data.referral_code) {
      const code = await this.referralCodeRepository.findByCode(data.referral_code);
      if (!code) {
        throw new ValidationError(`Invalid referral code: ${data.referral_code}`);
      }
      
      // Validate that the code belongs to the referrer
      if (code.user_id !== data.referrer_id) {
        throw new ValidationError('Referral code does not belong to the specified referrer');
      }
      
      // Increment code usage
      await this.referralCodeRepository.incrementUseCount(data.referral_code);
    }

    // Create the referral
    const referral = await this.referralRepository.createReferral(data);
    
    // Emit referral created event
    await this.eventBus.publish(
      'referral.created', 
      {
        referralId: referral.id,
        referrerId: referral.referrer_id,
        referredId: referral.referred_id,
        code: referral.referral_code,
        source: referral.source
      }
    );
    
    logger.info(`Referral created: ${referral.referrer_id} referred ${referral.referred_id}`);
    
    return referral;
  }

  /**
   * Track a referral link visit for attribution
   * 
   * @param code Referral code
   * @param trackingData Visitor data for tracking
   * @returns Tracking result
   */
  async trackReferralVisit(code: string, trackingData: VisitorData): Promise<ReferralTrackingResult> {
    // Find the referral code
    const referralCode = await this.referralCodeRepository.findByCode(code);
    if (!referralCode) {
      throw new NotFoundError('Referral code', code);
    }

    // Verify the code is still valid
    this.verifyCodeValidity(referralCode);

    // Store tracking information (in a real implementation, this would be stored in the database)
    // For now, we'll just simulate tracking with a log
    logger.info(`Tracked referral visit: ${code}`, { trackingData });

    return {
      code,
      referrerId: referralCode.user_id,
      tracked: true,
      visitorId: trackingData.visitorId
    };
  }

  /**
   * Attribute a new user to a referrer based on tracking data
   * 
   * @param userId New user ID
   * @param visitorId Optional visitor ID for tracking correlation
   * @returns Attribution result
   */
  async attributeSignup(userId: string, referralCode?: string, visitorId?: string): Promise<ReferralAttributionResult> {
    // If no referral code but visitor ID provided, try to find recent tracking data
    if (!referralCode && visitorId) {
      // In a real implementation, we would look up tracking data by visitor ID
      // For now, we'll simulate failure to find tracking data
      return { success: false };
    }

    // If referral code provided, use it for attribution
    if (referralCode) {
      const code = await this.referralCodeRepository.findByCode(referralCode);
      if (!code) {
        return { success: false };
      }

      // Verify the code is still valid
      try {
        this.verifyCodeValidity(code);
      } catch (error) {
        return { success: false };
      }

      // Create the referral relationship
      try {
        const referral = await this.createReferral({
          referrer_id: code.user_id,
          referred_id: userId,
          referral_code: referralCode,
          source: 'signup'
        });

        return {
          success: true,
          referralId: referral.id,
          referrerId: referral.referrer_id,
          code: referralCode
        };
      } catch (error) {
        logger.error('Failed to attribute signup with referral code', { 
          userId, 
          referralCode, 
          error 
        });
        return { success: false };
      }
    }

    return { success: false };
  }

  /**
   * Update referral status
   * 
   * @param referralId Referral ID
   * @param status New status
   * @param data Additional data
   * @returns Updated referral
   */
  async updateReferralStatus(
    referralId: string, 
    status: ReferralStatus, 
    data: { rewardAmount?: number } = {}
  ): Promise<Referral> {
    const referral = await this.referralRepository.findById(referralId);
    if (!referral) {
      throw new NotFoundError('Referral', referralId);
    }

    // Update the referral status
    const updatedReferral = await this.referralRepository.updateStatus(
      referralId,
      status,
      {
        reward_amount: data.rewardAmount
      }
    );

    // Emit status change event
    await this.eventBus.publish(
      'referral.status_updated',
      {
        referralId: updatedReferral.id,
        referrerId: updatedReferral.referrer_id,
        referredId: updatedReferral.referred_id,
        oldStatus: referral.status,
        newStatus: updatedReferral.status
      }
    );

    logger.info(`Referral status updated: ${referralId} is now ${status}`);
    
    return updatedReferral;
  }

  /**
   * Get referrals made by a user
   * 
   * @param userId User ID
   * @param limit Maximum number of referrals to return
   * @param offset Number of referrals to skip
   * @returns Array of referrals
   */
  async getUserReferrals(userId: string, limit: number = 20, offset: number = 0): Promise<Referral[]> {
    return this.referralRepository.findByReferrerId(userId, limit, offset);
  }

  /**
   * Get referral statistics for a user
   * 
   * @param userId User ID
   * @returns Referral statistics
   */
  async getUserReferralStats(userId: string): Promise<ReferralStatistics> {
    // Get basic referral stats
    const stats = await this.referralRepository.getReferralStats(userId);
    
    // Get network size (recursive query to get all levels of referrals)
    const network = await this.referralRepository.getReferralChain(userId, 3);
    
    // Flatten the network to calculate total size
    const flatNetwork = network.flat();
    
    // Calculate active referrals (completed, converted, or rewarded)
    const activeStatuses: ReferralStatus[] = ['completed', 'converted', 'rewarded'];
    const activeReferrals = flatNetwork.filter(r => 
      activeStatuses.includes(r.status)
    ).length;
    
    // Calculate conversion rate
    const conversionRate = stats.total > 0 
      ? ((stats.completed + stats.converted + stats.rewarded) / stats.total) * 100 
      : 0;
    
    // Calculate network depth (max non-empty level)
    let depth = 0;
    for (let i = 0; i < network.length; i++) {
      if (network[i] && network[i].length > 0) {
        depth = i + 1;
      }
    }
    
    return {
      referrals: {
        total: stats.total,
        pending: stats.pending,
        completed: stats.completed,
        converted: stats.converted,
        rewarded: stats.rewarded,
        conversionRate
      },
      rewards: {
        total: 0, // This would be calculated from reward records
        pending: 0 // This would be calculated from reward records
      },
      network: {
        size: flatNetwork.length,
        depth,
        activity: {
          active: activeReferrals,
          inactive: flatNetwork.length - activeReferrals
        }
      }
    };
  }

  /**
   * Get a user's referral network for visualization
   * 
   * @param userId User ID
   * @param depth Maximum depth of the network
   * @returns Referral network
   */
  async getUserReferralNetwork(userId: string, depth: number = 2): Promise<ReferralNetwork> {
    // Get the user's referral chain
    const chain = await this.referralRepository.getReferralChain(userId, depth);
    
    // Build the network structure
    const network: ReferralNetwork = {
      userId,
      level: 0,
      children: [],
      totalReferrals: 0,
      activeReferrals: 0
    };
    
    // Only process direct referrals (level 1) for the children
    const directReferrals = chain[0] || [];
    
    // Process direct referrals
    for (const referral of directReferrals) {
      // Create the child node
      const childNode: ReferralNode = {
        userId: referral.referred_id,
        referralDate: referral.created_at,
        level: 1,
        status: referral.status,
        children: []
      };
      
      // If we should show more levels, process this user's referrals
      if (depth > 1 && chain.length > 1) {
        // Find this user's referrals in the next level
        const childReferrals = chain[1].filter(r => 
          r.referrer_id === referral.referred_id
        );
        
        // Process each child referral
        for (const childReferral of childReferrals) {
          const grandchildNode: ReferralNode = {
            userId: childReferral.referred_id,
            referralDate: childReferral.created_at,
            level: 2,
            status: childReferral.status,
            children: []
          };
          
          // Add the grandchild node to the child's children
          childNode.children.push(grandchildNode);
        }
      }
      
      // Add the child node to the network
      network.children.push(childNode);
    }
    
    // Calculate network metrics
    network.totalReferrals = this.countTotalReferrals(network);
    network.activeReferrals = this.countActiveReferrals(network);
    
    return network;
  }

  /**
   * Process referral milestone reward
   * 
   * @param referredId Referred user ID
   * @param milestone Milestone type (e.g., 'signup', 'wallet_connection', 'first_post')
   * @returns Whether the reward was processed
   */
  async processReferralMilestone(
    referredId: string, 
    milestone: string
  ): Promise<boolean> {
    try {
      // Find the referral relationship
      const referral = await this.referralRepository.findByReferredId(referredId);
      if (!referral) {
        return false;
      }
      
      // Check if this is a valid milestone that should trigger rewards
      if (!this.isValidMilestone(milestone)) {
        return false;
      }
      
      // Update the referral status based on milestone
      let newStatus: ReferralStatus = referral.status;
      
      if (milestone === 'signup_completion' && referral.status === 'pending') {
        newStatus = 'completed';
      } else if (milestone === 'wallet_connection' && 
                 (referral.status === 'pending' || referral.status === 'completed')) {
        newStatus = 'converted';
      }
      
      // Only update status if it's changing
      if (newStatus !== referral.status) {
        await this.updateReferralStatus(referral.id, newStatus);
      }
      
      // Determine if this milestone should award points
      const pointsAmount = this.getMilestonePointsAmount(milestone);
      
      if (pointsAmount > 0) {
        // Award points to the referrer
        await this.pointsService.awardPoints({
          userId: referral.referrer_id,
          amount: pointsAmount,
          source: 'referral_milestone',
          referenceId: referral.id,
          description: `Referral milestone: ${milestone} by ${referredId}`
        });
        
        // If this is a conversion milestone, update the reward amount and mark as rewarded
        if (milestone === 'wallet_connection') {
          await this.updateReferralStatus(referral.id, 'rewarded', { rewardAmount: pointsAmount });
        }
        
        // Emit reward event
        await this.eventBus.publish(
          'referral.milestone_rewarded',
          {
            referralId: referral.id,
            referrerId: referral.referrer_id,
            referredId,
            milestone,
            pointsAmount
          }
        );
        
        logger.info(`Referral milestone rewarded: ${milestone} for ${referral.id}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to process referral milestone', {
        referredId,
        milestone,
        error
      });
      return false;
    }
  }

  /**
   * Check if a user was referred and by whom
   * 
   * @param userId User ID to check
   * @returns Referral information or null if not referred
   */
  async getUserReferralInfo(userId: string): Promise<{
    wasReferred: boolean;
    referrerId?: string;
    referralDate?: Date;
    status?: ReferralStatus;
  }> {
    const referral = await this.referralRepository.findByReferredId(userId);
    
    if (!referral) {
      return { wasReferred: false };
    }
    
    return {
      wasReferred: true,
      referrerId: referral.referrer_id,
      referralDate: referral.created_at,
      status: referral.status
    };
  }

  /**
   * Count total referrals in a network
   * 
   * @param network Referral network
   * @returns Total number of referrals
   */
  private countTotalReferrals(network: ReferralNetwork): number {
    let count = network.children.length;
    
    for (const child of network.children) {
      count += child.children.length;
    }
    
    return count;
  }

  /**
   * Count active referrals in a network
   * 
   * @param network Referral network
   * @returns Number of active referrals
   */
  private countActiveReferrals(network: ReferralNetwork): number {
    const activeStatuses: ReferralStatus[] = ['completed', 'converted', 'rewarded'];
    
    let count = network.children.filter(
      child => activeStatuses.includes(child.status)
    ).length;
    
    for (const child of network.children) {
      count += child.children.filter(
        grandchild => activeStatuses.includes(grandchild.status)
      ).length;
    }
    
    return count;
  }

  /**
   * Check if a milestone is valid for rewards
   * 
   * @param milestone Milestone type
   * @returns Whether the milestone is valid
   */
  private isValidMilestone(milestone: string): boolean {
    const validMilestones = [
      'signup_completion',
      'wallet_connection',
      'first_post',
      'first_comment',
      'points_milestone_1000'
    ];
    
    return validMilestones.includes(milestone);
  }

  /**
   * Get points amount for a milestone
   * 
   * @param milestone Milestone type
   * @returns Points amount
   */
  private getMilestonePointsAmount(milestone: string): number {
    const milestoneRewards: Record<string, number> = {
      'signup_completion': 500,
      'wallet_connection': 250,
      'first_post': 100,
      'first_comment': 50,
      'points_milestone_1000': 100
    };
    
    return milestoneRewards[milestone] || 0;
  }

  /**
   * Verify referral code validity
   * 
   * @param code Referral code to verify
   * @throws ValidationError if code is invalid
   */
  private verifyCodeValidity(code: ReferralCode): void {
    // Check if code is active
    if (!code.is_active) {
      throw new ValidationError('Referral code is no longer active');
    }
    
    // Check if code has expired
    if (code.expires_at && new Date() > code.expires_at) {
      throw new ValidationError('Referral code has expired');
    }
    
    // Check if code has reached its usage limit
    if (code.max_uses !== null && code.uses >= code.max_uses) {
      throw new ValidationError('Referral code has reached its usage limit');
    }
  }
}
