/**
 * Redemption Service
 * 
 * Core service for managing points-to-token redemption operations.
 */
import { v4 as uuidv4 } from 'uuid';
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { RedemptionEligibilityService } from '../validation/eligibility-service';
import { TransactionService } from '../transactions/transaction-service';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { 
  Redemption, // Now camelCase
  CreateRedemptionRequestDto, 
  RedemptionStatus,
  REDEMPTION_CONSTANTS,
  RedemptionFilterOptions,
  RedemptionTransaction // Now camelCase
} from '../../models/entities/redemption.model';
import { 
  ValidationError, 
  NotFoundError,
  InsufficientPointsError,
  PointsLimitExceededError 
} from '../../errors';
import { UserRepository } from '../../repositories/user-repository';
import { NotificationService } from '../../services/notifications/notification-service';
import { EnhancedPointsService } from '../../services/points/points-service-enhanced';
import { WalletService } from '../../services/wallet/wallet-service';

// Define the type for the Drizzle schema select result (camelCase) used by repo updateData
type RedemptionSchemaSelect = typeof import('../../database/schema').redemptions.$inferSelect;


/**
 * Redemption result interface
 */
interface RedemptionResult {
  success: boolean;
  redemption: Redemption; // Now camelCase
  message?: string;
}

/**
 * Paginated redemption result
 */
interface PaginatedRedemptionResult {
  data: Redemption[]; // Now camelCase
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}

// Define EligibilityResult locally, mirroring the one in eligibility-service
interface EligibilityResult {
  eligible: boolean;
  reasons?: string[];
  limits?: {
    weekly: {
      limit: number;
      used: number;
      remaining: number;
    };
    minimum: number;
  };
  walletVerified: boolean;
  accountStatus: string; 
}


/**
 * Redemption service for handling points-to-token conversions
 */
export class RedemptionService {
  /**
   * Create a new RedemptionService
   * 
   * @param redemptionRepository Repository for redemption data
   * @param userRepository Repository for user data
   * @param notificationService Service for sending notifications
   * @param pointsService Service for managing points
   * @param walletService Service for managing wallets
   * @param eligibilityService Service for checking redemption eligibility
   * @param transactionService Service for blockchain transactions
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private redemptionRepository: RedemptionRepository,
    private userRepository: UserRepository,
    private notificationService: NotificationService,
    private pointsService: EnhancedPointsService,
    private walletService: WalletService,
    private eligibilityService: RedemptionEligibilityService,
    private transactionService: TransactionService,
    private eventBus: EventBus
  ) {}

  /**
   * Create a redemption request
   * 
   * @param data Redemption request data (using DTO from model - camelCase)
   * @returns Redemption result with status and details
   */
  async requestRedemption(data: CreateRedemptionRequestDto): Promise<RedemptionResult> { 
    logger.info('Requesting redemption', { userId: data.userId, pointsAmount: data.pointsAmount });
    
    // Validate the redemption request using eligibility service
    const validation = await this.eligibilityService.validateRedemptionRequest(
      data.userId, 
      data.pointsAmount, 
      data.walletAddress 
    );
    
    if (!validation.isValid) {
      logger.warn('Redemption request validation failed', { 
        userId: data.userId, 
        errors: validation.errors 
      });
      
      throw new ValidationError(validation.errors.join(', '));
    }
    
    // Process the redemption request (create record, deduct points, queue transaction)
    // Pass camelCase data to processRedemptionRequest
    return await this.processRedemptionRequest({
        userId: data.userId,
        pointsAmount: data.pointsAmount,
        walletAddress: data.walletAddress,
        // referenceId is optional and handled below
    });
  }


  /**
   * Process a valid redemption request
   * 
   * @param data Validated redemption request data (camelCase)
   * @returns Redemption result
   */
  private async processRedemptionRequest(data: {
      userId: string;
      pointsAmount: number;
      walletAddress: string;
      referenceId?: string;
  }): Promise<RedemptionResult> {
    // Use a unique reference ID if not provided
    const referenceId = data.referenceId || uuidv4();
    
    try {
      // Create the redemption record first using the repository
      // Pass camelCase data to repository's createRedemption
      const redemption = await this.redemptionRepository.createRedemption({
        userId: data.userId,
        pointsAmount: data.pointsAmount,
        walletAddress: data.walletAddress,
        referenceId: referenceId // Pass referenceId here (repo ignores if not in schema)
      });
      
      // Deduct the points using points service
      const deductionResult = await this.pointsService.deductPoints({
        userId: data.userId,
        amount: data.pointsAmount,
        source: 'redemption',
        referenceId: redemption.id, // Link deduction to redemption record ID
        description: `Redemption of ${data.pointsAmount} points for ${redemption.tokenAmount} SKC tokens` // Use camelCase from Redemption type
      });
      
      if (!deductionResult.success) {
        // If points deduction fails, update redemption status to failed
        await this.redemptionRepository.updateRedemptionStatus(
          redemption.id,
          'failed',
          {
            errorMessage: 'Failed to deduct points' // Pass camelCase to repo
          }
        );
        
        logger.error('Failed to deduct points for redemption', {
          redemptionId: redemption.id,
          userId: data.userId,
          pointsAmount: data.pointsAmount
        });
        
        // Fetch the updated (failed) redemption record to return
        const failedRedemption = await this.redemptionRepository.findById(redemption.id);
        if (!failedRedemption) throw new NotFoundError('Failed redemption record not found after update.'); // Should not happen

        return {
          success: false,
          redemption: failedRedemption,
          message: 'Failed to deduct points'
        };
      }
      
      // Update redemption status to processing using the repository
      const updatedRedemption = await this.redemptionRepository.updateRedemptionStatus(
        redemption.id,
        'processing',
        {
          processedAt: new Date() // Pass camelCase to repo
        }
      );
      
      // Create a transaction record for processing using the repository
      // TODO: Ensure createRedemptionTransaction exists and works
      const transaction = await this.redemptionRepository.createRedemptionTransaction(redemption.id);
      
      // Queue the transaction for processing using the transaction service
      // TODO: Verify queueTransaction exists on TransactionService - Method does not exist, commenting out for now. Needs job queue integration.
      // await this.transactionService.queueTransaction(transaction.id); 
      logger.warn('Transaction queuing skipped: queueTransaction method not found on TransactionService.', { transactionId: transaction.id });
      
      // Emit redemption requested event (corrected event type)
      await this.eventBus.publish(EventType.REDEMPTION_REQUESTED, { 
        userId: data.userId,
        redemptionId: redemption.id,
        pointsAmount: data.pointsAmount,
        tokenAmount: redemption.tokenAmount, // Use camelCase from Redemption type
        timestamp: new Date()
      });
      
      logger.info('Redemption request created successfully', {
        redemptionId: redemption.id,
        userId: data.userId,
        pointsAmount: data.pointsAmount,
        tokenAmount: redemption.tokenAmount // Use camelCase
      });
      
      return {
        success: true,
        redemption: updatedRedemption
      };
    } catch (error) {
      logger.error('Error processing redemption request', { // Updated log message
        userId: data.userId,
        pointsAmount: data.pointsAmount,
        error
      });
      
      // Rethrow original error for handling upstream
      throw error;
    }
  }

  /**
   * Get a redemption by ID
   * 
   * @param id Redemption ID
   * @returns Redemption details
   */
  async getRedemptionById(id: string): Promise<Redemption> {
    const redemption = await this.redemptionRepository.findById(id);
    
    if (!redemption) {
      throw new NotFoundError('Redemption not found');
    }
    
    return redemption;
  }

  /**
   * Get redemptions for a user
   * 
   * @param userId User ID
   * @param page Page number (1-based)
   * @param limit Items per page
   * @returns Paginated redemption results
   */
  async getUserRedemptions(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRedemptionResult> {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Get redemptions using repository method
    const redemptions = await this.redemptionRepository.findByUserId(userId, limit, offset);
    
    // Get total count using repository method
    const total = await this.redemptionRepository.countByUserId(userId);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: redemptions,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Check redemption eligibility for a user
   * 
   * @param userId User ID
   * @returns Eligibility result
   */
  async checkEligibility(userId: string): Promise<EligibilityResult> {
    // Delegate directly to the eligibility service
    return this.eligibilityService.checkEligibility(userId);
  }

  /**
   * Cancel a redemption (if still pending)
   * 
   * @param id Redemption ID
   * @param userId User ID (for authorization)
   * @returns Result of the cancellation
   */
  async cancelRedemption(id: string, userId: string): Promise<RedemptionResult> {
    // Get the redemption
    const redemption = await this.redemptionRepository.findById(id);
    
    if (!redemption) {
      throw new NotFoundError('Redemption not found');
    }
    
    // Verify ownership (using camelCase property from Redemption type)
    if (redemption.userId !== userId) { 
      throw new ValidationError('Not authorized to cancel this redemption');
    }
    
    // Check if cancellable (only pending redemptions can be cancelled)
    if (redemption.status !== 'pending') {
      throw new ValidationError(`Cannot cancel redemption with status: ${redemption.status}`);
    }
    
    // Update status to cancelled using repository
    const cancelledRedemption = await this.redemptionRepository.updateRedemptionStatus(
      id,
      'cancelled',
      {
        errorMessage: 'Cancelled by user' // Pass camelCase to repo
      }
    );
    
    // Refund the points using points service
    await this.pointsService.awardPoints({
      userId: redemption.userId, // Use camelCase
      amount: redemption.pointsAmount, // Use camelCase
      source: 'redemption_refund',
      referenceId: redemption.id,
      description: `Refund for cancelled redemption #${redemption.id}`
    });
    
    // Emit event
    await this.eventBus.publish(EventType.REDEMPTION_CANCELLED, { // Assuming this event type exists
      userId: redemption.userId, // Use camelCase
      redemptionId: redemption.id,
      pointsAmount: redemption.pointsAmount, // Use camelCase
      tokenAmount: redemption.tokenAmount, // Use camelCase
      timestamp: new Date()
    });
    
    logger.info('Redemption cancelled successfully', {
      redemptionId: id,
      userId
    });
    
    return {
      success: true,
      redemption: cancelledRedemption,
      message: 'Redemption cancelled successfully'
    };
  }

  /**
   * Get redemption statistics
   * 
   * @returns Redemption statistics
   */
  async getRedemptionStats(): Promise<any> {
    // Get counts by status using repository
    const pendingCount = await this.redemptionRepository.countByStatus('pending');
    const processingCount = await this.redemptionRepository.countByStatus('processing');
    const completedCount = await this.redemptionRepository.countByStatus('completed');
    const failedCount = await this.redemptionRepository.countByStatus('failed');
    const cancelledCount = await this.redemptionRepository.countByStatus('cancelled');
    
    return {
      byStatus: {
        pending: pendingCount,
        processing: processingCount,
        completed: completedCount,
        failed: failedCount,
        cancelled: cancelledCount
      },
      total: pendingCount + processingCount + completedCount + failedCount + cancelledCount
    };
  }

  /**
   * Get redemptions with filtering and pagination
   * 
   * @param options Filter and pagination options
   * @returns Paginated redemption results
   */
  async getRedemptionsWithFilters(options: RedemptionFilterOptions): Promise<PaginatedRedemptionResult> {
    // Get redemptions using repository
    const redemptions = await this.redemptionRepository.findWithFilters(options);
    
    // Get total count using repository
    const total = await this.redemptionRepository.countWithFilters(options);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / options.limit);
    
    return {
      data: redemptions,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Update a redemption's transaction hash
   * 
   * @param id Redemption ID
   * @param transactionHash Blockchain transaction hash
   * @returns Updated redemption
   */
  async updateTransactionHash(id: string, transactionHash: string): Promise<Redemption> {
    // Use repository method
    return this.redemptionRepository.updateTransactionHash(id, transactionHash);
  }

  /**
   * Update a redemption's status (wrapper around repository method)
   * 
   * @param id Redemption ID
   * @param status New status
   * @param data Additional update data (e.g., errorMessage, transactionHash, processedAt - use camelCase for type hint)
   * @returns Updated redemption
   */
  async updateStatus(
    id: string,
    status: RedemptionStatus,
    // Use camelCase for Pick to match repository input expectation
    data: Partial<Pick<RedemptionSchemaSelect, 'errorMessage' | 'transactionHash' | 'processedAt'>> = {} 
  ): Promise<Redemption> {
    // Pass camelCase data directly to repository
    return this.redemptionRepository.updateRedemptionStatus(id, status, data);
  }

  /**
   * Get the conversion rate
   * 
   * @returns Conversion rate (SP to SKC)
   */
  getConversionRate(): number {
    return REDEMPTION_CONSTANTS.CONVERSION_RATIO;
  }

  /**
   * Get redemption limits
   * 
   * @returns Redemption limits
   */
  getRedemptionLimits(): { minimum: number; weekly: number } {
    return {
      minimum: REDEMPTION_CONSTANTS.MINIMUM_AMOUNT,
      weekly: REDEMPTION_CONSTANTS.WEEKLY_LIMIT
    };
  }
}
