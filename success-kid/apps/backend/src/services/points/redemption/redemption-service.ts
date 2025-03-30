/**
 * Redemption Service
 * 
 * Handles the redemption of Success Points for SKC tokens,
 * including validation, processing, and status tracking.
 */
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { logger } from '../../../lib/logger';
import { RedemptionRepository } from '../../../repositories/redemption-repository';
import { EventBus, EventType } from '../../../lib/event-bus';
import { EnhancedPointsService } from '../points-service-enhanced';
import { RedisService } from '../../../lib/redis-service';
import { RedemptionJobPublisher } from './jobs/redemption-job-publisher';
import { 
  ValidationError, 
  InsufficientPointsError, 
  RedemptionFailedError,
  WalletConnectionError
} from '../../../errors';

/**
 * Redemption request interface
 */
export interface RedemptionRequest {
  userId: string;
  pointsAmount: number;
  walletAddress: string;
}

/**
 * Redemption status type
 */
export type RedemptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Redemption details interface
 */
export interface Redemption {
  id: string;
  userId: string;
  pointsAmount: number;
  tokenAmount: number;
  walletAddress: string;
  status: RedemptionStatus;
  createdAt: Date;
  processedAt?: Date;
  transactionHash?: string;
  errorMessage?: string;
}

/**
 * Constants
 */
const CONVERSION_RATE = 100; // 100 SP = 1 SKC
const MINIMUM_REDEMPTION = 1000; // 1000 SP = 10 SKC
const WEEKLY_REDEMPTION_CAP = 10000; // 10,000 SP = 100 SKC per week

/**
 * Service for handling points-to-token redemptions
 */
export class RedemptionService {
  /**
   * Create a new RedemptionService
   * 
   * @param db Database connection pool
   * @param redemptionRepository Redemption repository for database operations
   * @param eventBus Event bus for publishing events
   * @param pointsService Points service for point operations
   * @param redisService Redis service for caching/locking
   * @param jobPublisher Service to publish redemption jobs
   */
  constructor(
    private db: Pool,
    private redemptionRepository: RedemptionRepository,
    private eventBus: EventBus,
    private pointsService: EnhancedPointsService,
    private redisService: RedisService,
    private jobPublisher: RedemptionJobPublisher
  ) {}
  
  /**
   * Request a redemption of points for tokens
   * 
   * @param request Redemption request
   * @returns Redemption result
   */
  async requestRedemption(request: RedemptionRequest): Promise<Redemption> {
    // Validate request
    this.validateRedemptionRequest(request);
    
    // Check if user has wallet connected (we should have a separate wallet service)
    // For now, we'll just validate that the wallet address is provided
    if (!request.walletAddress) {
      throw new WalletConnectionError('Wallet address is required for redemption');
    }
    
    // Calculate token amount
    const tokenAmount = request.pointsAmount / CONVERSION_RATE;
    
    return this.db.query('BEGIN').then(async () => {
      try {
        // Check user balance
        const balance = await this.pointsService.getUserBalance(request.userId);
        if (balance < request.pointsAmount) {
          throw new InsufficientPointsError(
            `Insufficient points balance: ${balance} available, ${request.pointsAmount} required`
          );
        }
        
        // Check weekly redemption cap
        const weeklyRedemption = await this.getWeeklyRedemptionTotal(request.userId);
        if (weeklyRedemption + request.pointsAmount > WEEKLY_REDEMPTION_CAP) {
          throw new ValidationError(
            `Weekly redemption cap exceeded: ${weeklyRedemption} used, ${WEEKLY_REDEMPTION_CAP} limit`
          );
        }
        
        // Create redemption record
        const redemptionId = uuidv4();
        const result = await this.db.query<Redemption>(
          `INSERT INTO redemptions (
            id, user_id, points_amount, token_amount, wallet_address, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING *`,
          [
            redemptionId,
            request.userId,
            request.pointsAmount,
            tokenAmount,
            request.walletAddress,
            'pending'
          ]
        );
        
        // Deduct points from user balance
        await this.pointsService.deductPoints({
          userId: request.userId,
          amount: request.pointsAmount,
          source: 'redemption',
          referenceId: redemptionId,
          description: `Redeemed ${request.pointsAmount} points for ${tokenAmount} SKC tokens`
        });
        
        // Commit transaction
        await this.db.query('COMMIT');
        
        // Queue for processing
        this.queueRedemptionForProcessing(redemptionId);
        
        logger.info(`Redemption requested: ${redemptionId}`, { 
          userId: request.userId, 
          pointsAmount: request.pointsAmount,
          tokenAmount 
        });
        
        return result.rows[0];
      } catch (error) {
        // Rollback transaction on error
        await this.db.query('ROLLBACK');
        logger.error('Redemption request failed', { request, error });
        throw error;
      }
    });
  }
  
  /**
   * Get a redemption's details
   * 
   * @param redemptionId Redemption ID
   * @returns Redemption details
   */
  async getRedemption(redemptionId: string): Promise<Redemption | null> {
    try {
      const result = await this.db.query<Redemption>(
        'SELECT * FROM redemptions WHERE id = $1',
        [redemptionId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Failed to get redemption', { redemptionId, error });
      throw error;
    }
  }
  
  /**
   * Get a user's redemption history
   * 
   * @param userId User ID
   * @param limit Maximum number of redemptions to return
   * @param offset Number of redemptions to skip
   * @returns Array of redemptions
   */
  async getUserRedemptions(userId: string, limit: number = 20, offset: number = 0): Promise<Redemption[]> {
    try {
      const result = await this.db.query<Redemption>(
        'SELECT * FROM redemptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get user redemptions', { userId, error });
      throw error;
    }
  }
  
  /**
   * Process a batch of pending redemptions
   * This would typically be called by a scheduled job
   * 
   * @param batchSize Maximum number of redemptions to process
   * @returns Processing results
   */
  async processPendingRedemptions(batchSize: number = 10): Promise<{ processed: number; successful: number; failed: number }> {
    // Get pending redemptions
    const result = await this.db.query<Redemption>(
      'SELECT * FROM redemptions WHERE status = $1 ORDER BY created_at ASC LIMIT $2',
      ['pending', batchSize]
    );
    
    const redemptions = result.rows;
    let successful = 0;
    let failed = 0;
    
    // Process each redemption
    for (const redemption of redemptions) {
      try {
        // Update status to processing
        await this.db.query(
          'UPDATE redemptions SET status = $1 WHERE id = $2',
          ['processing', redemption.id]
        );
        
        // Process the redemption (blockchain interaction would happen here)
        // For now, we'll simulate a successful processing
        const transactionHash = `tx_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
        
        // Update redemption record
        await this.db.query(
          `UPDATE redemptions 
           SET status = $1, processed_at = NOW(), transaction_hash = $2 
           WHERE id = $3`,
          ['completed', transactionHash, redemption.id]
        );
        
        // Emit event for successful redemption
        await this.eventBus.publish(EventType.POINTS_REDEEMED, {
          userId: redemption.userId,
          pointsAmount: redemption.pointsAmount,
          tokenAmount: redemption.tokenAmount,
          transactionHash,
          redemptionId: redemption.id
        });
        
        successful++;
        logger.info(`Redemption processed successfully: ${redemption.id}`, { transactionHash });
      } catch (error) {
        // Update redemption record with error
        await this.db.query(
          `UPDATE redemptions 
           SET status = $1, error_message = $2 
           WHERE id = $3`,
          ['failed', error instanceof Error ? error.message : 'Unknown error', redemption.id]
        );
        
        failed++;
        logger.error(`Redemption processing failed: ${redemption.id}`, { error });
      }
    }
    
    return {
      processed: redemptions.length,
      successful,
      failed
    };
  }
  
  /**
   * Validate a redemption request
   * 
   * @param request Redemption request
   * @throws ValidationError if request is invalid
   */
  private validateRedemptionRequest(request: RedemptionRequest): void {
    // Amount must be positive
    if (request.pointsAmount <= 0) {
      throw new ValidationError('Redemption amount must be positive');
    }
    
    // Amount must be a multiple of the conversion rate for whole tokens
    if (request.pointsAmount % CONVERSION_RATE !== 0) {
      throw new ValidationError(
        `Redemption amount must be a multiple of ${CONVERSION_RATE}`
      );
    }
    
    // Amount must be at least the minimum
    if (request.pointsAmount < MINIMUM_REDEMPTION) {
      throw new ValidationError(
        `Minimum redemption amount is ${MINIMUM_REDEMPTION} points (${MINIMUM_REDEMPTION / CONVERSION_RATE} tokens)`
      );
    }
  }
  
  /**
   * Get the total amount redeemed by a user in the current week
   * 
   * @param userId User ID
   * @returns Total points redeemed this week
   */
  private async getWeeklyRedemptionTotal(userId: string): Promise<number> {
    // Calculate the start of the current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Start of day
    
    try {
      const result = await this.db.query(
        `SELECT COALESCE(SUM(points_amount), 0) as total 
         FROM redemptions 
         WHERE user_id = $1 AND created_at >= $2`,
        [userId, startOfWeek]
      );
      
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Failed to get weekly redemption total', { userId, error });
      return 0; // Default to 0 to prevent redemption on error
    }
  }
  
  /**
   * Queue a redemption for processing
   * In a real implementation, this would add to a job queue
   * 
   * @param redemptionId Redemption ID
   */
  private queueRedemptionForProcessing(redemptionId: string): void {
    // In a real implementation, this would add to a Bull queue
    // For now, we'll just log it
    logger.info(`Queued redemption for processing: ${redemptionId}`);
    
    // In the future, this would be:
    // redemptionQueue.add({ redemptionId });
  }
}
