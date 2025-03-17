/**
 * Referral Service
 * 
 * Core service for referral management, tracking, and rewards
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { PointsService } from '../points/points-service';
import { ReferralCodeRepository } from '../../repositories/referral-code-repository';
import { ReferralTrackingRepository } from '../../repositories/referral-tracking-repository';
import { ReferralRewardRepository } from '../../repositories/referral-reward-repository';
import { CreateReferralCodeDto, ReferralCodeStatus, ReferralCodeType } from '../../models/referral-code';
import { VisitorData } from '../../models/referral-tracking';
import { RewardType, RewardStatus, RewardResult } from '../../models/referral-reward';
import { logger } from '../../lib/logger';
import { eventBus, EventType } from '../../lib/event-bus';
import { ValidationError, NotFoundError, ConflictError } from '../../lib/errors';
import { getRedisClient } from '../../lib/db-client';

// Define the additional event types
EventType.REFERRAL_ATTRIBUTED = 'referral.attributed';
EventType.REFERRAL_REWARDED = 'referral.rewarded';

// Interface for referral code generation options
export interface ReferralCodeOptions {
  prefix?: string;
  length?: number;
  userId: string;
  customCode?: string;
  type?: ReferralCodeType;
  expiresAt?: Date;
  campaignId?: string;
}

// Interface for referral statistics
export interface ReferralStats {
  totalVisits: number;
  uniqueVisitors: number;
  conversions: number;
  conversionRate: number;
  totalRewards: number;
  totalPointsAwarded: number;
  pendingRewards: number;
  rewardsHistory: {
    signup: number;
    engagement: number;
    wallet_connection: number;
    points_milestone: number;
  };
}

// Interface for referral attribution result
export interface ReferralAttributionResult {
  success: boolean;
  referralId?: string;
  referrerId?: string;
  code?: string;
  error?: string;
}

// Interface for referral network info
export interface ReferralNetwork {
  userId: string;
  level: number;
  children: ReferralNode[];
  totalReferrals: number;
  activeReferrals: number;
}

// Interface for referral node in network
export interface ReferralNode {
  userId: string;
  referralDate: Date;
  level: number;
  status: string;
  children: ReferralNode[];
}

// Interface for referral service configuration
export interface ReferralServiceConfig {
  codeLength?: number;
  codePrefix?: string;
  maxCustomCodeLength?: number;
  maxNetworkDepth?: number;
  rewardAmounts?: Record<RewardType, number>;
  dailyTrackingLimit?: number;
}

/**
 * Referral Service implementation
 */
export class ReferralService {
  private config: ReferralServiceConfig;
  private redis = getRedisClient();
  
  // Default configuration
  private defaultConfig: ReferralServiceConfig = {
    codeLength: 8,
    codePrefix: '',
    maxCustomCodeLength: 20,
    maxNetworkDepth: 3,
    rewardAmounts: {
      signup: 500,
      engagement: 250,
      wallet_connection: 250,
      points_milestone: 500
    },
    dailyTrackingLimit: 100
  };
  
  /**
   * Create a new ReferralService
   */
  constructor(
    private db: Pool,
    private pointsService: PointsService,
    private referralCodeRepository: ReferralCodeRepository,
    private referralTrackingRepository: ReferralTrackingRepository,
    private referralRewardRepository: ReferralRewardRepository,
    config?: Partial<ReferralServiceConfig>
  ) {
    this.config = { ...this.defaultConfig, ...config };
  }
  
  /**
   * Generate a random alphanumeric code
   */
  private generateRandomCode(length: number = 8, prefix: string = ''): string {
    // Define characters to use (alphanumeric without confusing chars like 0/O, 1/I/l)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let code = prefix;
    
    // Generate random string of specified length
    for (let i = 0; i < length - prefix.length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars.charAt(randomIndex);
    }
    
    return code;
  }
  
  /**
   * Validate a custom referral code
   */
  private validateCustomCode(code: string): boolean {
    // Verify length
    if (code.length < 4 || code.length > this.config.maxCustomCodeLength!) {
      return false;
    }
    
    // Check for valid characters (alphanumeric only)
    if (!/^[a-zA-Z0-9]+$/.test(code)) {
      return false;
    }
    
    // Check for reserved words or profanity
    const reservedWords = ['admin', 'system', 'success', 'official'];
    if (reservedWords.some(word => code.toLowerCase().includes(word))) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Hash an IP address for privacy
   */
  private hashIpAddress(ip: string): string {
    return crypto
      .createHash('sha256')
      .update(ip + process.env.IP_HASH_SALT || 'default-salt')
      .digest('hex');
  }
  
  /**
   * Generate a unique referral code
   */
  async generateReferralCode(options: ReferralCodeOptions): Promise<string> {
    const userId = options.userId;
    
    // Handle custom code request
    if (options.customCode) {
      const isValid = this.validateCustomCode(options.customCode);
      if (!isValid) {
        throw new ValidationError('Custom code is invalid', {
          customCode: 'Must be 4-20 alphanumeric characters with no reserved words'
        });
      }
      
      const isUnique = await this.referralCodeRepository.isCodeUnique(options.customCode);
      if (!isUnique) {
        throw new ConflictError('Custom code is already in use');
      }
      
      return options.customCode;
    }
    
    // Generate a unique code with retry logic
    const prefix = options.prefix || this.config.codePrefix || '';
    const length = options.length || this.config.codeLength || 8;
    
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!isUnique && attempts < maxAttempts) {
      code = this.generateRandomCode(length, prefix);
      isUnique = await this.referralCodeRepository.isCodeUnique(code);
      attempts++;
    }
    
    // Fallback to guaranteed unique (but less friendly) code
    if (!isUnique) {
      code = `${prefix}${uuidv4().substring(0, 8)}`;
    }
    
    return code;
  }
  
  /**
   * Create or get a user's referral code
   */
  async getUserReferralCode(userId: string): Promise<{ 
    code: string; 
    isNew: boolean;
    url: string;
  }> {
    try {
      // Check if user already has an active code
      const existingCode = await this.referralCodeRepository.findByUserId(userId);
      
      if (existingCode) {
        return {
          code: existingCode.code,
          isNew: false,
          url: this.buildReferralUrl(existingCode.code)
        };
      }
      
      // Generate new code
      const newCode = await this.generateReferralCode({ userId });
      
      // Create code in database
      await this.referralCodeRepository.createReferralCode({
        user_id: userId,
        code: newCode,
        type: 'standard',
        status: 'active'
      });
      
      return {
        code: newCode,
        isNew: true,
        url: this.buildReferralUrl(newCode)
      };
    } catch (error) {
      logger.error('Error getting user referral code', { error, userId });
      throw error;
    }
  }
  
  /**
   * Create a custom referral code for a user
   */
  async createCustomReferralCode(
    userId: string, 
    customCode: string
  ): Promise<{ 
    code: string; 
    url: string;
  }> {
    try {
      // Validate custom code
      const isValid = this.validateCustomCode(customCode);
      if (!isValid) {
        throw new ValidationError('Custom code is invalid', {
          customCode: 'Must be 4-20 alphanumeric characters with no reserved words'
        });
      }
      
      // Check uniqueness
      const isUnique = await this.referralCodeRepository.isCodeUnique(customCode);
      if (!isUnique) {
        throw new ConflictError('Custom code is already in use');
      }
      
      // Deactivate existing codes
      await this.referralCodeRepository.deactivateAllForUser(userId);
      
      // Create new custom code
      const newCodeRecord = await this.referralCodeRepository.createReferralCode({
        user_id: userId,
        code: customCode,
        type: 'custom',
        status: 'active'
      });
      
      return {
        code: newCodeRecord.code,
        url: this.buildReferralUrl(newCodeRecord.code)
      };
    } catch (error) {
      logger.error('Error creating custom referral code', { error, userId, customCode });
      throw error;
    }
  }
  
  /**
   * Build a referral URL from a code
   */
  private buildReferralUrl(code: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'https://successcommunity.app';
    return `${baseUrl}/join?ref=${code}`;
  }
  
  /**
   * Validate a referral code
   */
  async validateReferralCode(code: string): Promise<{
    isValid: boolean;
    referrerId?: string;
    type?: ReferralCodeType;
    campaignId?: string;
  }> {
    try {
      // Find code in database
      const codeRecord = await this.referralCodeRepository.findByCode(code);
      
      if (!codeRecord) {
        return { isValid: false };
      }
      
      // Check if code is active
      if (codeRecord.status !== 'active') {
        return { isValid: false };
      }
      
      // Check if code is expired
      if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
        return { isValid: false };
      }
      
      return {
        isValid: true,
        referrerId: codeRecord.user_id,
        type: codeRecord.type,
        campaignId: codeRecord.campaign_id || undefined
      };
    } catch (error) {
      logger.error('Error validating referral code', { error, code });
      return { isValid: false };
    }
  }
  
  /**
   * Track a referral link visit
   */
  async trackReferralVisit(
    code: string, 
    visitorData: VisitorData
  ): Promise<boolean> {
    try {
      // Validate code and get referrer info
      const validation = await this.validateReferralCode(code);
      if (!validation.isValid || !validation.referrerId) {
        logger.warn('Invalid referral code tracked', { code });
        return false;
      }
      
      // Check rate limit
      const isRateLimited = await this.checkTrackingRateLimit(validation.referrerId);
      if (isRateLimited) {
        logger.warn('Referral tracking rate limited', { referrerId: validation.referrerId });
        return false;
      }
      
      // Create tracking record
      await this.referralTrackingRepository.createTracking({
        referral_code: code,
        referrer_id: validation.referrerId,
        visitor_id: visitorData.visitor_id,
        ip_hash: this.hashIpAddress(visitorData.ip_address),
        user_agent: visitorData.user_agent,
        landing_page: visitorData.landing_page,
        utm_source: visitorData.utm_source,
        utm_medium: visitorData.utm_medium,
        utm_campaign: visitorData.utm_campaign
      });
      
      // Increment tracking count for rate limiting
      await this.incrementTrackingCount(validation.referrerId);
      
      return true;
    } catch (error) {
      logger.error('Error tracking referral visit', { error, code });
      return false;
    }
  }
  
  /**
   * Check if tracking should be rate limited
   */
  private async checkTrackingRateLimit(referrerId: string): Promise<boolean> {
    const key = `referral:tracking:${referrerId}:${new Date().toISOString().split('T')[0]}`;
    const count = await this.redis.get(key);
    
    return count !== null && parseInt(count, 10) >= this.config.dailyTrackingLimit!;
  }
  
  /**
   * Increment tracking count for rate limiting
   */
  private async incrementTrackingCount(referrerId: string): Promise<void> {
    const key = `referral:tracking:${referrerId}:${new Date().toISOString().split('T')[0]}`;
    await this.redis.incr(key);
    // Set expiry to ensure keys don't accumulate
    await this.redis.expire(key, 86400); // 24 hours
  }
  
  /**
   * Attribute signup to a referrer based on tracking data
   */
  async attributeSignup(
    userId: string,
    visitorId?: string
  ): Promise<ReferralAttributionResult> {
    try {
      // Prevent self-referral by checking before looking up tracking
      if (visitorId) {
        const trackingBySameUser = await this.referralTrackingRepository.findByVisitorId(visitorId);
        if (trackingBySameUser && trackingBySameUser.referrer_id === userId) {
          return {
            success: false,
            error: 'Self-referral is not allowed'
          };
        }
      }
      
      // Find tracking data by visitor ID or IP+UserAgent
      let trackingData = null;
      
      if (visitorId) {
        trackingData = await this.referralTrackingRepository.findByVisitorId(visitorId);
      }
      
      // If no tracking data, try with limited IP+UserAgent data if provided via request object
      // This would require passing request object or headers, which is not in this example
      
      if (!trackingData) {
        return {
          success: false,
          error: 'No referral tracking data found'
        };
      }
      
      // Prevent self-referral
      if (trackingData.referrer_id === userId) {
        return {
          success: false,
          error: 'Self-referral is not allowed'
        };
      }
      
      // Update tracking record with conversion
      const updatedTracking = await this.referralTrackingRepository.recordConversion(
        trackingData.id,
        userId
      );
      
      if (!updatedTracking) {
        return {
          success: false,
          error: 'Failed to record conversion'
        };
      }
      
      // Publish event
      await eventBus.publish(EventType.REFERRAL_ATTRIBUTED, {
        userId,
        referrerId: trackingData.referrer_id,
        referralCode: trackingData.referral_code,
        trackingId: trackingData.id
      });
      
      return {
        success: true,
        referralId: trackingData.id,
        referrerId: trackingData.referrer_id,
        code: trackingData.referral_code
      };
    } catch (error) {
      logger.error('Error attributing signup', { error, userId, visitorId });
      return {
        success: false,
        error: 'Error processing referral attribution'
      };
    }
  }
  
  /**
   * Process referral reward for a specific reward type
   */
  async processReferralReward(
    referralId: string, 
    type: RewardType
  ): Promise<RewardResult> {
    try {
      // Get tracking record
      const tracking = await this.referralTrackingRepository.findById(referralId);
      if (!tracking) {
        return {
          success: false,
          error: 'Referral tracking not found'
        };
      }
      
      if (!tracking.converted_user_id) {
        return {
          success: false,
          error: 'Referral not converted'
        };
      }
      
      // Check if this reward type has already been processed (idempotency)
      const existingReward = await this.referralRewardRepository.findByReferralAndType(referralId, type);
      if (existingReward) {
        return {
          success: false,
          alreadyProcessed: true,
          rewardId: existingReward.id
        };
      }
      
      // Determine reward amount
      const rewardAmount = this.config.rewardAmounts![type];
      
      // Create reward record
      const reward = await this.referralRewardRepository.createReward({
        referral_id: referralId,
        referrer_id: tracking.referrer_id,
        referee_id: tracking.converted_user_id,
        type,
        points_amount: rewardAmount,
        status: 'pending'
      });
      
      // Award points to referrer
      const pointsResult = await this.pointsService.awardPoints(
        tracking.referrer_id,
        rewardAmount,
        'referral',
        {
          referenceId: reward.id,
          description: `Referral reward: ${type}`
        }
      );
      
      if (!pointsResult.success) {
        // Update reward status to rejected if points award fails
        await this.referralRewardRepository.updateStatus(reward.id, 'rejected');
        
        return {
          success: false,
          error: pointsResult.reason || 'Failed to award points'
        };
      }
      
      // Update reward status to processed
      await this.referralRewardRepository.updateStatus(
        reward.id,
        'processed',
        pointsResult.transactionId
      );
      
      // Emit reward event
      await eventBus.publish(EventType.REFERRAL_REWARDED, {
        referralId,
        rewardId: reward.id,
        referrerId: tracking.referrer_id,
        refereeId: tracking.converted_user_id,
        type,
        amount: rewardAmount
      });
      
      return {
        success: true,
        rewardId: reward.id
      };
    } catch (error) {
      logger.error('Error processing referral reward', { error, referralId, type });
      return {
        success: false,
        error: 'Error processing referral reward'
      };
    }
  }
  
  /**
   * Get referral statistics for a user
   */
  async getReferralStatistics(referrerId: string): Promise<ReferralStats> {
    try {
      // Get tracking stats
      const trackingStats = await this.referralTrackingRepository.getReferralStats(referrerId);
      
      // Get reward stats
      const rewardStats = await this.referralRewardRepository.getTotalRewardsForReferrer(referrerId);
      
      // Get reward breakdown by type
      const rewardHistoryQuery = `
        SELECT 
          SUM(CASE WHEN type = 'signup' THEN 1 ELSE 0 END) as signup,
          SUM(CASE WHEN type = 'engagement' THEN 1 ELSE 0 END) as engagement,
          SUM(CASE WHEN type = 'wallet_connection' THEN 1 ELSE 0 END) as wallet_connection,
          SUM(CASE WHEN type = 'points_milestone' THEN 1 ELSE 0 END) as points_milestone
        FROM referral_rewards
        WHERE referrer_id = $1
      `;
      
      const rewardHistoryResult = await this.db.query<{
        signup: string;
        engagement: string;
        wallet_connection: string;
        points_milestone: string;
      }>(rewardHistoryQuery, [referrerId]);
      
      const rewardHistory = rewardHistoryResult.rows[0];
      
      return {
        totalVisits: trackingStats.totalVisits,
        uniqueVisitors: trackingStats.uniqueVisitors,
        conversions: trackingStats.conversions,
        conversionRate: trackingStats.conversionRate,
        totalRewards: rewardStats.totalRewards,
        totalPointsAwarded: rewardStats.totalPoints,
        pendingRewards: rewardStats.pendingPoints,
        rewardsHistory: {
          signup: parseInt(rewardHistory?.signup || '0', 10),
          engagement: parseInt(rewardHistory?.engagement || '0', 10),
          wallet_connection: parseInt(rewardHistory?.wallet_connection || '0', 10),
          points_milestone: parseInt(rewardHistory?.points_milestone || '0', 10)
        }
      };
    } catch (error) {
      logger.error('Error getting referral statistics', { error, referrerId });
      throw error;
    }
  }
  
  /**
   * Get referral conversions for a user
   */
  async getReferralConversions(
    referrerId: string,
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
      const result = await this.referralTrackingRepository.getReferralConversions(
        referrerId,
        options
      );
      
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
      logger.error('Error getting referral conversions', { error, referrerId });
      throw error;
    }
  }
  
  /**
   * Get reward history for a user
   */
  async getRewardHistory(
    referrerId: string,
    options: {
      status?: RewardStatus | RewardStatus[];
      limit?: number;
      offset?: number;
    } = {}
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
      const result = await this.referralRewardRepository.getRewardsForReferrer(
        referrerId,
        options
      );
      
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
      logger.error('Error getting reward history', { error, referrerId });
      throw error;
    }
  }
  
  /**
   * Check if a user was referred
   */
  async wasUserReferred(userId: string): Promise<{
    wasReferred: boolean;
    referrerId?: string;
    referralCode?: string;
  }> {
    try {
      // Find tracking record where this user was converted
      const query = `
        SELECT * FROM referral_tracking
        WHERE converted_user_id = $1
        ORDER BY conversion_date DESC
        LIMIT 1
      `;
      
      const result = await this.db.query(query, [userId]);
      const tracking = result.rows[0];
      
      if (!tracking) {
        return { wasReferred: false };
      }
      
      return {
        wasReferred: true,
        referrerId: tracking.referrer_id,
        referralCode: tracking.referral_code
      };
    } catch (error) {
      logger.error('Error checking if user was referred', { error, userId });
      return { wasReferred: false };
    }
  }
  
  /**
   * Get the referral network for a user
   */
  async getUserReferralNetwork(
    userId: string, 
    levels: number = 1
  ): Promise<ReferralNetwork> {
    try {
      // Limit max depth for performance
      const maxDepth = Math.min(levels, this.config.maxNetworkDepth || 3);
      
      // Base network structure
      const network: ReferralNetwork = {
        userId,
        level: 0,
        children: [],
        totalReferrals: 0,
        activeReferrals: 0
      };
      
      // Get direct referrals from tracking data
      const query = `
        SELECT 
          rt.referrer_id, 
          rt.converted_user_id as referee_id,
          rt.conversion_date as referral_date,
          rt.referral_code,
          u.display_name as referee_name,
          u.status
        FROM referral_tracking rt
        JOIN users u ON rt.converted_user_id = u.id
        WHERE rt.referrer_id = $1 AND rt.converted_user_id IS NOT NULL
        ORDER BY rt.conversion_date DESC
      `;
      
      const result = await this.db.query(query, [userId]);
      
      // Process direct referrals
      for (const row of result.rows) {
        const childNode: ReferralNode = {
          userId: row.referee_id,
          referralDate: row.referral_date,
          level: 1,
          status: row.status,
          children: []
        };
        
        network.children.push(childNode);
        
        // If more levels requested, recursively fetch children
        if (maxDepth > 1) {
          await this.addChildReferrals(childNode, 2, maxDepth);
        }
      }
      
      // Calculate network metrics
      network.totalReferrals = this.countTotalReferrals(network);
      network.activeReferrals = this.countActiveReferrals(network);
      
      return network;
    } catch (error) {
      logger.error('Error getting user referral network', { error, userId, levels });
      throw error;
    }
  }
  
  /**
   * Add child referrals to a node recursively
   */
  private async addChildReferrals(
    node: ReferralNode, 
    currentLevel: number, 
    maxLevel: number
  ): Promise<void> {
    if (currentLevel > maxLevel) {
      return;
    }
    
    // Get referrals for this node
    const query = `
      SELECT 
        rt.referrer_id, 
        rt.converted_user_id as referee_id,
        rt.conversion_date as referral_date,
        rt.referral_code,
        u.display_name as referee_name,
        u.status
      FROM referral_tracking rt
      JOIN users u ON rt.converted_user_id = u.id
      WHERE rt.referrer_id = $1 AND rt.converted_user_id IS NOT NULL
      ORDER BY rt.conversion_date DESC
    `;
    
    const result = await this.db.query(query, [node.userId]);
    
    // Add children to this node
    for (const row of result.rows) {
      const childNode: ReferralNode = {
        userId: row.referee_id,
        referralDate: row.referral_date,
        level: currentLevel,
        status: row.status,
        children: []
      };
      
      node.children.push(childNode);
      
      // Recursively add deeper levels
      if (currentLevel < maxLevel) {
        await this.addChildReferrals(childNode, currentLevel + 1, maxLevel);
      }
    }
  }
  
  /**
   * Count total referrals in a network
   */
  private countTotalReferrals(network: ReferralNetwork | ReferralNode): number {
    let count = 'children' in network ? network.children.length : 0;
    
    for (const child of network.children) {
      count += this.countTotalReferrals(child);
    }
    
    return count;
  }
  
  /**
   * Count active referrals in a network
   */
  private countActiveReferrals(network: ReferralNetwork | ReferralNode): number {
    let count = 0;
    
    for (const child of network.children) {
      if (child.status === 'active') {
        count += 1;
      }
      
      count += this.countActiveReferrals(child);
    }
    
    return count;
  }
}