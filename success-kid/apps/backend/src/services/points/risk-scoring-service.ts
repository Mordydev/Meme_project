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
      // Get user creation date from recent points transactions
      // We could query the user table directly, but this approach keeps the service decoupled
      const userTransactions = await this.userPointsRepository.getUserPointsHistory(userId, { limit: 1, orderBy: 'created_at_asc' });
      
      if (userTransactions.length === 0) {
        // No transactions found, treat as very new account (high risk)
        return {
          type: RiskFactorType.NEW_ACCOUNT,
          severity: RiskSeverity.HIGH,
          description: 'No previous points activity',
          score: 30
        };
      }
      
      // Calculate account age in days based on first transaction
      const firstTransaction = userTransactions[0];
      const accountAge = Math.floor((Date.now() - new Date(firstTransaction.created_at).getTime()) / (1000 * 60 * 60 * 24));
      
      // Apply risk scoring based on account age
      if (accountAge < 1) {
        return {
          type: RiskFactorType.NEW_ACCOUNT,
          severity: RiskSeverity.HIGH,
          description: 'Account is less than 1 day old',
          score: 35
        };
      } else if (accountAge < 3) {
        return {
          type: RiskFactorType.NEW_ACCOUNT,
          severity: RiskSeverity.MEDIUM,
          description: 'Account is less than 3 days old',
          score: 25
        };
      } else if (accountAge < 7) {
        return {
          type: RiskFactorType.NEW_ACCOUNT,
          severity: RiskSeverity.LOW,
          description: 'Account is less than 7 days old',
          score: 15
        };
      }
      
      return null; // Account is older than 7 days, no risk factor
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
      // Get user's recent points history (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentPositiveTransactions = await this.userPointsRepository.getUserPointsHistory(userId, { 
        limit: 100, 
        minAmount: 1, // Only positive transactions
        startDate: yesterday 
      });
      
      // Calculate statistics
      if (recentPositiveTransactions.length === 0) {
        return null; // No recent positive transactions
      }
      
      // Check for suspiciously high velocity
      if (recentPositiveTransactions.length > 40) {
        return {
          type: RiskFactorType.SUSPICIOUS_POINTS_ACTIVITY,
          severity: RiskSeverity.HIGH,
          description: `High velocity: ${recentPositiveTransactions.length} point-earning activities in 24h`,
          score: 30
        };
      }
      
      // Check for large single-source concentration
      const pointsBySource = recentPositiveTransactions.reduce((acc, tx) => {
        acc[tx.source] = (acc[tx.source] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
      
      // Calculate total points earned
      const totalPoints = Object.values(pointsBySource).reduce((sum, amount) => sum + amount, 0);
      
      // Check if any single source accounts for more than 90% of total points
      for (const [source, amount] of Object.entries(pointsBySource)) {
        const percentage = (amount / totalPoints) * 100;
        if (percentage > 90 && totalPoints > 1000) {
          return {
            type: RiskFactorType.SUSPICIOUS_POINTS_ACTIVITY,
            severity: RiskSeverity.HIGH,
            description: `${Math.round(percentage)}% of points from single source (${source})`,
            score: 35
          };
        }
      }
      
      // Check for unusual amount in a single transaction
      const largestTransaction = recentPositiveTransactions.reduce(
        (largest, tx) => tx.amount > largest.amount ? tx : largest, 
        { amount: 0 }
      );
      
      if (largestTransaction.amount > 5000) { // Very large single transaction
        return {
          type: RiskFactorType.SUSPICIOUS_POINTS_ACTIVITY,
          severity: RiskSeverity.MEDIUM,
          description: `Unusually large transaction of ${largestTransaction.amount} points`,
          score: 20
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
      // Check for suspicious wallet patterns

      // 1. Check if wallet has been used for multiple redemptions by different users
      // This requires checking if the wallet is linked to multiple user accounts
      // We would need additional repository access for this - for now this is a simplified implementation
      
      // 2. Check previous redemption patterns with this wallet
      const walletRedemptions = await this.redemptionRepository.findByWalletAddress(walletAddress);
      
      // Check if this wallet has failed redemptions
      const failedRedemptions = walletRedemptions.filter(r => r.status === 'failed');
      if (failedRedemptions.length >= 2) {
        return {
          type: RiskFactorType.WALLET_RISK,
          severity: RiskSeverity.HIGH,
          description: `Wallet has ${failedRedemptions.length} failed redemptions`,
          score: 35
        };
      }
      
      // Check for rapid redemption velocity from this wallet
      if (walletRedemptions.length >= 5) {
        const last24HoursRedemptions = walletRedemptions.filter(r => {
          const redemptionTime = new Date(r.requestedAt).getTime();
          return (Date.now() - redemptionTime) < 24 * 60 * 60 * 1000;
        });
        
        if (last24HoursRedemptions.length >= 3) {
          return {
            type: RiskFactorType.WALLET_RISK,
            severity: RiskSeverity.MEDIUM,
            description: `High velocity: ${last24HoursRedemptions.length} redemptions in 24h to this wallet`,
            score: 25
          };
        }
      }
      
      // 3. Check for new wallet (first time used)
      if (walletRedemptions.length === 0) {
        return {
          type: RiskFactorType.WALLET_RISK,
          severity: RiskSeverity.LOW,
          description: 'First redemption to this wallet address',
          score: 10
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error assessing wallet risk', { error, walletAddress });
      return null;
    }
  }
}
