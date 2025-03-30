/**
 * Referral Network Service
 * 
 * Service for managing multi-level referral relationships and rewards
 */
import { 
  ReferralRepository,
  ReferralCodeRepository
} from '../../../repositories/referral';
import { UserRepository } from '../../../repositories/user-repository';
import { EventBus, EventType } from '../../../lib/event-bus';
import { EnhancedPointsService } from '../../points/points-service-enhanced';
import { logger } from '../../../lib/logger';
import { NotFoundError, ValidationError } from '../../../errors';
import { db } from '../../../database';

/**
 * Referral tier configuration
 */
export interface ReferralTier {
  level: number;
  rewardMultiplier: number;
  requirements?: TierRequirement[];
  maxEarningsPerReferral?: number;
}

/**
 * Tier requirement
 */
export interface TierRequirement {
  type: string;
  value: any;
}

/**
 * Referral network rewards
 */
export interface NetworkRewards {
  totalRewards: number;
  byLevel: {
    level: number;
    count: number;
    points: number;
  }[];
}

/**
 * Network reward result
 */
export interface NetworkRewardResult {
  success: boolean;
  rewardedLevels: number[];
  totalPoints: number;
  error?: string;
}

/**
 * Referral path
 */
export interface ReferralPath {
  path: {
    userId: string;
    level: number;
    referralDate: Date;
  }[];
  length: number;
  found: boolean;
}

/**
 * Service for managing multi-level referral networks
 */
export class ReferralNetworkService {
  /**
   * Tier configurations for multi-level rewards
   */
  private tiers: ReferralTier[] = [
    {
      level: 1, // Direct referrals
      rewardMultiplier: 1.0, // 100% of base reward
      maxEarningsPerReferral: null // No limit for direct referrals
    },
    {
      level: 2, // Second level (referrals of referrals)
      rewardMultiplier: 0.2, // 20% of base reward
      requirements: [
        { type: 'min_direct_referrals', value: 5 } // Must have at least 5 direct referrals
      ],
      maxEarningsPerReferral: 1000 // Max 1000 points per indirect referral
    },
    {
      level: 3, // Third level
      rewardMultiplier: 0.05, // 5% of base reward
      requirements: [
        { type: 'min_direct_referrals', value: 10 }, // Must have at least 10 direct referrals
        { type: 'min_second_level', value: 20 } // Must have at least 20 second-level referrals
      ],
      maxEarningsPerReferral: 500 // Max 500 points per level 3 referral
    }
  ];

  /**
   * Maximum network depth to traverse
   */
  private maxNetworkDepth = 3;

  /**
   * Create a new ReferralNetworkService instance
   */
  constructor(
    private referralRepository: ReferralRepository,
    private userRepository: UserRepository,
    private pointsService: EnhancedPointsService,
    private eventBus: EventBus
  ) {}

  /**
   * Calculate network rewards for a user
   * 
   * @param userId User ID
   * @param levels Maximum levels to calculate (default: maxNetworkDepth)
   * @returns Network rewards
   */
  async calculateNetworkRewards(
    userId: string, 
    levels: number = this.maxNetworkDepth
  ): Promise<NetworkRewards> {
    // Limit levels to max depth
    const depth = Math.min(levels, this.maxNetworkDepth);
    
    // Get referral chain
    const chain = await this.referralRepository.getReferralChain(userId, depth);
    
    // Initialize rewards
    const rewards: NetworkRewards = {
      totalRewards: 0,
      byLevel: []
    };
    
    // Process each level
    for (let level = 0; level < depth; level++) {
      const levelReferrals = chain[level] || [];
      let levelPoints = 0;
      
      // Skip levels that don't have referrals
      if (levelReferrals.length === 0) {
        rewards.byLevel.push({ level: level + 1, count: 0, points: 0 });
        continue;
      }
      
      // Check if user qualifies for this level's rewards
      const tier = this.tiers[level];
      const qualifies = await this.checkTierRequirements(userId, tier, chain);
      
      if (qualifies) {
        // Calculate points for this level
        for (const referral of levelReferrals) {
          // Base points are 500 (signup reward) + any additional rewards
          const basePoints = 500 + (referral.reward_amount || 0);
          let levelReward = basePoints * tier.rewardMultiplier;
          
          // Apply max earnings cap if set
          if (tier.maxEarningsPerReferral !== null) {
            levelReward = Math.min(levelReward, tier.maxEarningsPerReferral);
          }
          
          levelPoints += levelReward;
        }
      }
      
      // Add level to rewards
      rewards.byLevel.push({
        level: level + 1,
        count: levelReferrals.length,
        points: qualifies ? levelPoints : 0
      });
      
      // Add to total
      rewards.totalRewards += qualifies ? levelPoints : 0;
    }
    
    return rewards;
  }

  /**
   * Process network reward for a referral
   * 
   * @param referralId Referral ID
   * @param baseReward Base reward amount
   * @returns Network reward result
   */
  async processNetworkReward(
    referralId: string, 
    baseReward: number = 500
  ): Promise<NetworkRewardResult> {
    try {
      // Get referral
      const referral = await this.referralRepository.findById(referralId);
      if (!referral) {
        return { success: false, rewardedLevels: [], totalPoints: 0, error: 'Referral not found' };
      }
      
      // Get user's upline (referral path going up)
      const upline = await this.getReferralUpline(referral.referred_id, this.maxNetworkDepth);
      
      // Initialize result
      const result: NetworkRewardResult = {
        success: true,
        rewardedLevels: [],
        totalPoints: 0
      };
      
      // Process rewards for each level of the upline
      for (let i = 0; i < upline.path.length; i++) {
        const ancestor = upline.path[i];
        
        // Skip the referred user (level 0)
        if (ancestor.level === 0) continue;
        
        // Get tier configuration for this level
        const tier = this.tiers[ancestor.level - 1];
        if (!tier) continue;
        
        // Check if ancestor qualifies for this tier
        const userChain = await this.referralRepository.getReferralChain(ancestor.userId, this.maxNetworkDepth);
        const qualifies = await this.checkTierRequirements(ancestor.userId, tier, userChain);
        
        if (qualifies) {
          // Calculate reward
          let reward = baseReward * tier.rewardMultiplier;
          
          // Apply max earnings cap if set
          if (tier.maxEarningsPerReferral !== null) {
            reward = Math.min(reward, tier.maxEarningsPerReferral);
          }
          
          // Only process if there's a meaningful reward
          if (reward >= 1) {
            // Award points
            await this.pointsService.awardPoints({
              userId: ancestor.userId,
              amount: Math.floor(reward),
              source: 'multilevel_referral',
              referenceId: referralId,
              description: `Level ${ancestor.level} referral reward for ${referral.referred_id}`
            });
            
            // Track rewarded level
            result.rewardedLevels.push(ancestor.level);
            result.totalPoints += Math.floor(reward);
            
            // Emit event
            await this.eventBus.publish('referral.network_reward', {
              referralId,
              recipientId: ancestor.userId,
              level: ancestor.level,
              amount: Math.floor(reward)
            });
            
            logger.info(`Awarded ${Math.floor(reward)} points to user ${ancestor.userId} for level ${ancestor.level} referral`);
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to process network reward', { referralId, error });
      return { 
        success: false, 
        rewardedLevels: [], 
        totalPoints: 0, 
        error: 'Failed to process network reward' 
      };
    }
  }

  /**
   * Get a user's complete referral network
   * 
   * @param userId User ID
   * @param levels Maximum levels to retrieve (default: maxNetworkDepth)
   * @returns Referral network
   */
  async getUserReferralNetwork(
    userId: string, 
    levels: number = this.maxNetworkDepth
  ): Promise<any> {
    // This is a more detailed network compared to the one in ReferralService
    // It includes full hierarchy information and user details
    
    // Get the user's referral chain
    const chain = await this.referralRepository.getReferralChain(userId, levels);
    
    // Build the network structure
    const network = {
      userId,
      level: 0,
      children: [],
      totalReferrals: 0,
      activeReferrals: 0
    };
    
    // Process direct referrals (level 1)
    const directReferrals = chain[0] || [];
    
    for (const referral of directReferrals) {
      // Create child node
      const childNode = {
        userId: referral.referred_id,
        referralDate: referral.created_at,
        level: 1,
        status: referral.status,
        children: []
      };
      
      // If more levels requested, recursively build the tree
      if (levels > 1) {
        await this.buildReferralTree(childNode, chain, 1, levels);
      }
      
      network.children.push(childNode);
    }
    
    // Calculate network metrics
    network.totalReferrals = this.countTotalReferrals(network);
    network.activeReferrals = this.countActiveReferrals(network);
    
    return network;
  }

  /**
   * Get the referral path between two users
   * 
   * @param startUserId Starting user ID
   * @param targetUserId Target user ID
   * @returns Referral path
   */
  async getReferralPath(startUserId: string, targetUserId: string): Promise<ReferralPath> {
    // Create empty path
    const path: ReferralPath = {
      path: [],
      length: 0,
      found: false
    };
    
    // Add starting user
    path.path.push({
      userId: startUserId,
      level: 0,
      referralDate: new Date()
    });
    
    // Get referral chain from starting user
    const chain = await this.referralRepository.getReferralChain(startUserId, this.maxNetworkDepth);
    
    // Search for target user in the chain
    let found = false;
    for (let level = 0; level < chain.length; level++) {
      const levelReferrals = chain[level] || [];
      
      for (const referral of levelReferrals) {
        if (referral.referred_id === targetUserId) {
          // Found target user
          found = true;
          
          // Add intermediate users to path (would need to traverse back up the chain)
          // This is a simplified implementation
          path.path.push({
            userId: targetUserId,
            level: level + 1,
            referralDate: referral.created_at
          });
          
          path.length = level + 1;
          path.found = true;
          break;
        }
      }
      
      if (found) break;
    }
    
    return path;
  }

  /**
   * Get the upline for a user (referral path going up)
   * 
   * @param userId User ID
   * @param maxLevels Maximum levels to traverse
   * @returns Referral path going up the chain
   */
  async getReferralUpline(userId: string, maxLevels: number = this.maxNetworkDepth): Promise<ReferralPath> {
    // Initialize path
    const path: ReferralPath = {
      path: [{ userId, level: 0, referralDate: new Date() }],
      length: 0,
      found: true
    };
    
    let currentUserId = userId;
    let currentLevel = 0;
    
    // Traverse up the chain
    while (currentLevel < maxLevels) {
      // Find the referrer of the current user
      const referral = await this.referralRepository.findByReferredId(currentUserId);
      
      // If no referrer found, we've reached the top
      if (!referral) break;
      
      // Add referrer to path
      currentLevel++;
      currentUserId = referral.referrer_id;
      
      path.path.push({
        userId: currentUserId,
        level: currentLevel,
        referralDate: referral.created_at
      });
      
      path.length = currentLevel;
    }
    
    return path;
  }

  /**
   * Build a referral tree recursively
   * 
   * @param node Current node to build
   * @param chain Referral chain data
   * @param currentLevel Current level in the tree
   * @param maxLevels Maximum levels to build
   */
  private async buildReferralTree(
    node: any, 
    chain: any[], 
    currentLevel: number, 
    maxLevels: number
  ): Promise<void> {
    // Stop if we've reached the maximum level
    if (currentLevel >= maxLevels) return;
    
    // Get referrals at the next level
    const nextLevelReferrals = chain[currentLevel] || [];
    
    // Filter referrals where the current node is the referrer
    const childReferrals = nextLevelReferrals.filter(r => 
      r.referrer_id === node.userId
    );
    
    // Process each child referral
    for (const childReferral of childReferrals) {
      // Create child node
      const childNode = {
        userId: childReferral.referred_id,
        referralDate: childReferral.created_at,
        level: currentLevel + 1,
        status: childReferral.status,
        children: []
      };
      
      // Recursively build the next level
      if (currentLevel + 1 < maxLevels) {
        await this.buildReferralTree(childNode, chain, currentLevel + 1, maxLevels);
      }
      
      // Add child to parent's children
      node.children.push(childNode);
    }
  }

  /**
   * Check if a user meets tier requirements
   * 
   * @param userId User ID
   * @param tier Tier configuration
   * @param chain User's referral chain
   * @returns Whether requirements are met
   */
  private async checkTierRequirements(
    userId: string, 
    tier: ReferralTier, 
    chain: any[]
  ): Promise<boolean> {
    // If no requirements, always qualify
    if (!tier.requirements || tier.requirements.length === 0) {
      return true;
    }
    
    // Check each requirement
    for (const requirement of tier.requirements) {
      switch (requirement.type) {
        case 'min_direct_referrals':
          // Check number of direct referrals
          const directReferrals = chain[0] || [];
          if (directReferrals.length < requirement.value) {
            return false;
          }
          break;
          
        case 'min_second_level':
          // Check number of second-level referrals
          const secondLevelReferrals = chain[1] || [];
          if (secondLevelReferrals.length < requirement.value) {
            return false;
          }
          break;
          
        case 'account_age_days':
          // Check account age
          const accountAge = await this.getUserAccountAge(userId);
          if (accountAge < requirement.value) {
            return false;
          }
          break;
          
        case 'min_points':
          // Check points balance
          const points = await this.pointsService.getUserTotalPoints(userId);
          if (points < requirement.value) {
            return false;
          }
          break;
          
        default:
          logger.warn(`Unknown tier requirement type: ${requirement.type}`);
          break;
      }
    }
    
    // All requirements passed
    return true;
  }

  /**
   * Get a user's account age in days
   * 
   * @param userId User ID
   * @returns Account age in days
   */
  private async getUserAccountAge(userId: string): Promise<number> {
    // In a real implementation, this would check the user's creation date
    // For now, we'll return a random value
    return Math.floor(Math.random() * 365);
  }

  /**
   * Count total referrals in a network
   * 
   * @param network Referral network
   * @returns Total number of referrals
   */
  private countTotalReferrals(network: any): number {
    let count = network.children.length;
    
    // Recursively count children
    for (const child of network.children) {
      count += this.countChildren(child);
    }
    
    return count;
  }

  /**
   * Count children recursively
   * 
   * @param node Network node
   * @returns Number of children
   */
  private countChildren(node: any): number {
    let count = node.children.length;
    
    for (const child of node.children) {
      count += this.countChildren(child);
    }
    
    return count;
  }

  /**
   * Count active referrals in a network
   * 
   * @param network Referral network
   * @returns Number of active referrals
   */
  private countActiveReferrals(network: any): number {
    const activeStatuses = ['completed', 'converted', 'rewarded'];
    
    let count = network.children.filter(
      (child: any) => activeStatuses.includes(child.status)
    ).length;
    
    // Recursively count active children
    for (const child of network.children) {
      count += this.countActiveChildren(child, activeStatuses);
    }
    
    return count;
  }

  /**
   * Count active children recursively
   * 
   * @param node Network node
   * @param activeStatuses Active status list
   * @returns Number of active children
   */
  private countActiveChildren(node: any, activeStatuses: string[]): number {
    let count = node.children.filter(
      (child: any) => activeStatuses.includes(child.status)
    ).length;
    
    for (const child of node.children) {
      count += this.countActiveChildren(child, activeStatuses);
    }
    
    return count;
  }
}
