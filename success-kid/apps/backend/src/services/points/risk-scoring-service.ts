/**
 * Risk Scoring Service
 * 
 * Analyzes redemption requests for potential fraud or exploitation.
 */
import { logger } from '../../lib/logger';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { RedemptionRepository } from '../../repositories/redemption-repository';

/**
 * Risk factor types
 */
export enum RiskFactorType {
  NEW_ACCOUNT = 'new_account',
  HIGH_REDEMPTION_VELOCITY = 'high_redemption_velocity',
  SUSPICIOUS_POINTS_ACTIVITY = 'suspicious_points_activity',
  WALLET_RISK = 'wallet_risk',
  UNUSUAL_AMOUNT = 'unusual_amount',
  TIME_OF_DAY = 'time_of_day',
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly',
  REPEATED_ATTEMPTS = 'repeated_attempts'
}

/**
 * Risk severity levels
 */
export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Risk factor interface
 */
export interface RiskFactor {
  type: RiskFactorType;
  severity: RiskSeverity;
  description: string;
  score: number;
}

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  riskScore: number; // 0-100
  riskLevel: RiskSeverity;
  riskFactors: RiskFactor[];
  recommendation: 'allow' | 'review' | 'block';
}

/**
 * Redemption request for risk assessment
 */
export interface RedemptionRiskRequest {
  userId: string;
  amount: number;
  walletAddress: string;
  ip?: string;
  userAgent?: string;
  referenceId?: string;
}

/**
 * Service for assessing redemption risk
 */
export class RiskScoringService {
  constructor(
    private userPointsRepository: UserPointsRepository,
    private redemptionRepository: RedemptionRepository
  ) {}

  /**
   * Analyze a redemption request for risk
   * 
   * @param request - The redemption request to analyze
   * @returns Risk assessment
   */
  async analyzeRedemptionRequest(request: RedemptionRiskRequest): Promise<RiskAssessment> {
    try {
      // Initialize risk assessment
      const assessment: RiskAssessment = {
        riskScore: 0,
        riskLevel: RiskSeverity.LOW,
        riskFactors: [],
        recommendation: 'allow'
      };
      
      // Check account age
      const accountAgeFactor = await this.assessAccountAge(request.userId);
      if (accountAgeFactor) {
        assessment.riskScore += accountAgeFactor.score;
        assessment.riskFactors.push(accountAgeFactor);
      }
      
      // Check redemption velocity
      const velocityFactor = await this.assessRedemptionVelocity(request.userId);
      if (velocityFactor) {
        assessment.riskScore += velocityFactor.score;
        assessment.riskFactors.push(velocityFactor);
      }
      
      // Check points accumulation patterns
      const pointsPatternFactor = await this.assessPointsAccumulationPattern(request.userId);
      if (pointsPatternFactor) {
        assessment.riskScore += pointsPatternFactor.score;
        assessment.riskFactors.push(pointsPatternFactor);
      }
      
      // Check redemption amount
      const amountFactor = this.assessRedemptionAmount(request.amount);
      if (amountFactor) {
        assessment.riskScore += amountFactor.score;
        assessment.riskFactors.push(amountFactor);
      }
      
      // Check wallet risk
      const walletFactor = await this.assessWalletRisk(request.walletAddress);
      if (walletFactor) {
        assessment.riskScore += walletFactor.score;
        assessment.riskFactors.push(walletFactor);
      }
      
      // Determine risk level and recommendation based on total score
      if (assessment.riskScore >= 70) {
        assessment.riskLevel = RiskSeverity.CRITICAL;
        assessment.recommendation = 'block';
      } else if (assessment.riskScore >= 40) {
        assessment.riskLevel = RiskSeverity.HIGH;
        assessment.recommendation = 'review';
      } else if (assessment.riskScore >= 20) {
        assessment.riskLevel = RiskSeverity.MEDIUM;
        assessment.recommendation = 'allow';
      } else {
        assessment.riskLevel = RiskSeverity.LOW;
        assessment.recommendation = 'allow';
      }
      
      logger.debug('Redemption risk assessment', {
        userId: request.userId,
        amount: request.amount,
        walletAddress: request.walletAddress,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        recommendation: assessment.recommendation,
        factorCount: assessment.riskFactors.length
      });
      
      return assessment;
    } catch (error) {
      logger.error('Error performing risk assessment', { error, request });
      
      // Return default low-risk assessment on error to avoid blocking legitimate requests
      return {
        riskScore: 0,
        riskLevel: RiskSeverity.LOW,
        riskFactors: [],
        recommendation: 'allow'
      };
    }
  }

  /**
   * Assess account age risk
   * 
   * @param userId - User ID
   * @returns Risk factor for account age or null
   */
  private async assessAccountAge(userId: string): Promise<RiskFactor | null> {
    try {
      // This is placeholder logic - in a real implementation you would:
      // 1. Query user creation date from database
      // 2. Calculate account age in days
      // 3. Apply appropriate risk scoring based on age

      // Mock implementation - 20% chance of new account
      const isNewAccount = Math.random() < 0.2;
      
      if (isNewAccount) {
        return {
          type: RiskFactorType.NEW_ACCOUNT,
          severity: RiskSeverity.MEDIUM,
          description: 'Account is less than 7 days old',
          score: 20
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error assessing account age', { error, userId });
      return null;
    }
  }

  /**
   * Assess redemption velocity risk
   * 
   * @param userId - User ID
   * @returns Risk factor for redemption velocity or null
   */
  private async assessRedemptionVelocity(userId: string): Promise<RiskFactor | null> {
    try {
      // Get recent redemptions from repository
      // Count redemptions within last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentRedemptions = await this.redemptionRepository.findByUserId(userId, {
        startDate: yesterday
      });
      
      if (recentRedemptions.length >= 3) {
        return {
          type: RiskFactorType.HIGH_REDEMPTION_VELOCITY,
          severity: RiskSeverity.HIGH,
          description: `${recentRedemptions.length} redemptions in 24 hours`,
          score: 30
        };
      } else if (recentRedemptions.length >= 2) {
        return {
          type: RiskFactorType.HIGH_REDEMPTION_VELOCITY,
          severity: RiskSeverity.MEDIUM,
          description: `${recentRedemptions.length} redemptions in 24 hours`,
          score: 15
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error assessing redemption velocity', { error, userId });
      return null;
    }
  }

  /**
   * Assess points accumulation pattern risk
   * 
   * @param userId - User ID
   * @returns Risk factor for points accumulation pattern or null
   */
  private async assessPointsAccumulationPattern(userId: string): Promise<RiskFactor | null> {
    try {
      // In a real implementation, this would:
      // 1. Analyze the user's points earning history
      // 2. Look for unusual patterns like sudden large amounts
      // 3. Check for concentration from a single source

      // Mock implementation - 10% chance of suspicious pattern
      const isSuspicious = Math.random() < 0.1;
      
      if (isSuspicious) {
        return {
          type: RiskFactorType.SUSPICIOUS_POINTS_ACTIVITY,
          severity: RiskSeverity.HIGH,
          description: 'Unusual pattern of points accumulation detected',
          score: 35
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error assessing points accumulation', { error, userId });
      return null;
    }
  }

  /**
   * Assess redemption amount risk
   * 
   * @param amount - Redemption amount
   * @returns Risk factor for redemption amount or null
   */
  private assessRedemptionAmount(amount: number): RiskFactor | null {
    try {
      // Redemption amount risk is based on thresholds
      if (amount >= 9000) { // 90% of weekly cap
        return {
          type: RiskFactorType.UNUSUAL_AMOUNT,
          severity: RiskSeverity.MEDIUM,
          description: 'Redemption amount is near weekly maximum',
          score: 15
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error assessing redemption amount', { error, amount });
      return null;
    }
  }

  /**
   * Assess wallet risk
   * 
   * @param walletAddress - Wallet address
   * @returns Risk factor for wallet or null
   */
  private async assessWalletRisk(walletAddress: string): Promise<RiskFactor | null> {
    try {
      // In a real implementation, this would:
      // 1. Check wallet age and transaction history
      // 2. Look for connections to known suspicious wallets
      // 3. Verify wallet hasn't been used by multiple users

      // Mock implementation - 5% chance of wallet risk
      const isRisky = Math.random() < 0.05;
      
      if (isRisky) {
        return {
          type: RiskFactorType.WALLET_RISK,
          severity: RiskSeverity.HIGH,
          description: 'Wallet address associated with suspicious activity',
          score: 40
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error assessing wallet risk', { error, walletAddress });
      return null;
    }
  }
}
