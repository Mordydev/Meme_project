/**
 * Redemption Service
 * 
 * Handles the conversion of Success Points to tokens,
 * including validation, transaction processing, and record keeping.
 */
import { v4 as uuidv4 } from 'uuid';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { WalletConnectionRepository } from '../../repositories/wallet-connection-repository';
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { IdempotencyService } from './idempotency-service';
import { RiskScoringService, RiskSeverity } from './risk-scoring-service';
import { TokenTransferService, TransactionStatus } from '../blockchain/token-transfer-service';
import { eventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { getRedisClient } from '../../lib/db-client';
import { Pool } from 'pg';

/**
 * Redemption status enum
 */
export enum RedemptionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  FLAGGED = 'flagged'
}

/**
 * Redemption record interface
 */
export interface RedemptionRecord {
  id: string;
  userId: string;
  pointsAmount: number;
  tokenAmount: number;
  walletAddress: string;
  status: RedemptionStatus;
  requestedAt: Date;
  processedAt?: Date;
  transactionHash?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

/**
 * Eligibility response interface
 */
export interface EligibilityResponse {
  isEligible: boolean;
  requirements: {
    minimumBalance: number;
    walletConnected: boolean;
    verificationComplete: boolean;
  };
  limits: {
    conversionRate: number;
    minimumAmount: number;
    weeklyLimit: number;
    weeklyUsed: number;
    remaining: number;
    resetsAt: string;
  };
  balance: {
    current: number;
    pending: number;
  };
}

/**
 * Redemption request response
 */
export interface RedemptionResponse {
  success: boolean;
  redemptionId?: string;
  status?: RedemptionStatus;
  pointsAmount?: number;
  tokenAmount?: number;
  walletAddress?: string;
  estimatedProcessingTime?: string;
  reason?: string;
}

/**
 * Redemption request interface
 */
export interface RedemptionRequest {
  userId: string;
  pointsAmount: number;
  walletAddress?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  skipValidation?: boolean; // Admin override
  ip?: string;
  userAgent?: string;
}

/**
 * Process result interface
 */
export interface ProcessResult {
  success: boolean;
  status?: RedemptionStatus;
  transactionHash?: string;
  reason?: string;
}

/**
 * Redemption validation result
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  details?: Record<string, any>;
}

/**
 * Service to handle points-to-token redemptions
 */
export class RedemptionService {
  private redis = getRedisClient();
  private idempotencyService: IdempotencyService;
  private riskScoringService: RiskScoringService;
  
  constructor(
    private db: Pool,
    private userPointsRepository: UserPointsRepository,
    private walletConnectionRepository: WalletConnectionRepository,
    private redemptionRepository: RedemptionRepository,
    private tokenTransferService: TokenTransferService,
    private config: {
      conversionRate: number; // Points to tokens ratio (e.g., 100:1)
      minimumRedemptionAmount: number; // Minimum points for redemption (e.g., 1000)
      weeklyRedemptionCap: number; // Maximum weekly redemption (e.g., 10000)
      autoApproveThreshold: number; // Maximum points for auto-approval (e.g., 5000)
      processingTime: string; // Estimated processing time (e.g., "24 hours")
    }
  ) {
    this.idempotencyService = new IdempotencyService({
      keyPrefix: 'redemption:',
      defaultTtl: 60 * 60 * 24 * 7 // 7 days
    });
    
    this.riskScoringService = new RiskScoringService(
      userPointsRepository,
      redemptionRepository
    );
  }

  /**
   * Request redemption of points for tokens
   * 
   * @param request - Redemption request details
   * @returns Redemption response
   */
  async requestRedemption(request: RedemptionRequest): Promise<RedemptionResponse> {
    const { userId, pointsAmount, walletAddress, referenceId, metadata } = request;
    const idempotencyKey = referenceId || `${userId}:${Date.now()}`;
    
    try {
      // Check for duplicate request
      const existingOperation = await this.idempotencyService.getOperationResult(idempotencyKey);
      if (existingOperation) {
        logger.info('Returning existing redemption result', { 
          userId, 
          idempotencyKey,
          result: existingOperation.result
        });
        return existingOperation.result as RedemptionResponse;
      }
      
      // Start idempotent operation
      const canProceed = await this.idempotencyService.beginOperation(idempotencyKey);
      if (!canProceed) {
        return {
          success: false,
          reason: 'Redemption already in progress. Please wait for it to complete.'
        };
      }
      
      // Validate request
      if (!request.skipValidation) {
        const validationResult = await this.validateRedemptionRequest(request);
        if (!validationResult.isValid) {
          await this.idempotencyService.failOperation(
            idempotencyKey, 
            new Error(validationResult.reason || 'Validation failed')
          );
          
          return {
            success: false,
            reason: validationResult.reason || 'Invalid redemption request'
          };
        }
      }
      
      // Get wallet address if not provided
      let finalWalletAddress = walletAddress;
      if (!finalWalletAddress) {
        const walletConnections = await this.walletConnectionRepository.findByUserId(userId);
        if (walletConnections.length === 0) {
          await this.idempotencyService.failOperation(
            idempotencyKey, 
            new Error('No wallet connected. Please connect a wallet to redeem points.')
          );
          
          return {
            success: false,
            reason: 'No wallet connected. Please connect a wallet to redeem points.'
          };
        }
        finalWalletAddress = walletConnections[0].wallet_address;
      }
      
      // Perform risk assessment
      if (!request.skipValidation) {
        const riskAssessment = await this.riskScoringService.analyzeRedemptionRequest({
          userId,
          amount: pointsAmount,
          walletAddress: finalWalletAddress,
          ip: request.ip,
          userAgent: request.userAgent,
          referenceId
        });
        
        // Block high-risk redemptions
        if (riskAssessment.recommendation === 'block') {
          await this.idempotencyService.failOperation(
            idempotencyKey, 
            new Error('Redemption blocked due to security concerns')
          );
          
          logger.warn('Blocked high-risk redemption', {
            userId,
            pointsAmount,
            walletAddress: finalWalletAddress,
            riskScore: riskAssessment.riskScore,
            riskLevel: riskAssessment.riskLevel
          });
          
          return {
            success: false,
            reason: 'Redemption request flagged for security review. Please contact support.'
          };
        }
      }
      
      // Calculate token amount
      const tokenAmount = pointsAmount / this.config.conversionRate;
      
      // Use database transaction for consistency
      return await this.db.query('BEGIN').then(async () => {
        try {
          // Create redemption record
          const redemptionStatus = !request.skipValidation && pointsAmount > this.config.autoApproveThreshold
            ? RedemptionStatus.FLAGGED // Flag large redemptions for review
            : RedemptionStatus.PENDING;
          
          const redemption = await this.redemptionRepository.createRedemptionWithTransaction(
            this.db.query.client,
            {
              user_id: userId,
              points_amount: pointsAmount,
              token_amount: tokenAmount,
              wallet_address: finalWalletAddress,
              status: redemptionStatus,
              metadata: metadata || {}
            }
          );
          
          // Deduct points
          await this.userPointsRepository.awardPointsWithTransaction(
            this.db.query.client,
            {
              user_id: userId,
              amount: -pointsAmount,
              source: 'redemption',
              reference_id: redemption.id,
              description: `Redemption request for ${tokenAmount} tokens`
            }
          );
          
          // Commit transaction
          await this.db.query('COMMIT');
          
          // Queue for processing if not flagged
          if (redemptionStatus === RedemptionStatus.PENDING) {
            await this.redis.lpush('redemption:queue', redemption.id);
          }
          
          // Publish event for real-time updates
          await eventBus.publish(EventType.POINTS_REDEEMED, {
            userId,
            pointsAmount,
            tokenAmount,
            redemptionId: redemption.id,
            walletAddress: finalWalletAddress,
            status: redemptionStatus,
            timestamp: new Date().toISOString()
          });
          
          const response: RedemptionResponse = {
            success: true,
            redemptionId: redemption.id,
            status: redemptionStatus,
            pointsAmount,
            tokenAmount,
            walletAddress: finalWalletAddress,
            estimatedProcessingTime: this.config.processingTime
          };
          
          // Store result for idempotency
          await this.idempotencyService.completeOperation(idempotencyKey, response);
          
          return response;
        } catch (error) {
          // Rollback transaction on error
          await this.db.query('ROLLBACK');
          throw error;
        }
      });
    } catch (error) {
      logger.error('Error processing redemption request', { 
        error, 
        userId, 
        pointsAmount 
      });
      
      // Mark operation as failed
      await this.idempotencyService.failOperation(
        idempotencyKey,
        error instanceof Error ? error : new Error(String(error))
      );
      
      return {
        success: false,
        reason: 'An error occurred processing your redemption request'
      };
    }
  }

  /**
   * Validate redemption request
   * 
   * @param request - Redemption request to validate
   * @returns Validation result
   */
  private async validateRedemptionRequest(request: RedemptionRequest): Promise<ValidationResult> {
    try {
      const { userId, pointsAmount, walletAddress } = request;
      
      // Validate amount
      if (pointsAmount < this.config.minimumRedemptionAmount) {
        return {
          isValid: false,
          reason: `Minimum redemption amount is ${this.config.minimumRedemptionAmount} points`
        };
      }
      
      // Check if user has sufficient balance
      const balance = await this.userPointsRepository.getUserPointsBalance(userId);
      if (balance < pointsAmount) {
        return {
          isValid: false,
          reason: 'Insufficient points balance',
          details: { balance, required: pointsAmount }
        };
      }
      
      // Check weekly redemption cap
      const redeemedThisWeek = await this.userPointsRepository.getPointsRedeemedThisWeek(userId);
      if (redeemedThisWeek + pointsAmount > this.config.weeklyRedemptionCap) {
        return {
          isValid: false,
          reason: `Weekly redemption cap of ${this.config.weeklyRedemptionCap} points exceeded`,
          details: { used: redeemedThisWeek, remaining: this.config.weeklyRedemptionCap - redeemedThisWeek }
        };
      }
      
      // Verify wallet if provided
      if (walletAddress) {
        const verifiedWallet = await this.walletConnectionRepository.findByAddress(walletAddress);
        if (!verifiedWallet || verifiedWallet.user_id !== userId) {
          return {
            isValid: false,
            reason: 'Wallet address not verified for this user'
          };
        }
      } else {
        // Check if user has any connected wallet
        const walletConnections = await this.walletConnectionRepository.findByUserId(userId);
        if (walletConnections.length === 0) {
          return {
            isValid: false,
            reason: 'No wallet connected. Please connect a wallet to redeem points.'
          };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      logger.error('Error validating redemption request', { error, request });
      return {
        isValid: false,
        reason: 'Error validating request'
      };
    }
  }

  /**
   * Process a redemption transaction
   * 
   * @param redemptionId - Redemption ID to process
   * @returns Processing result
   */
  async processRedemption(redemptionId: string): Promise<ProcessResult> {
    const idempotencyKey = `process:${redemptionId}`;
    
    try {
      // Check for duplicate processing
      const existingResult = await this.idempotencyService.getOperationResult(idempotencyKey);
      if (existingResult) {
        return existingResult.result as ProcessResult;
      }
      
      // Start idempotent operation
      const canProceed = await this.idempotencyService.beginOperation(idempotencyKey);
      if (!canProceed) {
        return {
          success: false,
          reason: 'Processing already in progress'
        };
      }
      
      // Get redemption record
      const redemption = await this.redemptionRepository.findById(redemptionId);
      if (!redemption) {
        await this.idempotencyService.failOperation(
          idempotencyKey,
          new Error('Redemption not found')
        );
        
        return {
          success: false,
          reason: 'Redemption not found'
        };
      }
      
      // Validate state
      if (redemption.status !== RedemptionStatus.PENDING) {
        const result = {
          success: false,
          status: redemption.status,
          reason: `Invalid status: ${redemption.status}`
        };
        
        await this.idempotencyService.completeOperation(idempotencyKey, result);
        return result;
      }
      
      // Update status to processing
      await this.redemptionRepository.updateStatus(redemptionId, RedemptionStatus.PROCESSING);
      
      // Publish status update event
      await eventBus.publish(EventType.POINTS_REDEEMED, {
        userId: redemption.userId,
        redemptionId,
        status: RedemptionStatus.PROCESSING,
        timestamp: new Date().toISOString()
      });
      
      try {
        // Initiate blockchain transaction
        const txHash = await this.tokenTransferService.transferTokens(
          redemption.walletAddress,
          redemption.tokenAmount
        );
        
        // Record transaction hash
        await this.redemptionRepository.updateTransactionHash(redemptionId, txHash);
        
        // Wait for confirmation (with timeout)
        const confirmed = await this.tokenTransferService.waitForConfirmation(txHash);
        
        if (confirmed) {
          // Update status to completed
          await this.redemptionRepository.updateStatus(redemptionId, RedemptionStatus.COMPLETED, {
            transactionHash: txHash,
            processedAt: new Date()
          });
          
          // Publish completion event
          await eventBus.publish(EventType.POINTS_REDEEMED, {
            userId: redemption.userId,
            redemptionId,
            status: RedemptionStatus.COMPLETED,
            transactionHash: txHash,
            timestamp: new Date().toISOString()
          });
          
          const result = { 
            success: true, 
            status: RedemptionStatus.COMPLETED,
            transactionHash: txHash 
          };
          
          await this.idempotencyService.completeOperation(idempotencyKey, result);
          return result;
        } else {
          // Transaction not confirmed in time, but still pending
          // This is not a failure - we'll check status later
          const result = { 
            success: true, 
            status: RedemptionStatus.PROCESSING,
            transactionHash: txHash 
          };
          
          await this.idempotencyService.completeOperation(idempotencyKey, result);
          return result;
        }
      } catch (error) {
        // Update status to failed
        await this.redemptionRepository.updateStatus(
          redemptionId, 
          RedemptionStatus.FAILED, 
          { 
            failureReason: error.message || 'Unknown error'
          }
        );
        
        // Publish failure event
        await eventBus.publish(EventType.POINTS_REDEEMED, {
          userId: redemption.userId,
          redemptionId,
          status: RedemptionStatus.FAILED,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        const result = { 
          success: false, 
          status: RedemptionStatus.FAILED,
          reason: error.message || 'Transaction processing failed'
        };
        
        await this.idempotencyService.failOperation(idempotencyKey, error);
        return result;
      }
    } catch (error) {
      logger.error('Error processing redemption', { error, redemptionId });
      
      // Try to update redemption status if possible
      try {
        const redemption = await this.redemptionRepository.findById(redemptionId);
        if (redemption && redemption.status === RedemptionStatus.PROCESSING) {
          await this.redemptionRepository.updateStatus(
            redemptionId, 
            RedemptionStatus.FAILED, 
            { 
              failureReason: error.message || 'Unknown error'
            }
          );
        }
      } catch (updateError) {
        logger.error('Error updating failed redemption status', { 
          error: updateError, 
          redemptionId
        });
      }
      
      const result = { 
        success: false, 
        reason: error.message || 'Error processing redemption'
      };
      
      await this.idempotencyService.failOperation(idempotencyKey, error);
      return result;
    }
  }

  /**
   * Check transaction status and update redemption accordingly
   * 
   * @param redemptionId - Redemption ID to check
   * @returns Updated redemption record
   */
  async checkTransactionStatus(redemptionId: string): Promise<RedemptionRecord> {
    try {
      // Get redemption record
      const redemption = await this.redemptionRepository.findById(redemptionId);
      if (!redemption) {
        throw new Error('Redemption not found');
      }
      
      // Skip if not in processing state or no transaction hash
      if (redemption.status !== RedemptionStatus.PROCESSING || !redemption.transactionHash) {
        return redemption;
      }
      
      // Get transaction status
      const txStatus = await this.tokenTransferService.getTransactionStatus(redemption.transactionHash);
      
      if (!txStatus) {
        // Transaction not found, no change
        return redemption;
      }
      
      if (txStatus.status === TransactionStatus.CONFIRMED) {
        // Update to completed
        return await this.redemptionRepository.updateStatus(
          redemptionId,
          RedemptionStatus.COMPLETED,
          {
            processedAt: new Date()
          }
        );
      } else if (txStatus.status === TransactionStatus.FAILED) {
        // Update to failed
        return await this.redemptionRepository.updateStatus(
          redemptionId,
          RedemptionStatus.FAILED,
          {
            failureReason: 'Blockchain transaction failed'
          }
        );
      }
      
      // Still processing, no change
      return redemption;
    } catch (error) {
      logger.error('Error checking transaction status', { error, redemptionId });
      throw error;
    }
  }

  /**
   * Review flagged redemption
   * 
   * @param redemptionId - Redemption ID to review
   * @param action - Action to take (approve or reject)
   * @param reason - Reason for the decision
   * @param reviewerId - ID of the reviewer
   * @returns Updated redemption record
   */
  async reviewFlaggedRedemption(
    redemptionId: string,
    action: 'approve' | 'reject',
    reason: string,
    reviewerId: string
  ): Promise<RedemptionRecord> {
    try {
      // Get redemption record
      const redemption = await this.redemptionRepository.findById(redemptionId);
      if (!redemption) {
        throw new Error('Redemption not found');
      }
      
      // Verify it's in flagged status
      if (redemption.status !== RedemptionStatus.FLAGGED) {
        throw new Error(`Redemption not in flagged status: ${redemption.status}`);
      }
      
      if (action === 'approve') {
        // Add to processing queue
        await this.redis.lpush('redemption:queue', redemptionId);
        
        // Update status to pending
        const updated = await this.redemptionRepository.updateStatus(
          redemptionId,
          RedemptionStatus.PENDING,
          {
            metadata: {
              review: {
                action: 'approve',
                reason,
                reviewerId,
                timestamp: new Date().toISOString()
              }
            }
          }
        );
        
        // Publish event
        await eventBus.publish(EventType.POINTS_REDEEMED, {
          userId: redemption.userId,
          redemptionId,
          status: RedemptionStatus.PENDING,
          timestamp: new Date().toISOString(),
          metadata: { reviewAction: 'approve' }
        });
        
        return updated;
      } else {
        // Reject and refund points
        await this.db.query('BEGIN');
        
        try {
          // Update to failed status
          const updated = await this.redemptionRepository.updateStatus(
            redemptionId,
            RedemptionStatus.FAILED,
            {
              failureReason: reason,
              metadata: {
                review: {
                  action: 'reject',
                  reason,
                  reviewerId,
                  timestamp: new Date().toISOString()
                }
              }
            }
          );
          
          // Refund points
          await this.userPointsRepository.awardPoints({
            user_id: redemption.userId,
            amount: redemption.pointsAmount, // Positive for refund
            source: 'redemption',
            reference_id: `refund:${redemptionId}`,
            description: `Refund for rejected redemption: ${reason}`
          });
          
          await this.db.query('COMMIT');
          
          // Publish event
          await eventBus.publish(EventType.POINTS_REDEEMED, {
            userId: redemption.userId,
            redemptionId,
            status: RedemptionStatus.FAILED,
            timestamp: new Date().toISOString(),
            metadata: { 
              reviewAction: 'reject',
              reason,
              refunded: true
            }
          });
          
          return updated;
        } catch (error) {
          await this.db.query('ROLLBACK');
          throw error;
        }
      }
    } catch (error) {
      logger.error('Error reviewing redemption', { error, redemptionId, action });
      throw error;
    }
  }

  /**
   * Get user's redemption eligibility
   * 
   * @param userId - User ID to check
   * @returns Eligibility response
   */
  async getEligibility(userId: string): Promise<EligibilityResponse> {
    try {
      // Get user's points balance
      const balance = await this.userPointsRepository.getUserPointsBalance(userId);
      
      // Get wallet connection status
      const walletConnections = await this.walletConnectionRepository.findByUserId(userId);
      const walletConnected = walletConnections.length > 0;
      const verificationComplete = walletConnections.some(wc => wc.is_verified);
      
      // Get points redeemed this week
      const redeemedThisWeek = await this.userPointsRepository.getPointsRedeemedThisWeek(userId);
      
      // Get pending redemptions
      const pendingRedemptions = await this.redemptionRepository.findByUserId(userId, {
        status: [RedemptionStatus.PENDING, RedemptionStatus.PROCESSING, RedemptionStatus.FLAGGED]
      });
      
      const pendingAmount = pendingRedemptions.reduce((sum, r) => sum + r.pointsAmount, 0);
      
      // Calculate when weekly limit resets
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const daysUntilSunday = (7 - dayOfWeek) % 7;
      const resetsAt = new Date(now);
      resetsAt.setUTCDate(now.getUTCDate() + daysUntilSunday);
      resetsAt.setUTCHours(0, 0, 0, 0);
      
      // Check if eligible
      const isEligible = 
        balance >= this.config.minimumRedemptionAmount &&
        walletConnected &&
        redeemedThisWeek < this.config.weeklyRedemptionCap;
      
      return {
        isEligible,
        requirements: {
          minimumBalance: this.config.minimumRedemptionAmount,
          walletConnected,
          verificationComplete
        },
        limits: {
          conversionRate: this.config.conversionRate,
          minimumAmount: this.config.minimumRedemptionAmount,
          weeklyLimit: this.config.weeklyRedemptionCap,
          weeklyUsed: redeemedThisWeek,
          remaining: Math.max(0, this.config.weeklyRedemptionCap - redeemedThisWeek),
          resetsAt: resetsAt.toISOString()
        },
        balance: {
          current: balance,
          pending: pendingAmount
        }
      };
    } catch (error) {
      logger.error('Error getting redemption eligibility', { error, userId });
      
      // Return default response on error
      return {
        isEligible: false,
        requirements: {
          minimumBalance: this.config.minimumRedemptionAmount,
          walletConnected: false,
          verificationComplete: false
        },
        limits: {
          conversionRate: this.config.conversionRate,
          minimumAmount: this.config.minimumRedemptionAmount,
          weeklyLimit: this.config.weeklyRedemptionCap,
          weeklyUsed: 0,
          remaining: this.config.weeklyRedemptionCap,
          resetsAt: new Date().toISOString()
        },
        balance: {
          current: 0,
          pending: 0
        }
      };
    }
  }

  /**
   * Get redemption status by ID
   * 
   * @param redemptionId - Redemption ID
   * @returns Redemption record or null
   */
  async getRedemptionStatus(redemptionId: string): Promise<RedemptionRecord | null> {
    try {
      const redemption = await this.redemptionRepository.findById(redemptionId);
      
      // If processing, check blockchain status for updates
      if (redemption && redemption.status === RedemptionStatus.PROCESSING && redemption.transactionHash) {
        return await this.checkTransactionStatus(redemptionId);
      }
      
      return redemption;
    } catch (error) {
      logger.error('Error getting redemption status', { error, redemptionId });
      return null;
    }
  }

  /**
   * Get user's redemption history
   * 
   * @param userId - User ID
   * @param options - Query options
   * @returns Paginated redemption records
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
    try {
      // Convert options to query
      const query = {
        userId,
        ...options
      };
      
      // Get redemptions and count
      const [redemptions, total] = await Promise.all([
        this.redemptionRepository.findByQuery(query),
        this.redemptionRepository.countByQuery({
          userId,
          status: options.status,
          startDate: options.startDate,
          endDate: options.endDate
        })
      ]);
      
      // Update processing status for any in-progress redemptions
      const updatedRedemptions = await Promise.all(
        redemptions.map(async (redemption) => {
          if (redemption.status === RedemptionStatus.PROCESSING && redemption.transactionHash) {
            try {
              const txStatus = await this.tokenTransferService.getTransactionStatus(redemption.transactionHash);
              if (txStatus && txStatus.status === TransactionStatus.CONFIRMED) {
                await this.redemptionRepository.updateStatus(redemption.id, RedemptionStatus.COMPLETED, {
                  processedAt: new Date()
                });
                redemption.status = RedemptionStatus.COMPLETED;
                redemption.processedAt = new Date();
              } else if (txStatus && txStatus.status === TransactionStatus.FAILED) {
                await this.redemptionRepository.updateStatus(redemption.id, RedemptionStatus.FAILED, {
                  failureReason: 'Blockchain transaction failed'
                });
                redemption.status = RedemptionStatus.FAILED;
                redemption.failureReason = 'Blockchain transaction failed';
              }
            } catch (error) {
              logger.error('Error checking transaction status during history fetch', {
                error,
                redemptionId: redemption.id,
                txHash: redemption.transactionHash
              });
            }
          }
          return redemption;
        })
      );
      
      return {
        data: updatedRedemptions,
        pagination: {
          total,
          limit: options.limit || 20,
          offset: options.offset || 0,
          hasMore: (options.offset || 0) + redemptions.length < total
        }
      };
    } catch (error) {
      logger.error('Error getting redemption history', { error, userId, options });
      return {
        data: [],
        pagination: {
          total: 0,
          limit: options.limit || 20,
          offset: options.offset || 0,
          hasMore: false
        }
      };
    }
  }

  /**
   * Get flagged redemptions for review
   * 
   * @param options - Query options
   * @returns Paginated redemption records
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
    try {
      // Convert options to query
      const query = {
        status: RedemptionStatus.FLAGGED,
        ...options
      };
      
      // Get redemptions and count
      const [redemptions, total] = await Promise.all([
        this.redemptionRepository.findByQuery(query),
        this.redemptionRepository.countByQuery({
          status: RedemptionStatus.FLAGGED,
          startDate: options.startDate,
          endDate: options.endDate
        })
      ]);
      
      return {
        data: redemptions,
        pagination: {
          total,
          limit: options.limit || 20,
          offset: options.offset || 0,
          hasMore: (options.offset || 0) + redemptions.length < total
        }
      };
    } catch (error) {
      logger.error('Error getting flagged redemptions', { error, options });
      return {
        data: [],
        pagination: {
          total: 0,
          limit: options.limit || 20,
          offset: options.offset || 0,
          hasMore: false
        }
      };
    }
  }

  /**
   * Get redemption statistics
   * 
   * @param options - Query options
   * @returns Redemption statistics
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
    try {
      // Build query
      const query = {
        ...options
      };
      
      // Get all redemptions in time period
      const redemptions = await this.redemptionRepository.findByQuery({
        ...query,
        limit: 1000000 // High limit to get all
      });
      
      // Calculate statistics
      const totalRedemptions = redemptions.length;
      const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + r.pointsAmount, 0);
      const totalTokensDistributed = redemptions.reduce((sum, r) => sum + r.tokenAmount, 0);
      
      // Calculate success rate
      const completedRedemptions = redemptions.filter(r => r.status === RedemptionStatus.COMPLETED);
      const successRate = totalRedemptions > 0 
        ? (completedRedemptions.length / totalRedemptions) * 100 
        : 0;
      
      // Calculate average processing time for completed redemptions
      const processingTimes = completedRedemptions
        .filter(r => r.processedAt && r.requestedAt)
        .map(r => r.processedAt.getTime() - r.requestedAt.getTime());
      
      const averageProcessingTime = processingTimes.length > 0 
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
        : 0;
      
      // Calculate status breakdown
      const statusBreakdown = {
        [RedemptionStatus.PENDING]: 0,
        [RedemptionStatus.PROCESSING]: 0,
        [RedemptionStatus.COMPLETED]: 0,
        [RedemptionStatus.FAILED]: 0,
        [RedemptionStatus.FLAGGED]: 0
      };
      
      redemptions.forEach(r => {
        statusBreakdown[r.status]++;
      });
      
      return {
        totalRedemptions,
        totalPointsRedeemed,
        totalTokensDistributed,
        successRate,
        averageProcessingTime,
        statusBreakdown
      };
    } catch (error) {
      logger.error('Error getting redemption stats', { error, options });
      throw error;
    }
  }
}
