/**
 * Redemption Service
 * 
 * Manages the process of redeeming Success Points for SKC tokens,
 * including request validation, transaction processing, and batch management.
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { EnhancedPointsService } from '../points/points-service-enhanced';
import { EventBus, EventType } from '../../lib/event-bus';
import { WalletService } from '../wallet/wallet-service';
import { BlockchainService } from '../blockchain/blockchain-service';
import { 
  CreateRedemptionRequestDto, 
  Redemption, 
  RedemptionStatus,
  REDEMPTION_CONSTANTS 
} from '../../models/entities/redemption.model';
import { 
  ValidationError, 
  InsufficientPointsError, 
  PointsCapExceededError,
  WalletError 
} from '../../errors';
import { redisClient } from '../../lib/redis-client';

/**
 * Redemption request result interface
 */
interface RedemptionRequestResult {
  success: boolean;
  redemption: Redemption;
  message?: string;
}

/**
 * Redemption service implementation
 */
export class RedemptionService {
  /**
   * Create a new RedemptionService
   * 
   * @param redemptionRepository Repository for redemption data
   * @param pointsService Service for managing points
   * @param walletService Service for wallet operations
   * @param blockchainService Service for blockchain operations
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private redemptionRepository: RedemptionRepository,
    private pointsService: EnhancedPointsService,
    private walletService: WalletService,
    private blockchainService: BlockchainService,
    private eventBus: EventBus
  ) {}

  /**
   * Request redemption of points for tokens
   * 
   * @param data Redemption request data
   * @returns Redemption request result
   */
  async requestRedemption(data: CreateRedemptionRequestDto): Promise<Redemption> {
    // Validation
    if (data.pointsAmount < REDEMPTION_CONSTANTS.MINIMUM_AMOUNT) {
      throw new ValidationError(
        `Minimum redemption amount is ${REDEMPTION_CONSTANTS.MINIMUM_AMOUNT} points`
      );
    }
    
    // Check if points amount is a multiple of 100 (for clean token conversion)
    if (data.pointsAmount % 100 !== 0) {
      throw new ValidationError(
        'Points amount must be a multiple of 100 for clean conversion'
      );
    }
    
    // Check if user has a verified wallet or provided one
    let walletAddress = data.walletAddress;
    
    if (!walletAddress) {
      const wallet = await this.walletService.getUserWallet(data.userId);
      if (!wallet) {
        throw new ValidationError('Connected wallet required for redemption');
      }
      
      if (!wallet.isVerified) {
        throw new ValidationError('Wallet must be verified before redemption');
      }
      
      walletAddress = wallet.address;
    }
    
    // Check if user has sufficient points
    const userBalance = await this.pointsService.getUserBalance(data.userId);
    if (userBalance < data.pointsAmount) {
      throw new InsufficientPointsError(
        `Insufficient points: ${userBalance} available, ${data.pointsAmount} requested`
      );
    }
    
    // Check weekly redemption cap
    const weeklyKey = this.getWeeklyRedemptionKey(data.userId);
    const weeklyRedemptions = await redisClient.get(weeklyKey);
    const weeklyTotal = weeklyRedemptions ? parseInt(weeklyRedemptions, 10) : 0;
    
    if (weeklyTotal + data.pointsAmount > REDEMPTION_CONSTANTS.WEEKLY_CAP) {
      const remaining = Math.max(0, REDEMPTION_CONSTANTS.WEEKLY_CAP - weeklyTotal);
      throw new PointsCapExceededError(
        `Weekly redemption cap reached: ${remaining} points remaining this week`
      );
    }
    
    // Create redemption request in the database
    const redemption = await this.redemptionRepository.createRedemptionRequest({
      userId: data.userId,
      pointsAmount: data.pointsAmount,
      walletAddress
    });
    
    // Deduct points from user
    try {
      await this.pointsService.deductPoints({
        userId: data.userId,
        amount: data.pointsAmount,
        source: 'redemption',
        referenceId: redemption.id,
        description: `Redemption of ${data.pointsAmount} points for ${data.pointsAmount / 100} SKC tokens`
      });
      
      // Update weekly redemption tracking
      await this.incrementWeeklyRedemptionCounter(data.userId, data.pointsAmount);
    } catch (error) {
      // If deduction fails, mark redemption as failed
      logger.error('Failed to deduct points for redemption', { redemptionId: redemption.id, error });
      
      await this.redemptionRepository.updateRedemptionStatus({
        id: redemption.id,
        status: 'failed',
        errorMessage: 'Failed to deduct points',
        processedAt: new Date()
      });
      
      throw error;
    }
    
    // Emit event for redemption request
    await this.eventBus.publish(EventType.REDEMPTION_REQUESTED, {
      userId: data.userId,
      redemptionId: redemption.id,
      pointsAmount: data.pointsAmount,
      tokenAmount: data.pointsAmount / REDEMPTION_CONSTANTS.CONVERSION_RATE,
      walletAddress
    });
    
    return redemption;
  }
  
  /**
   * Get user's redemption history
   * 
   * @param userId User ID
   * @param limit Maximum number of redemptions to return
   * @param offset Number of redemptions to skip
   * @returns Array of redemptions
   */
  async getUserRedemptions(userId: string, limit: number = 20, offset: number = 0): Promise<Redemption[]> {
    return this.redemptionRepository.getUserRedemptions(userId, limit, offset);
  }
  
  /**
   * Get redemption by ID
   * 
   * @param id Redemption ID
   * @returns Redemption or null if not found
   */
  async getRedemptionById(id: string): Promise<Redemption | null> {
    return this.redemptionRepository.getRedemptionById(id);
  }
  
  /**
   * Process pending redemptions (called by a scheduled job)
   * 
   * @param batchLimit Maximum number of redemptions to process
   * @returns Processing result
   */
  async processPendingRedemptions(batchLimit: number = 100): Promise<{ 
    success: boolean; 
    processed: number; 
    errors: number;
    batchIds: string[];
  }> {
    try {
      // Count pending redemptions
      const pendingCount = await this.redemptionRepository.countPendingRedemptions();
      
      if (pendingCount === 0) {
        logger.info('No pending redemptions to process');
        return { success: true, processed: 0, errors: 0, batchIds: [] };
      }
      
      logger.info(`Found ${pendingCount} pending redemptions`);
      
      // Get pending redemptions up to the limit
      const pendingRedemptions = await this.redemptionRepository.getPendingRedemptionsForProcessing(
        Math.min(pendingCount, batchLimit)
      );
      
      // Group redemptions by wallet address to optimize blockchain transactions
      const walletGroups = this.groupRedemptionsByWallet(pendingRedemptions);
      
      // Process each wallet group as a batch
      const batchIds: string[] = [];
      let processedCount = 0;
      let errorCount = 0;
      
      for (const [walletAddress, redemptions] of walletGroups.entries()) {
        try {
          // Create a batch
          const { batch } = await this.redemptionRepository.createRedemptionBatch(redemptions);
          batchIds.push(batch.id);
          
          // Calculate total token amount
          const totalTokens = redemptions.reduce((sum, r) => sum + r.token_amount, 0);
          
          // Process the blockchain transaction
          const txHash = await this.blockchainService.transferTokens(
            walletAddress,
            totalTokens
          );
          
          // Update batch status
          await this.redemptionRepository.updateBatchStatus(
            batch.id,
            'completed',
            txHash,
            null
          );
          
          processedCount += redemptions.length;
          
          // Emit event for each redemption
          for (const redemption of redemptions) {
            await this.eventBus.publish(EventType.REDEMPTION_COMPLETED, {
              userId: redemption.user_id,
              redemptionId: redemption.id,
              batchId: batch.id,
              pointsAmount: redemption.points_amount,
              tokenAmount: redemption.token_amount,
              walletAddress: redemption.wallet_address,
              transactionHash: txHash
            });
          }
          
          logger.info(`Successfully processed batch ${batch.id} with ${redemptions.length} redemptions`);
        } catch (error) {
          errorCount += redemptions.length;
          
          logger.error(`Failed to process redemption batch for wallet ${walletAddress}`, { error });
          
          // If we've created a batch but the transaction failed, update the batch status
          if (batchIds.length > 0) {
            const batchId = batchIds[batchIds.length - 1];
            
            await this.redemptionRepository.updateBatchStatus(
              batchId,
              'failed',
              null,
              error instanceof Error ? error.message : 'Unknown error'
            );
            
            // Emit events for failed redemptions
            for (const redemption of redemptions) {
              await this.eventBus.publish(EventType.REDEMPTION_FAILED, {
                userId: redemption.user_id,
                redemptionId: redemption.id,
                batchId,
                pointsAmount: redemption.points_amount,
                tokenAmount: redemption.token_amount,
                walletAddress: redemption.wallet_address,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
      }
      
      return {
        success: errorCount === 0,
        processed: processedCount,
        errors: errorCount,
        batchIds
      };
    } catch (error) {
      logger.error('Error processing pending redemptions', { error });
      throw error;
    }
  }
  
  /**
   * Group redemptions by wallet address
   * 
   * @param redemptions Redemptions to group
   * @returns Map of wallet address to redemptions
   */
  private groupRedemptionsByWallet(redemptions: Redemption[]): Map<string, Redemption[]> {
    const groups = new Map<string, Redemption[]>();
    
    for (const redemption of redemptions) {
      if (!groups.has(redemption.wallet_address)) {
        groups.set(redemption.wallet_address, []);
      }
      
      groups.get(redemption.wallet_address)!.push(redemption);
    }
    
    return groups;
  }
  
  /**
   * Get the Redis key for weekly redemption tracking
   * 
   * @param userId User ID
   * @returns Redis key
   */
  private getWeeklyRedemptionKey(userId: string): string {
    // Get the ISO week
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    // Format: redemption:week:YYYY-WW:userId
    return `redemption:week:${date.getFullYear()}-${String(weekNumber).padStart(2, '0')}:${userId}`;
  }
  
  /**
   * Increment weekly redemption counter
   * 
   * @param userId User ID
   * @param amount Amount to increment
   */
  private async incrementWeeklyRedemptionCounter(userId: string, amount: number): Promise<void> {
    const key = this.getWeeklyRedemptionKey(userId);
    const currentValue = await redisClient.get(key) || '0';
    const newValue = parseInt(currentValue, 10) + amount;
    
    // Set with expiry that matches the end of the week
    const now = new Date();
    const daysUntilMonday = 1 - now.getDay();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (daysUntilMonday <= 0 ? daysUntilMonday + 7 : daysUntilMonday));
    nextMonday.setHours(0, 0, 0, 0);
    
    const expirySeconds = Math.ceil((nextMonday.getTime() - now.getTime()) / 1000) + 3600; // Add 1 hour buffer
    await redisClient.set(key, newValue.toString(), expirySeconds);
  }
  
  /**
   * Manually process a specific redemption (admin feature)
   * 
   * @param redemptionId Redemption ID
   * @returns Processing result
   */
  async manuallyProcessRedemption(redemptionId: string): Promise<Redemption> {
    // Get redemption
    const redemption = await this.redemptionRepository.getRedemptionById(redemptionId);
    
    if (!redemption) {
      throw new Error(`Redemption with ID ${redemptionId} not found`);
    }
    
    if (redemption.status !== 'pending') {
      throw new ValidationError(`Redemption is not in pending state: ${redemption.status}`);
    }
    
    // Create a batch with just this redemption
    const { batch } = await this.redemptionRepository.createRedemptionBatch([redemption]);
    
    try {
      // Process the blockchain transaction
      const txHash = await this.blockchainService.transferTokens(
        redemption.wallet_address,
        redemption.token_amount
      );
      
      // Update batch status
      await this.redemptionRepository.updateBatchStatus(
        batch.id,
        'completed',
        txHash,
        null
      );
      
      // Emit event
      await this.eventBus.publish(EventType.REDEMPTION_COMPLETED, {
        userId: redemption.user_id,
        redemptionId: redemption.id,
        batchId: batch.id,
        pointsAmount: redemption.points_amount,
        tokenAmount: redemption.token_amount,
        walletAddress: redemption.wallet_address,
        transactionHash: txHash
      });
      
      // Return updated redemption
      return this.redemptionRepository.getRedemptionById(redemptionId) as Promise<Redemption>;
    } catch (error) {
      logger.error(`Failed to manually process redemption ${redemptionId}`, { error });
      
      // Update batch status
      await this.redemptionRepository.updateBatchStatus(
        batch.id,
        'failed',
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Emit event
      await this.eventBus.publish(EventType.REDEMPTION_FAILED, {
        userId: redemption.user_id,
        redemptionId: redemption.id,
        batchId: batch.id,
        pointsAmount: redemption.points_amount,
        tokenAmount: redemption.token_amount,
        walletAddress: redemption.wallet_address,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }
  
  /**
   * Cancel a pending redemption and refund points
   * 
   * @param redemptionId Redemption ID
   * @param userId User ID (for authorization)
   * @param isAdmin Whether the caller is an admin
   * @returns Updated redemption
   */
  async cancelRedemption(redemptionId: string, userId: string, isAdmin: boolean = false): Promise<Redemption> {
    // Get redemption
    const redemption = await this.redemptionRepository.getRedemptionById(redemptionId);
    
    if (!redemption) {
      throw new Error(`Redemption with ID ${redemptionId} not found`);
    }
    
    // Check if user is authorized
    if (!isAdmin && redemption.user_id !== userId) {
      throw new ValidationError('Not authorized to cancel this redemption');
    }
    
    // Check if redemption is in a cancellable state
    if (redemption.status !== 'pending') {
      throw new ValidationError(`Cannot cancel redemption in ${redemption.status} state`);
    }
    
    // Update redemption status
    const updatedRedemption = await this.redemptionRepository.updateRedemptionStatus({
      id: redemptionId,
      status: 'cancelled',
      processedAt: new Date()
    });
    
    // Refund points to user
    try {
      await this.pointsService.awardPoints({
        userId: redemption.user_id,
        amount: redemption.points_amount,
        source: 'redemption_refund',
        referenceId: redemptionId,
        description: `Refund for cancelled redemption ${redemptionId}`
      });
      
      // Update weekly redemption counter
      const weeklyKey = this.getWeeklyRedemptionKey(redemption.user_id);
      const weeklyRedemptions = await redisClient.get(weeklyKey);
      
      if (weeklyRedemptions) {
        const weeklyTotal = parseInt(weeklyRedemptions, 10);
        const newTotal = Math.max(0, weeklyTotal - redemption.points_amount);
        await redisClient.set(weeklyKey, newTotal.toString());
      }
      
      // Emit event
      await this.eventBus.publish(EventType.REDEMPTION_CANCELLED, {
        userId: redemption.user_id,
        redemptionId,
        pointsAmount: redemption.points_amount,
        tokenAmount: redemption.token_amount,
        refunded: true
      });
    } catch (error) {
      logger.error(`Failed to refund points for cancelled redemption ${redemptionId}`, { error });
      
      // We don't throw here because the cancellation is still valid
      // Later admin action can handle the refund
      
      // Emit event with refund failure
      await this.eventBus.publish(EventType.REDEMPTION_CANCELLED, {
        userId: redemption.user_id,
        redemptionId,
        pointsAmount: redemption.points_amount,
        tokenAmount: redemption.token_amount,
        refunded: false,
        refundError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return updatedRedemption;
  }
}
