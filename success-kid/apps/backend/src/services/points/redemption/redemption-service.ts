/**
 * Redemption Service
 * 
 * Service for handling points-to-token redemption with transaction processing,
 * verification, and status tracking.
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../lib/logger';
import { database } from '../../../lib/database';
import { AppError } from '../../../errors/app-error';
import { ErrorCode } from '../../../errors/error-codes';
import { BlockchainService } from '../../blockchain/blockchain-service';
import { eventEmitter } from '../../../lib/event-emitter';
import { redisClient } from '../../../lib/redis-client';

// Redemption types
export interface RedemptionRequest {
  userId: string;
  pointsAmount: number;
}

export interface Redemption {
  id: string;
  userId: string;
  pointsAmount: number;
  tokenAmount: number;
  transactionHash?: string;
  status: RedemptionStatus;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export enum RedemptionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export class RedemptionService {
  // Constants for redemption limits and rates
  private static readonly POINTS_TO_TOKEN_RATIO = 100; // 100 points = 1 token
  private static readonly MIN_REDEMPTION_AMOUNT = 1000; // Minimum 1000 points (10 tokens)
  private static readonly MAX_WEEKLY_REDEMPTION = 10000; // Maximum 10000 points (100 tokens) per week
  
  private blockchainService: BlockchainService;
  
  constructor() {
    this.blockchainService = new BlockchainService();
    
    // Listen for failed transaction events to retry
    this.setupEventListeners();
    
    logger.info('Redemption service initialized');
  }
  
  /**
   * Request a new points-to-token redemption
   */
  async requestRedemption(request: RedemptionRequest): Promise<Redemption> {
    try {
      // Validate request
      await this.validateRedemptionRequest(request);
      
      // Calculate token amount
      const tokenAmount = request.pointsAmount / RedemptionService.POINTS_TO_TOKEN_RATIO;
      
      // Create redemption record
      const redemptionId = uuidv4();
      const redemption: Redemption = {
        id: redemptionId,
        userId: request.userId,
        pointsAmount: request.pointsAmount,
        tokenAmount,
        status: RedemptionStatus.PENDING,
        createdAt: new Date()
      };
      
      // Save to database
      await this.saveRedemption(redemption);
      
      // Deduct points from user
      await this.deductPoints(request.userId, request.pointsAmount, redemptionId);
      
      // Queue redemption for processing
      await this.queueRedemption(redemptionId);
      
      // Return redemption record
      return redemption;
    } catch (error) {
      logger.error('Failed to request redemption', { error, request });
      throw error;
    }
  }
  
  /**
   * Get redemption by ID
   */
  async getRedemption(redemptionId: string): Promise<Redemption | null> {
    try {
      // Fetch from database
      const redemption = await database.redemptions.findUnique({
        where: { id: redemptionId }
      });
      
      if (!redemption) {
        return null;
      }
      
      // Convert to Redemption type
      return {
        id: redemption.id,
        userId: redemption.userId,
        pointsAmount: redemption.pointsAmount,
        tokenAmount: redemption.tokenAmount,
        transactionHash: redemption.transactionHash || undefined,
        status: redemption.status as RedemptionStatus,
        createdAt: redemption.createdAt,
        processedAt: redemption.processedAt || undefined,
        failureReason: redemption.failureReason || undefined
      };
    } catch (error) {
      logger.error('Failed to get redemption', { error, redemptionId });
      throw error;
    }
  }
  
  /**
   * Get user's redemption history
   */
  async getUserRedemptions(userId: string, limit = 10): Promise<Redemption[]> {
    try {
      // Fetch from database
      const redemptions = await database.redemptions.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      // Convert to Redemption type
      return redemptions.map(r => ({
        id: r.id,
        userId: r.userId,
        pointsAmount: r.pointsAmount,
        tokenAmount: r.tokenAmount,
        transactionHash: r.transactionHash || undefined,
        status: r.status as RedemptionStatus,
        createdAt: r.createdAt,
        processedAt: r.processedAt || undefined,
        failureReason: r.failureReason || undefined
      }));
    } catch (error) {
      logger.error('Failed to get user redemptions', { error, userId });
      throw error;
    }
  }
  
  /**
   * Process the redemption (transfer tokens to user)
   */
  async processRedemption(redemptionId: string): Promise<Redemption> {
    try {
      // Get redemption record
      const redemption = await this.getRedemption(redemptionId);
      
      if (!redemption) {
        throw new AppError(
          'Redemption not found',
          ErrorCode.REDEMPTION_NOT_FOUND,
          { redemptionId }
        );
      }
      
      // Check if already processed
      if (redemption.status !== RedemptionStatus.PENDING) {
        logger.warn('Attempting to process non-pending redemption', { redemptionId, status: redemption.status });
        return redemption;
      }
      
      // Update status to processing
      await this.updateRedemptionStatus(
        redemptionId, 
        RedemptionStatus.PROCESSING
      );
      
      // Get user's wallet address
      const user = await database.users.findUnique({
        where: { id: redemption.userId },
        select: { walletAddress: true, walletVerified: true }
      });
      
      if (!user?.walletAddress || !user.walletVerified) {
        // Revert points and fail redemption
        await this.refundPoints(redemption.userId, redemption.pointsAmount, redemptionId);
        
        await this.updateRedemptionStatus(
          redemptionId,
          RedemptionStatus.FAILED,
          'User does not have a verified wallet address'
        );
        
        throw new AppError(
          'User does not have a verified wallet address',
          ErrorCode.WALLET_NOT_VERIFIED,
          { userId: redemption.userId }
        );
      }
      
      // Transfer tokens
      const tokenAmount = redemption.tokenAmount;
      const txHash = await this.blockchainService.transferTokens(
        user.walletAddress,
        tokenAmount
      );
      
      // Update redemption record with transaction hash and status
      const updatedRedemption = await this.updateRedemptionComplete(
        redemptionId,
        txHash
      );
      
      // Emit event for notification
      eventEmitter.emit('redemption:completed', {
        userId: redemption.userId,
        redemptionId,
        pointsAmount: redemption.pointsAmount,
        tokenAmount,
        transactionHash: txHash
      });
      
      logger.info('Redemption processed successfully', { 
        redemptionId, 
        txHash, 
        userId: redemption.userId 
      });
      
      return updatedRedemption;
    } catch (error) {
      logger.error('Failed to process redemption', { error, redemptionId });
      
      // Update redemption status to failed
      try {
        await this.updateRedemptionStatus(
          redemptionId,
          RedemptionStatus.FAILED,
          error.message || 'Unknown error'
        );
      } catch (updateError) {
        logger.error('Failed to update redemption status after failure', { updateError });
      }
      
      // Attempt to refund points
      try {
        const redemption = await this.getRedemption(redemptionId);
        if (redemption) {
          await this.refundPoints(redemption.userId, redemption.pointsAmount, redemptionId);
        }
      } catch (refundError) {
        logger.error('Failed to refund points after redemption failure', { refundError });
      }
      
      throw error;
    }
  }
  
  /**
   * Set up event listeners for handling failed redemptions and retries
   */
  private setupEventListeners(): void {
    // Listen for blockchain transaction verification events
    eventEmitter.on('transaction:verified', async (data) => {
      // Check if this is a redemption transaction
      const { txHash, confirmed } = data;
      
      try {
        // Find redemption by transaction hash
        const redemption = await database.redemptions.findFirst({
          where: { transactionHash: txHash }
        });
        
        if (!redemption) {
          return; // Not a redemption transaction
        }
        
        if (confirmed && redemption.status !== RedemptionStatus.COMPLETED) {
          // Update to completed if confirmed
          await this.updateRedemptionStatus(
            redemption.id,
            RedemptionStatus.COMPLETED
          );
          
          logger.info('Redemption confirmed via transaction verification', { 
            redemptionId: redemption.id, 
            txHash 
          });
        } else if (!confirmed && redemption.status === RedemptionStatus.COMPLETED) {
          // Handle edge case where transaction was reverted
          logger.warn('Completed redemption transaction appears unconfirmed', { 
            redemptionId: redemption.id, 
            txHash 
          });
          
          // Could implement additional handling here
        }
      } catch (error) {
        logger.error('Error handling transaction verification event', { 
          error, 
          txHash 
        });
      }
    });
    
    // Listen for failed redemptions to retry
    eventEmitter.on('redemption:failed', async (data) => {
      const { redemptionId, retryCount = 0 } = data;
      
      // Don't retry more than 3 times
      if (retryCount >= 3) {
        logger.warn('Redemption failed after max retries', { redemptionId, retryCount });
        return;
      }
      
      // Wait exponentially longer for each retry
      const delayMs = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s
      
      logger.info(`Scheduling redemption retry in ${delayMs}ms`, { 
        redemptionId, 
        retryCount 
      });
      
      // Schedule retry
      setTimeout(async () => {
        try {
          // Reset status to pending
          await this.updateRedemptionStatus(
            redemptionId,
            RedemptionStatus.PENDING
          );
          
          // Queue for processing again
          await this.queueRedemption(redemptionId, retryCount + 1);
        } catch (error) {
          logger.error('Failed to schedule redemption retry', { 
            error, 
            redemptionId 
          });
        }
      }, delayMs);
    });
  }
  
  /**
   * Validate a redemption request
   */
  private async validateRedemptionRequest(request: RedemptionRequest): Promise<void> {
    // Check minimum amount
    if (request.pointsAmount < RedemptionService.MIN_REDEMPTION_AMOUNT) {
      throw new AppError(
        `Redemption amount must be at least ${RedemptionService.MIN_REDEMPTION_AMOUNT} points`,
        ErrorCode.REDEMPTION_BELOW_MINIMUM,
        { requested: request.pointsAmount, minimum: RedemptionService.MIN_REDEMPTION_AMOUNT }
      );
    }
    
    // Check if the amount is divisible by the ratio
    if (request.pointsAmount % RedemptionService.POINTS_TO_TOKEN_RATIO !== 0) {
      throw new AppError(
        `Redemption amount must be divisible by ${RedemptionService.POINTS_TO_TOKEN_RATIO}`,
        ErrorCode.REDEMPTION_INVALID_AMOUNT,
        { requested: request.pointsAmount, ratio: RedemptionService.POINTS_TO_TOKEN_RATIO }
      );
    }
    
    // Check user's points balance
    const userPoints = await this.getUserPointsBalance(request.userId);
    
    if (userPoints < request.pointsAmount) {
      throw new AppError(
        'Insufficient points balance',
        ErrorCode.INSUFFICIENT_POINTS,
        { requested: request.pointsAmount, available: userPoints }
      );
    }
    
    // Check weekly redemption limit
    const weeklyRedemption = await this.getUserWeeklyRedemption(request.userId);
    const remainingWeeklyAllowance = RedemptionService.MAX_WEEKLY_REDEMPTION - weeklyRedemption;
    
    if (request.pointsAmount > remainingWeeklyAllowance) {
      throw new AppError(
        `Exceeds weekly redemption limit of ${RedemptionService.MAX_WEEKLY_REDEMPTION} points`,
        ErrorCode.REDEMPTION_LIMIT_EXCEEDED,
        { 
          requested: request.pointsAmount, 
          weeklyLimit: RedemptionService.MAX_WEEKLY_REDEMPTION,
          alreadyRedeemed: weeklyRedemption,
          remaining: remainingWeeklyAllowance
        }
      );
    }
    
    // Check if the user has a verified wallet
    const user = await database.users.findUnique({
      where: { id: request.userId },
      select: { walletAddress: true, walletVerified: true }
    });
    
    if (!user?.walletAddress || !user.walletVerified) {
      throw new AppError(
        'User does not have a verified wallet address',
        ErrorCode.WALLET_NOT_VERIFIED,
        { userId: request.userId }
      );
    }
  }
  
  /**
   * Get user's current points balance
   */
  private async getUserPointsBalance(userId: string): Promise<number> {
    // Query user points from database
    const result = await database.$queryRaw<[{sum: number}]>`
      SELECT COALESCE(SUM(amount), 0) as sum
      FROM user_points
      WHERE user_id = ${userId}
    `;
    
    return parseInt(result[0].sum.toString());
  }
  
  /**
   * Get user's weekly redemption amount
   */
  private async getUserWeeklyRedemption(userId: string): Promise<number> {
    // Calculate date range for current week (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Query redemption sum for the past week
    const redemptions = await database.redemptions.aggregate({
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
        status: { in: [RedemptionStatus.PENDING, RedemptionStatus.PROCESSING, RedemptionStatus.COMPLETED] }
      },
      _sum: { pointsAmount: true }
    });
    
    return redemptions._sum.pointsAmount || 0;
  }
  
  /**
   * Save redemption record to database
   */
  private async saveRedemption(redemption: Redemption): Promise<void> {
    await database.redemptions.create({
      data: {
        id: redemption.id,
        userId: redemption.userId,
        pointsAmount: redemption.pointsAmount,
        tokenAmount: redemption.tokenAmount,
        status: redemption.status,
        createdAt: redemption.createdAt
      }
    });
  }
  
  /**
   * Update redemption status
   */
  private async updateRedemptionStatus(
    redemptionId: string,
    status: RedemptionStatus,
    failureReason?: string
  ): Promise<Redemption> {
    const data: any = { status };
    
    if (status === RedemptionStatus.FAILED && failureReason) {
      data.failureReason = failureReason;
    }
    
    if (status === RedemptionStatus.COMPLETED || status === RedemptionStatus.FAILED) {
      data.processedAt = new Date();
    }
    
    const redemption = await database.redemptions.update({
      where: { id: redemptionId },
      data
    });
    
    // Emit events based on status
    if (status === RedemptionStatus.FAILED) {
      eventEmitter.emit('redemption:failed', { 
        redemptionId,
        userId: redemption.userId,
        pointsAmount: redemption.pointsAmount,
        failureReason
      });
    }
    
    return {
      id: redemption.id,
      userId: redemption.userId,
      pointsAmount: redemption.pointsAmount,
      tokenAmount: redemption.tokenAmount,
      transactionHash: redemption.transactionHash || undefined,
      status: redemption.status as RedemptionStatus,
      createdAt: redemption.createdAt,
      processedAt: redemption.processedAt || undefined,
      failureReason: redemption.failureReason || undefined
    };
  }
  
  /**
   * Update redemption with transaction hash and completed status
   */
  private async updateRedemptionComplete(
    redemptionId: string,
    transactionHash: string
  ): Promise<Redemption> {
    const redemption = await database.redemptions.update({
      where: { id: redemptionId },
      data: {
        status: RedemptionStatus.COMPLETED,
        transactionHash,
        processedAt: new Date()
      }
    });
    
    return {
      id: redemption.id,
      userId: redemption.userId,
      pointsAmount: redemption.pointsAmount,
      tokenAmount: redemption.tokenAmount,
      transactionHash: redemption.transactionHash || undefined,
      status: redemption.status as RedemptionStatus,
      createdAt: redemption.createdAt,
      processedAt: redemption.processedAt || undefined,
      failureReason: redemption.failureReason || undefined
    };
  }
  
  /**
   * Deduct points from user account
   */
  private async deductPoints(
    userId: string,
    amount: number,
    referenceId: string
  ): Promise<void> {
    // Create negative points transaction
    await database.userPoints.create({
      data: {
        userId,
        amount: -amount,
        source: 'redemption',
        referenceId,
        description: `Redeemed ${amount} points for ${amount / RedemptionService.POINTS_TO_TOKEN_RATIO} tokens`
      }
    });
    
    logger.info(`Deducted ${amount} points from user ${userId} for redemption ${referenceId}`);
  }
  
  /**
   * Refund points to user account after failed redemption
   */
  private async refundPoints(
    userId: string,
    amount: number,
    referenceId: string
  ): Promise<void> {
    // Create positive points transaction
    await database.userPoints.create({
      data: {
        userId,
        amount,
        source: 'redemption_refund',
        referenceId,
        description: `Refund for failed redemption of ${amount} points`
      }
    });
    
    logger.info(`Refunded ${amount} points to user ${userId} for failed redemption ${referenceId}`);
  }
  
  /**
   * Queue redemption for processing
   */
  private async queueRedemption(redemptionId: string, retryCount = 0): Promise<void> {
    // In a real implementation, would use a proper job queue
    // For now, use Redis list as a simple queue
    const queueItem = JSON.stringify({
      redemptionId,
      retryCount,
      queuedAt: new Date().toISOString()
    });
    
    await redisClient.lpush('redemption:queue', queueItem);
    
    logger.info(`Queued redemption ${redemptionId} for processing`);
    
    // Start processing loop if not already running
    await this.ensureProcessingLoop();
  }
  
  /**
   * Process items from redemption queue
   */
  private async processQueue(): Promise<boolean> {
    // Get next item from queue
    const item = await redisClient.rpop('redemption:queue');
    
    if (!item) {
      return false; // Queue is empty
    }
    
    try {
      const { redemptionId } = JSON.parse(item);
      
      // Process the redemption
      await this.processRedemption(redemptionId);
      
      return true; // Successfully processed
    } catch (error) {
      logger.error('Error processing redemption from queue', { error, item });
      return true; // Count as processed even if failed
    }
  }
  
  /**
   * Ensure processing loop is running
   */
  private async ensureProcessingLoop(): Promise<void> {
    // Check if processing is already running
    const isRunning = await redisClient.get('redemption:processing');
    
    if (isRunning) {
      return; // Already running
    }
    
    // Set processing flag with 5 minute expiry (in case process crashes)
    await redisClient.set('redemption:processing', '1', 'EX', 300);
    
    // Start processing loop
    this.startProcessingLoop();
  }
  
  /**
   * Start the processing loop
   */
  private async startProcessingLoop(): Promise<void> {
    let processed = false;
    
    try {
      do {
        processed = await this.processQueue();
        
        // If items are being processed, continue immediately
        // Otherwise, wait before checking again
        if (!processed) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Refresh processing lock
        await redisClient.set('redemption:processing', '1', 'EX', 300);
      } while (processed || await this.hasQueueItems());
      
      // No more items to process, release lock
      await redisClient.del('redemption:processing');
    } catch (error) {
      logger.error('Error in redemption processing loop', { error });
      
      // Release lock even on error
      await redisClient.del('redemption:processing');
    }
  }
  
  /**
   * Check if there are items in the queue
   */
  private async hasQueueItems(): Promise<boolean> {
    const length = await redisClient.llen('redemption:queue');
    return length > 0;
  }
}
