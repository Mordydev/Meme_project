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
  Redemption, 
  CreateRedemptionDto,
  RedemptionStatus,
  EligibilityResult,
  REDEMPTION_CONSTANTS,
  RedemptionFilterOptions
} from '../../models/entities/redemption.model';
import { 
  ValidationError, 
  NotFoundError,
  InsufficientPointsError,
  RateLimitExceededError
} from '../../errors';
import { UserRepository } from '../../repositories/user-repository';
import { NotificationService } from '../../services/notifications/notification-service';
import { EnhancedPointsService } from '../../services/points/points-service-enhanced';
import { WalletService } from '../../services/wallet/wallet-service';

/**
 * Redemption result interface
 */
interface RedemptionResult {
  success: boolean;
  redemption: Redemption;
  message?: string;
}

/**
 * Paginated redemption result
 */
interface PaginatedRedemptionResult {
  data: Redemption[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
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
   * @param data Redemption request data
   * @returns Redemption result with status and details
   */
  async createRedemption(data: CreateRedemptionDto): Promise<RedemptionResult> {
    logger.info('Creating redemption request', { userId: data.user_id, pointsAmount: data.points_amount });
    
    // Validate the redemption request
    const validation = await this.eligibilityService.validateRedemptionRequest(
      data.user_id,
      data.points_amount,
      data.wallet_address
    );
    
    if (!validation.isValid) {
      logger.warn('Redemption request validation failed', { 
        userId: data.user_id, 
        errors: validation.errors 
      });
      
      throw new ValidationError(validation.errors.join(', '));
    }
    
    // Create the redemption record
    return await this.processRedemptionRequest(data);
  }

  /**
   * Process a valid redemption request
   * 
   * @param data Validated redemption request data
   * @returns Redemption result
   */
  private async processRedemptionRequest(data: CreateRedemptionDto): Promise<RedemptionResult> {
    // Use a unique reference ID if not provided
    const referenceId = data.reference_id || uuidv4();
    
    try {
      // Create the redemption record first
      const redemption = await this.redemptionRepository.createRedemption({
        ...data,
        reference_id: referenceId
      });
      
      // Deduct the points
      const deductionResult = await this.pointsService.deductPoints({
        userId: data.user_id,
        amount: data.points_amount,
        source: 'redemption',
        referenceId: redemption.id,
        description: `Redemption of ${data.points_amount} points for ${redemption.token_amount} SKC tokens`
      });
      
      if (!deductionResult.success) {
        // If points deduction fails, update redemption status to failed
        await this.redemptionRepository.updateRedemptionStatus(
          redemption.id,
          'failed',
          {
            error: 'Failed to deduct points'
          }
        );
        
        logger.error('Failed to deduct points for redemption', {
          redemptionId: redemption.id,
          userId: data.user_id,
          pointsAmount: data.points_amount
        });
        
        return {
          success: false,
          redemption: await this.redemptionRepository.findById(redemption.id) as Redemption,
          message: 'Failed to deduct points'
        };
      }
      
      // Update redemption status to processing
      const updatedRedemption = await this.redemptionRepository.updateRedemptionStatus(
        redemption.id,
        'processing',
        {
          processed_at: new Date()
        }
      );
      
      // Create a transaction record for processing
      const transaction = await this.redemptionRepository.createRedemptionTransaction(redemption.id);
      
      // Queue the transaction for processing
      await this.transactionService.queueTransaction(transaction.id);
      
      // Emit redemption created event
      await this.eventBus.publish(EventType.REDEMPTION_CREATED, {
        userId: data.user_id,
        redemptionId: redemption.id,
        pointsAmount: data.points_amount,
        tokenAmount: redemption.token_amount,
        timestamp: new Date()
      });
      
      logger.info('Redemption request created successfully', {
        redemptionId: redemption.id,
        userId: data.user_id,
        pointsAmount: data.points_amount,
        tokenAmount: redemption.token_amount
      });
      
      return {
        success: true,
        redemption: updatedRedemption
      };
    } catch (error) {
      logger.error('Error creating redemption request', {
        userId: data.user_id,
        pointsAmount: data.points_amount,
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
    
    // Get redemptions
    const redemptions = await this.redemptionRepository.findByUserId(userId, limit, offset);
    
    // Get total count
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
    
    // Verify ownership
    if (redemption.user_id !== userId) {
      throw new ValidationError('Not authorized to cancel this redemption');
    }
    
    // Check if cancellable (only pending redemptions can be cancelled)
    if (redemption.status !== 'pending') {
      throw new ValidationError(`Cannot cancel redemption with status: ${redemption.status}`);
    }
    
    // Update status to cancelled
    const cancelledRedemption = await this.redemptionRepository.updateRedemptionStatus(
      id,
      'cancelled',
      {
        error: 'Cancelled by user'
      }
    );
    
    // Refund the points
    await this.pointsService.awardPoints({
      userId: redemption.user_id,
      amount: redemption.points_amount,
      source: 'redemption_refund',
      referenceId: redemption.id,
      description: `Refund for cancelled redemption #${redemption.id}`
    });
    
    // Emit event
    await this.eventBus.publish(EventType.REDEMPTION_CANCELLED, {
      userId: redemption.user_id,
      redemptionId: redemption.id,
      pointsAmount: redemption.points_amount,
      tokenAmount: redemption.token_amount,
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
    // Get counts by status
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
    // Get redemptions
    const redemptions = await this.redemptionRepository.findWithFilters(options);
    
    // Get total count
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
    return this.redemptionRepository.updateTransactionHash(id, transactionHash);
  }

  /**
   * Update a redemption's status
   * 
   * @param id Redemption ID
   * @param status New status
   * @param data Additional update data
   * @returns Updated redemption
   */
  async updateStatus(
    id: string,
    status: RedemptionStatus,
    data: any = {}
  ): Promise<Redemption> {
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
