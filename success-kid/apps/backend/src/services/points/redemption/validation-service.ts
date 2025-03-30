/**
 * Redemption Validation Service
 * 
 * Validates redemption requests against business rules and eligibility criteria.
 */
import { logger } from '../../../lib/logger';
import { 
  RedemptionRequest, 
  REDEMPTION_CONSTANTS 
} from '../../../models/entities/redemption';
import { RedemptionRepository } from '../../../repositories/redemption-repository';
import { UserRepository } from '../../../repositories/user-repository';
import { EnhancedPointsService } from '../points-service-enhanced';
import { WalletService } from '../../wallet/wallet-service';
import { WalletConnectionService } from '../../../wallet/connection/service';
import { WalletVerificationService } from '../../../wallet/verification/service';
import { ValidationError, InsufficientPointsError } from '../../../errors';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field?: string;
  code: string;
  message: string;
}

/**
 * Eligibility result
 */
export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  limits?: {
    weekly: {
      limit: number;
      used: number;
      remaining: number;
    };
  };
  pointsBalance?: number;
  walletVerified?: boolean;
}

/**
 * Redemption Validation Service
 */
export class RedemptionValidationService {
  private walletConnectionService: WalletConnectionService;
  private walletVerificationService: WalletVerificationService;
  
  /**
   * Create redemption validation service
   * 
   * @param redemptionRepository Redemption repository
   * @param userRepository User repository
   * @param pointsService Points service
   * @param walletService Wallet service
   */
  constructor(
    private readonly redemptionRepository: RedemptionRepository,
    private readonly userRepository: UserRepository,
    private readonly pointsService: EnhancedPointsService,
    private readonly walletService: WalletService
  ) {
    // Get wallet services
    const walletModule = getWalletModule();
    
    if (!walletModule) {
      throw new Error('Wallet module not initialized');
    }
    
    this.walletConnectionService = walletModule.connectionService;
    this.walletVerificationService = walletModule.verificationService;
  }

  /**
   * Validate redemption request
   * 
   * @param request Redemption request
   * @returns Validation result
   */
  async validateRequest(request: RedemptionRequest): Promise<ValidationResult> {
    logger.info('Validating redemption request', {
      userId: request.userId,
      pointsAmount: request.pointsAmount,
      walletAddress: request.walletAddress
    });
    
    const errors: ValidationError[] = [];
    
    // Basic validation
    if (!request.userId) {
      errors.push({
        field: 'userId',
        code: 'required',
        message: 'User ID is required'
      });
    }
    
    if (!request.pointsAmount) {
      errors.push({
        field: 'pointsAmount',
        code: 'required',
        message: 'Points amount is required'
      });
    } else {
      // Amount must be positive
      if (request.pointsAmount <= 0) {
        errors.push({
          field: 'pointsAmount',
          code: 'positive',
          message: 'Points amount must be positive'
        });
      }
      
      // Amount must be a multiple of conversion rate
      if (request.pointsAmount % REDEMPTION_CONSTANTS.CONVERSION_RATE !== 0) {
        errors.push({
          field: 'pointsAmount',
          code: 'multiple',
          message: `Points amount must be a multiple of ${REDEMPTION_CONSTANTS.CONVERSION_RATE}`
        });
      }
      
      // Amount must be at least the minimum
      if (request.pointsAmount < REDEMPTION_CONSTANTS.MINIMUM_REDEMPTION) {
        errors.push({
          field: 'pointsAmount',
          code: 'minimum',
          message: `Minimum redemption amount is ${REDEMPTION_CONSTANTS.MINIMUM_REDEMPTION} points (${REDEMPTION_CONSTANTS.MINIMUM_REDEMPTION / REDEMPTION_CONSTANTS.CONVERSION_RATE} tokens)`
        });
      }
    }
    
    if (!request.walletAddress) {
      errors.push({
        field: 'walletAddress',
        code: 'required',
        message: 'Wallet address is required'
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user is eligible for redemption
   * 
   * @param userId User ID
   * @param pointsAmount Points amount
   * @param walletAddress Wallet address
   * @returns Eligibility result
   */
  async checkEligibility(
    userId: string,
    pointsAmount: number,
    walletAddress: string
  ): Promise<EligibilityResult> {
    logger.info('Checking redemption eligibility', {
      userId,
      pointsAmount,
      walletAddress
    });
    
    const result: EligibilityResult = {
      eligible: true,
      reasons: []
    };
    
    // Check points balance
    const balance = await this.pointsService.getUserBalance(userId);
    result.pointsBalance = balance;
    
    if (balance < pointsAmount) {
      result.eligible = false;
      result.reasons.push(`Insufficient points balance: ${balance} available, ${pointsAmount} required`);
    }
    
    // Check wallet connection
    const isConnected = await this.walletConnectionService.isWalletConnectedToUser(
      userId,
      walletAddress
    );
    
    if (!isConnected) {
      result.eligible = false;
      result.reasons.push('Wallet not connected to user account');
    } else {
      // Check wallet verification
      const verificationStatus = await this.walletVerificationService.getVerificationStatus(
        userId,
        walletAddress
      );
      
      result.walletVerified = verificationStatus.isVerified;
      
      if (!verificationStatus.isVerified) {
        result.eligible = false;
        result.reasons.push('Wallet not verified');
      }
    }
    
    // Check weekly redemption cap
    const weekly = await this.checkWeeklyLimit(userId, pointsAmount);
    result.limits = { weekly };
    
    if (weekly.remaining < pointsAmount) {
      result.eligible = false;
      result.reasons.push(`Weekly redemption cap would be exceeded: ${weekly.remaining} remaining, ${pointsAmount} requested`);
    }
    
    // TODO: Add additional eligibility checks as needed
    // - Account age
    // - Account status
    // - Suspicious activity flags
    
    return result;
  }

  /**
   * Check weekly redemption limit
   * 
   * @param userId User ID
   * @param pointsAmount Points amount
   * @returns Weekly limit details
   */
  async checkWeeklyLimit(userId: string, pointsAmount: number = 0): Promise<{
    limit: number;
    used: number;
    remaining: number;
    wouldExceed: boolean;
  }> {
    // Get week start date (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Start of day
    
    // Get total redeemed this week
    const weeklyTotal = await this.redemptionRepository.getWeeklyRedemptionTotal(
      userId,
      startOfWeek
    );
    
    // Calculate remaining
    const weeklyLimit = REDEMPTION_CONSTANTS.WEEKLY_REDEMPTION_CAP;
    const remaining = Math.max(0, weeklyLimit - weeklyTotal);
    
    return {
      limit: weeklyLimit,
      used: weeklyTotal,
      remaining,
      wouldExceed: (weeklyTotal + pointsAmount) > weeklyLimit
    };
  }

  /**
   * Validate redemption request and check eligibility
   * 
   * @param request Redemption request
   * @throws Error if validation fails
   */
  async validateRedemptionRequest(request: RedemptionRequest): Promise<void> {
    // First, validate the request format
    const validationResult = await this.validateRequest(request);
    
    if (!validationResult.valid) {
      const errorMessages = validationResult.errors.map(e => e.message).join(', ');
      throw new ValidationError(`Invalid redemption request: ${errorMessages}`);
    }
    
    // Then, check eligibility
    const eligibilityResult = await this.checkEligibility(
      request.userId,
      request.pointsAmount,
      request.walletAddress
    );
    
    if (!eligibilityResult.eligible) {
      const errorMessages = eligibilityResult.reasons.join(', ');
      
      // Special case for insufficient points
      if (eligibilityResult.reasons.some(r => r.startsWith('Insufficient points'))) {
        throw new InsufficientPointsError(errorMessages);
      }
      
      throw new ValidationError(`Not eligible for redemption: ${errorMessages}`);
    }
  }
}
