/**
 * Points Service
 * 
 * Core service for the Success Points system, handling points awards, caps
 * enforcement, and points redemption.
 */
import { Pool } from 'pg';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { WalletConnectionRepository } from '../../repositories/wallet-connection-repository';
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { TokenTransferService } from '../blockchain/token-transfer-service';
import { eventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { PointsSource, CreateUserPointsDto } from '../../models/user-points';
import { getRedisClient } from '../../lib/db-client';
import { VerificationService } from './verification-service';
import { CapEnforcementService } from './cap-enforcement-service';
import { RedemptionService, RedemptionStatus, RedemptionRequest, RedemptionRecord } from './redemption-service';

export interface PointsTransactionResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  balance?: number;
  reason?: string;
  remainingCap?: number;
}

export interface PointsConfig {
  dailyLimits: Record<PointsSource, number>;
  defaultDailyLimit: number;
  weeklyRedemptionCap: number;
  minimumRedemptionAmount: number;
  conversionRate: number; // Points to tokens ratio (e.g., 100:1)
  autoApproveThreshold?: number; // Maximum points for auto-approval
  processingTime?: string; // Estimated processing time
}

export class PointsService {
  private defaultConfig: PointsConfig = {
    dailyLimits: {
      content_creation: 200,
      comment: 150,
      upvote_received: 100,
      daily_login: 20,
      achievement: 1000, // Higher since these are rare
      referral: 500,
      profile_completion: 100,
      wallet_connection: 50,
      streak_bonus: 100,
      transfer_in: 0,
      transfer_out: 0,
      redemption: 0,
      special_event: 500,
      admin_adjustment: 0
    },
    defaultDailyLimit: 100,
    weeklyRedemptionCap: 10000, // 10,000 SP per week (100 tokens)
    minimumRedemptionAmount: 1000, // 1,000 SP minimum (10 tokens)
    conversionRate: 100, // 100 SP = 1 token
    autoApproveThreshold: 5000, // Auto-approve redemptions up to 5,000 points (50 tokens)
    processingTime: '24 hours'
  };

  private config: PointsConfig;
  private redis = getRedisClient();
  private verificationService: VerificationService;
  private capEnforcementService: CapEnforcementService;
  private redemptionService: RedemptionService;

  /**
   * Create a new PointsService
   */
  constructor(
    private userPointsRepository: UserPointsRepository,
    private walletConnectionRepository: WalletConnectionRepository,
    private redemptionRepository: RedemptionRepository,
    private tokenTransferService?: TokenTransferService,
    config?: Partial<PointsConfig>,
    private db?: Pool
  ) {
    this.config = { ...this.defaultConfig, ...config };

    // Initialize supporting services
    this.verificationService = new VerificationService(this.userPointsRepository);
    this.capEnforcementService = new CapEnforcementService(
      this.userPointsRepository,
      this.config
    );
    
    // Initialize the redemption service if we have a DB and token transfer service
    if (this.db && this.tokenTransferService) {
      this.redemptionService = new RedemptionService(
        this.db,
        this.userPointsRepository,
        this.walletConnectionRepository,
        this.redemptionRepository,
        this.tokenTransferService,
        {
          conversionRate: this.config.conversionRate,
          minimumRedemptionAmount: this.config.minimumRedemptionAmount,
          weeklyRedemptionCap: this.config.weeklyRedemptionCap,
          autoApproveThreshold: this.config.autoApproveThreshold || 5000,
          processingTime: this.config.processingTime || '24 hours'
        }
      );
    } else {
      // Fallback to the limited redemption service without blockchain capability
      this.redemptionService = new RedemptionService(
        null, // No DB, will use simple in-memory or Redis-based approach
        this.userPointsRepository,
        this.walletConnectionRepository,
        this.redemptionRepository,
        null, // No token transfer service
        {
          conversionRate: this.config.conversionRate,
          minimumRedemptionAmount: this.config.minimumRedemptionAmount,
          weeklyRedemptionCap: this.config.weeklyRedemptionCap,
          autoApproveThreshold: this.config.autoApproveThreshold || 5000,
          processingTime: this.config.processingTime || '24 hours'
        }
      );
      
      logger.warn('Redemption service initialized without blockchain capabilities', {
        hasDb: !!this.db,
        hasTokenTransferService: !!this.tokenTransferService
      });
    }
  }

  /**
   * Award points to a user for platform activity
   * Includes verification and cap enforcement
   */
  async awardPoints(
    userId: string,
    amount: number,
    source: PointsSource,
    options: {
      referenceId?: string;
      description?: string;
      skipVerification?: boolean;
      skipCaps?: boolean;
    } = {}
  ): Promise<PointsTransactionResult> {
    try {
      // Validate input
      if (amount <= 0) {
        return {
          success: false,
          reason: 'Points amount must be positive'
        };
      }

      // Check daily caps unless skipped (for admin actions)
      if (!options.skipCaps) {
        const capCheck = await this.capEnforcementService.checkDailyCap(userId, source, amount);
        if (!capCheck.allowed) {
          return {
            success: false,
            reason: 'Daily cap exceeded',
            remainingCap: capCheck.remaining
          };
        }
      }

      // Verify activity is legitimate unless skipped (for trusted sources)
      if (!options.skipVerification) {
        const verificationResult = await this.verificationService.verifyActivity({
          userId,
          source,
          amount,
          referenceId: options.referenceId
        });

        if (!verificationResult.isValid) {
          // Log suspicious activity but don't reveal detailed reason to user
          logger.warn('Activity verification failed', {
            userId,
            source,
            amount,
            reason: verificationResult.reason
          });
          
          return {
            success: false,
            reason: 'Activity verification failed'
          };
        }
      }

      // Create points transaction
      const transaction = await this.userPointsRepository.awardPoints({
        user_id: userId,
        amount,
        source,
        reference_id: options.referenceId,
        description: options.description
      });

      // Get updated balance
      const balance = await this.userPointsRepository.getUserPointsBalance(userId);

      // Emit event for real-time updates and integrations
      await eventBus.publish(EventType.POINTS_AWARDED, {
        userId,
        amount,
        source,
        referenceId: options.referenceId || transaction.id,
        balance,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        transactionId: transaction.id,
        amount,
        balance
      };
    } catch (error) {
      logger.error('Error awarding points', { error, userId, amount, source });
      
      return {
        success: false,
        reason: 'Internal error processing points'
      };
    }
  }

  /**
   * Deduct points from a user (for redemptions, etc.)
   */
  async deductPoints(
    userId: string,
    amount: number,
    source: PointsSource,
    options: {
      referenceId?: string;
      description?: string;
    } = {}
  ): Promise<PointsTransactionResult> {
    try {
      // Validate input
      if (amount <= 0) {
        return {
          success: false,
          reason: 'Points amount must be positive'
        };
      }

      // Check if user has sufficient balance
      const balance = await this.userPointsRepository.getUserPointsBalance(userId);
      if (balance < amount) {
        return {
          success: false,
          reason: 'Insufficient points balance'
        };
      }

      // Create negative points transaction
      const transaction = await this.userPointsRepository.awardPoints({
        user_id: userId,
        amount: -amount, // Negative to represent deduction
        source,
        reference_id: options.referenceId,
        description: options.description
      });

      // Get updated balance
      const newBalance = await this.userPointsRepository.getUserPointsBalance(userId);

      // Emit event for real-time updates
      if (source === 'redemption') {
        await eventBus.publish(EventType.POINTS_REDEEMED, {
          userId,
          amount,
          referenceId: options.referenceId || transaction.id,
          balance: newBalance,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: true,
        transactionId: transaction.id,
        amount,
        balance: newBalance
      };
    } catch (error) {
      logger.error('Error deducting points', { error, userId, amount, source });
      
      return {
        success: false,
        reason: 'Internal error processing points deduction'
      };
    }
  }

  /**
   * Request redemption of points for tokens
   */
  async requestRedemption(
    userId: string,
    pointsAmount: number,
    walletAddress?: string,
    metadata?: Record<string, any>,
    ip?: string,
    userAgent?: string
  ): Promise<any> {
    return this.redemptionService.requestRedemption({
      userId,
      pointsAmount,
      walletAddress,
      metadata,
      ip,
      userAgent
    });
  }

  /**
   * Get redemption eligibility for a user
   */
  async getRedemptionEligibility(userId: string): Promise<any> {
    return this.redemptionService.getEligibility(userId);
  }

  /**
   * Get redemption status
   */
  async getRedemptionStatus(redemptionId: string): Promise<RedemptionRecord | null> {
    return this.redemptionService.getRedemptionStatus(redemptionId);
  }

  /**
   * Get redemption history
   */
  async getRedemptionHistory(
    userId: string,
    options: { 
      limit?: number; 
      offset?: number;
      status?: RedemptionStatus | RedemptionStatus[];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    data: RedemptionRecord[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }
  }> {
    return this.redemptionService.getRedemptionHistory(userId, options);
  }

  /**
   * Get flagged redemptions
   */
  async getFlaggedRedemptions(
    options: { 
      limit?: number; 
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    data: RedemptionRecord[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }
  }> {
    return this.redemptionService.getFlaggedRedemptions(options);
  }

  /**
   * Review flagged redemption
   */
  async reviewFlaggedRedemption(
    redemptionId: string,
    action: 'approve' | 'reject',
    reason: string,
    reviewerId: string
  ): Promise<RedemptionRecord> {
    return this.redemptionService.reviewFlaggedRedemption(
      redemptionId,
      action,
      reason,
      reviewerId
    );
  }

  /**
   * Get redemption statistics
   */
  async getRedemptionStats(options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    totalRedemptions: number;
    totalPointsRedeemed: number;
    totalTokensDistributed: number;
    successRate: number;
    averageProcessingTime: number;
    statusBreakdown: Record<RedemptionStatus, number>;
  }> {
    return this.redemptionService.getRedemptionStats(options);
  }

  /**
   * Get user points balance
   */
  async getUserBalance(userId: string): Promise<number> {
    return this.userPointsRepository.getUserPointsBalance(userId);
  }

  /**
   * Get user points history
   */
  async getUserHistory(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<any> {
    return this.userPointsRepository.getUserPointsHistory(userId, options);
  }

  /**
   * Get daily caps status for a user
   */
  async getDailyCapsStatus(userId: string): Promise<Record<PointsSource, { used: number; limit: number; remaining: number }>> {
    return this.capEnforcementService.getDailyCapsStatus(userId);
  }

  /**
   * Get user's referral points
   */
  async getUserReferralPoints(userId: string): Promise<number> {
    const referralPoints = await this.userPointsRepository.getPointsBySource(userId, 'referral');
    return referralPoints.reduce((total, transaction) => total + transaction.amount, 0);
  }
}
