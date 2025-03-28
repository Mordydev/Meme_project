/**
 * Redemption Eligibility Service
 * 
 * This service validates user eligibility for redemption operations.
 */
import { WalletRepository } from '../../repositories/wallet-repository';
import { PointsService } from '../../services/points/points-service';
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { logger } from '../../lib/logger';
import { 
  REDEMPTION_CONSTANTS, 
  EligibilityResult 
} from '../../models/entities/redemption.model';

/**
 * Redemption eligibility service
 */
export class RedemptionEligibilityService {
  /**
   * Create a new RedemptionEligibilityService
   * 
   * @param walletRepository Wallet repository
   * @param pointsService Points service
   * @param redemptionRepository Redemption repository
   */
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly pointsService: PointsService,
    private readonly redemptionRepository: RedemptionRepository
  ) {}

  /**
   * Check if a user is eligible to redeem points
   * 
   * @param userId User ID
   * @returns Eligibility result with detailed information
   */
  async checkEligibility(userId: string): Promise<EligibilityResult> {
    logger.info('Checking redemption eligibility', { userId });

    const result: EligibilityResult = {
      eligible: true,
      reasons: [],
      limits: {
        weekly: {
          limit: REDEMPTION_CONSTANTS.WEEKLY_LIMIT,
          used: 0,
          remaining: REDEMPTION_CONSTANTS.WEEKLY_LIMIT
        },
        minimum: REDEMPTION_CONSTANTS.MINIMUM_AMOUNT
      },
      walletVerified: false,
      accountStatus: 'active'
    };

    // Check account status
    // In a real implementation, this would check user status from user service
    // For now, we'll just assume the user is active
    result.accountStatus = 'active';

    // Check for verified wallet
    const wallets = await this.walletRepository.findByUserId(userId);
    const verifiedWallet = wallets.find(wallet => wallet.is_verified);
    
    result.walletVerified = !!verifiedWallet;
    
    if (!verifiedWallet) {
      result.eligible = false;
      result.reasons!.push('No verified wallet connected');
    }

    // Check redemption limits
    const weeklyUsed = await this.redemptionRepository.getWeeklyRedemptionTotal(
      userId
    );
    
    result.limits!.weekly.used = weeklyUsed;
    result.limits!.weekly.remaining = Math.max(0, REDEMPTION_CONSTANTS.WEEKLY_LIMIT - weeklyUsed);
    
    if (result.limits!.weekly.remaining <= 0) {
      result.eligible = false;
      result.reasons!.push(`Weekly redemption limit reached (${REDEMPTION_CONSTANTS.WEEKLY_LIMIT} SP)`);
    }

    // Check user has enough points
    const currentBalance = await this.pointsService.getUserBalance(userId);
    
    if (currentBalance < REDEMPTION_CONSTANTS.MINIMUM_AMOUNT) {
      result.eligible = false;
      result.reasons!.push(`Insufficient points balance (minimum ${REDEMPTION_CONSTANTS.MINIMUM_AMOUNT} required, ${currentBalance} available)`);
    }

    return result;
  }

  /**
   * Validate a specific redemption request
   * 
   * @param userId User ID
   * @param pointsAmount Amount of points to redeem
   * @param walletAddress Wallet address for redemption
   * @returns Validation result with detailed information
   */
  async validateRedemptionRequest(
    userId: string,
    pointsAmount: number,
    walletAddress: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    logger.info('Validating redemption request', { userId, pointsAmount, walletAddress });

    const errors: string[] = [];

    // Check points amount is positive
    if (pointsAmount <= 0) {
      errors.push('Points amount must be positive');
    }

    // Check points amount is at least the minimum
    if (pointsAmount < REDEMPTION_CONSTANTS.MINIMUM_AMOUNT) {
      errors.push(`Points amount must be at least ${REDEMPTION_CONSTANTS.MINIMUM_AMOUNT}`);
    }

    // Check points amount is divisible by 100 (for clean token conversion)
    if (pointsAmount % 100 !== 0) {
      errors.push('Points amount must be divisible by 100');
    }

    // Check user has enough points
    const currentBalance = await this.pointsService.getUserBalance(userId);
    
    if (currentBalance < pointsAmount) {
      errors.push(`Insufficient points balance (${currentBalance} available, ${pointsAmount} requested)`);
    }

    // Check wallet address belongs to user
    const wallet = await this.walletRepository.findByAddress(walletAddress);
    
    if (!wallet) {
      errors.push('Wallet address not found');
    } else if (wallet.user_id !== userId) {
      errors.push('Wallet address does not belong to this user');
    } else if (!wallet.is_verified) {
      errors.push('Wallet address is not verified');
    }

    // Check weekly limit
    const weeklyUsed = await this.redemptionRepository.getWeeklyRedemptionTotal(userId);
    const weeklyRemaining = Math.max(0, REDEMPTION_CONSTANTS.WEEKLY_LIMIT - weeklyUsed);
    
    if (weeklyRemaining < pointsAmount) {
      errors.push(`Weekly redemption limit exceeded (${weeklyRemaining} remaining, ${pointsAmount} requested)`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get remaining weekly limit for a user
   * 
   * @param userId User ID
   * @returns Remaining weekly limit
   */
  async getRemainingWeeklyLimit(userId: string): Promise<number> {
    const weeklyUsed = await this.redemptionRepository.getWeeklyRedemptionTotal(userId);
    return Math.max(0, REDEMPTION_CONSTANTS.WEEKLY_LIMIT - weeklyUsed);
  }
}
