/**
 * Fraud Prevention Service
 * 
 * Analyzes redemption requests for potential fraud or suspicious activity.
 */
import { logger } from '../../../lib/logger';
import { RedemptionRequest } from '../../../models/entities/redemption';
import { EnhancedPointsService } from '../points-service-enhanced';
import { isValidAddress } from '../../../blockchain/utils/address';
import { RedemptionRepository } from '../../../repositories/redemption-repository';
import { UserRepository } from '../../../repositories/user-repository';
import { ProfileRepository } from '../../../repositories/profile-repository';
import { RedisService } from '../../../lib/redis-service';
import { IPLookupService } from '../../../services/iplookup-service';
import { RiskScorer } from '../../../services/risk-scorer';

/**
 * Risk factor type
 */
export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  score: number;
}

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  recommendation: 'allow' | 'review' | 'block';
  timestamp: Date;
}

/**
 * Velocity type
 */
export enum VelocityType {
  NORMAL = 'normal',
  HIGH = 'high',
  SUSPICIOUS = 'suspicious'
}

/**
 * Velocity check result
 */
export interface VelocityCheckResult {
  type: VelocityType;
  count: number;
  period: string;
  threshold: number;
}

/**
 * Fraud Prevention Service
 */
export class FraudPreventionService {
  // Risk thresholds
  private readonly MEDIUM_RISK_THRESHOLD = 20;
  private readonly HIGH_RISK_THRESHOLD = 40;
  private readonly CRITICAL_RISK_THRESHOLD = 70;
  
  // Velocity thresholds
  private readonly REDEMPTION_VELOCITY_THRESHOLDS = {
    hourly: 3,   // 3 redemptions per hour is high
    daily: 5     // 5 redemptions per day is high
  };
  
  /**
   * Create fraud prevention service
   * 
   * @param userRepository User repository
   * @param profileRepository Profile repository
   * @param redisService Redis service
   * @param pointsService Points service
   * @param redemptionRepository Redemption repository
   * @param ipLookupService IP Lookup service
   * @param riskScorer Risk scorer
   */
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly redisService: RedisService,
    private readonly pointsService: EnhancedPointsService,
    private readonly redemptionRepository: RedemptionRepository,
    private readonly ipLookupService: IPLookupService,
    private readonly riskScorer: RiskScorer
  ) {}

  /**
   * Analyze redemption request for risk
   * 
   * @param request Redemption request
   * @returns Risk assessment
   */
  async analyzeRedemptionRequest(request: RedemptionRequest): Promise<RiskAssessment> {
    logger.info('Analyzing redemption request for risk', { 
      userId: request.userId,
      pointsAmount: request.pointsAmount
    });
    
    // Initialize assessment
    const assessment: RiskAssessment = {
      userId: request.userId,
      riskScore: 0,
      riskLevel: 'low',
      riskFactors: [],
      recommendation: 'allow',
      timestamp: new Date()
    };
    
    // Perform checks and add risk factors
    await this.checkAccountAge(assessment, request);
    await this.checkRedemptionVelocity(assessment, request);
    await this.checkPointsAccumulation(assessment, request);
    await this.checkRedemptionAmount(assessment, request);
    await this.checkWalletRisk(assessment, request);
    
    // Determine risk level based on score
    if (assessment.riskScore >= this.CRITICAL_RISK_THRESHOLD) {
      assessment.riskLevel = 'critical';
      assessment.recommendation = 'block';
    } else if (assessment.riskScore >= this.HIGH_RISK_THRESHOLD) {
      assessment.riskLevel = 'high';
      assessment.recommendation = 'review';
    } else if (assessment.riskScore >= this.MEDIUM_RISK_THRESHOLD) {
      assessment.riskLevel = 'medium';
      assessment.recommendation = 'allow';
    }
    
    logger.info('Redemption risk assessment complete', { 
      userId: request.userId,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      recommendation: assessment.recommendation,
      factorCount: assessment.riskFactors.length
    });
    
    return assessment;
  }

  /**
   * Record suspicious activity for further review
   * 
   * @param userId User ID
   * @param activity Activity description
   * @param riskLevel Risk level
   */
  async recordSuspiciousActivity(
    userId: string,
    activity: string,
    riskLevel: 'medium' | 'high' | 'critical'
  ): Promise<void> {
    // In a full implementation, this would write to a database
    // For now, just log it
    logger.warn('Suspicious activity recorded', {
      userId,
      activity,
      riskLevel,
      timestamp: new Date().toISOString()
    });
    
    // In a real implementation, we might also:
    // 1. Create a security alert
    // 2. Notify administrators
    // 3. Update user risk profile
    // 4. Apply account restrictions
  }

  /**
   * Get redemption velocity for a user
   * 
   * @param userId User ID
   * @returns Velocity check results
   */
  async getRedemptionVelocity(userId: string): Promise<{
    hourly: VelocityCheckResult;
    daily: VelocityCheckResult;
  }> {
    // Get timestamps for time periods
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get redemptions for time periods
    const hourlyRedemptions = await this.redemptionRepository.findByUserId(userId, {
      startDate: hourAgo,
      endDate: now
    });
    
    const dailyRedemptions = await this.redemptionRepository.findByUserId(userId, {
      startDate: dayAgo,
      endDate: now
    });
    
    // Determine velocity types
    const hourlyCount = hourlyRedemptions.length;
    const dailyCount = dailyRedemptions.length;
    
    const hourlyType = this.determineVelocityType(
      hourlyCount,
      this.REDEMPTION_VELOCITY_THRESHOLDS.hourly
    );
    
    const dailyType = this.determineVelocityType(
      dailyCount,
      this.REDEMPTION_VELOCITY_THRESHOLDS.daily
    );
    
    return {
      hourly: {
        type: hourlyType,
        count: hourlyCount,
        period: 'hour',
        threshold: this.REDEMPTION_VELOCITY_THRESHOLDS.hourly
      },
      daily: {
        type: dailyType,
        count: dailyCount,
        period: 'day',
        threshold: this.REDEMPTION_VELOCITY_THRESHOLDS.daily
      }
    };
  }

  /**
   * Check account age risk
   * 
   * @param assessment Risk assessment to update
   * @param request Redemption request
   */
  private async checkAccountAge(
    assessment: RiskAssessment,
    request: RedemptionRequest
  ): Promise<void> {
    try {
      // In a real implementation, get account age from user service
      // For now, we'll use a mock value
      const accountAgeDays = 15; // Mock value, replace with actual calculation
      
      if (accountAgeDays < 7) { // Less than a week
        assessment.riskScore += 30;
        assessment.riskFactors.push({
          type: 'new_account',
          severity: 'high',
          description: `Account age: ${accountAgeDays} days`,
          score: 30
        });
      } else if (accountAgeDays < 30) { // Less than a month
        assessment.riskScore += 15;
        assessment.riskFactors.push({
          type: 'recent_account',
          severity: 'medium',
          description: `Account age: ${accountAgeDays} days`,
          score: 15
        });
      }
    } catch (error) {
      logger.error('Error checking account age', { 
        userId: request.userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check redemption velocity risk
   * 
   * @param assessment Risk assessment to update
   * @param request Redemption request
   */
  private async checkRedemptionVelocity(
    assessment: RiskAssessment,
    request: RedemptionRequest
  ): Promise<void> {
    try {
      const velocity = await this.getRedemptionVelocity(request.userId);
      
      // Check hourly velocity
      if (velocity.hourly.type === VelocityType.SUSPICIOUS) {
        assessment.riskScore += 40;
        assessment.riskFactors.push({
          type: 'hourly_redemption_velocity',
          severity: 'high',
          description: `${velocity.hourly.count} redemptions in the last hour (threshold: ${velocity.hourly.threshold})`,
          score: 40
        });
      } else if (velocity.hourly.type === VelocityType.HIGH) {
        assessment.riskScore += 20;
        assessment.riskFactors.push({
          type: 'hourly_redemption_velocity',
          severity: 'medium',
          description: `${velocity.hourly.count} redemptions in the last hour (threshold: ${velocity.hourly.threshold})`,
          score: 20
        });
      }
      
      // Check daily velocity
      if (velocity.daily.type === VelocityType.SUSPICIOUS) {
        assessment.riskScore += 30;
        assessment.riskFactors.push({
          type: 'daily_redemption_velocity',
          severity: 'high',
          description: `${velocity.daily.count} redemptions in the last day (threshold: ${velocity.daily.threshold})`,
          score: 30
        });
      } else if (velocity.daily.type === VelocityType.HIGH) {
        assessment.riskScore += 15;
        assessment.riskFactors.push({
          type: 'daily_redemption_velocity',
          severity: 'medium',
          description: `${velocity.daily.count} redemptions in the last day (threshold: ${velocity.daily.threshold})`,
          score: 15
        });
      }
    } catch (error) {
      logger.error('Error checking redemption velocity', { 
        userId: request.userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check points accumulation pattern risk
   * 
   * @param assessment Risk assessment to update
   * @param request Redemption request
   */
  private async checkPointsAccumulation(
    assessment: RiskAssessment,
    request: RedemptionRequest
  ): Promise<void> {
    try {
      // In a real implementation, analyze points transaction history
      // For now, we'll use a mock example
      
      // Get recent points transactions (mock example)
      const recentPoints = 5000; // Mock value, replace with actual calculation
      const expectedMax = 2000; // Mock threshold, replace with dynamic calculation
      
      if (recentPoints > expectedMax * 2) {
        assessment.riskScore += 40;
        assessment.riskFactors.push({
          type: 'suspicious_points_accumulation',
          severity: 'high',
          description: `User accumulated ${recentPoints} points recently (expected max: ${expectedMax})`,
          score: 40
        });
      } else if (recentPoints > expectedMax) {
        assessment.riskScore += 20;
        assessment.riskFactors.push({
          type: 'high_points_accumulation',
          severity: 'medium',
          description: `User accumulated ${recentPoints} points recently (expected max: ${expectedMax})`,
          score: 20
        });
      }
    } catch (error) {
      logger.error('Error checking points accumulation', { 
        userId: request.userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check redemption amount risk
   * 
   * @param assessment Risk assessment to update
   * @param request Redemption request
   */
  private async checkRedemptionAmount(
    assessment: RiskAssessment,
    request: RedemptionRequest
  ): Promise<void> {
    try {
      // Get user balance
      const balance = await this.pointsService.getUserBalance(request.userId);
      
      // Calculate percentage of balance being redeemed
      const percentageOfBalance = (request.pointsAmount / balance) * 100;
      
      // High percentage redemptions may be suspicious
      if (percentageOfBalance > 90) {
        assessment.riskScore += 15;
        assessment.riskFactors.push({
          type: 'high_redemption_percentage',
          severity: 'medium',
          description: `Redeeming ${percentageOfBalance.toFixed(2)}% of total balance`,
          score: 15
        });
      }
      
      // Very large redemptions may be suspicious
      if (request.pointsAmount > 50000) { // 500 tokens
        assessment.riskScore += 20;
        assessment.riskFactors.push({
          type: 'large_redemption_amount',
          severity: 'medium',
          description: `Large redemption amount: ${request.pointsAmount} points`,
          score: 20
        });
      }
    } catch (error) {
      logger.error('Error checking redemption amount', { 
        userId: request.userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check wallet risk
   * 
   * @param assessment Risk assessment to update
   * @param request Redemption request
   */
  private async checkWalletRisk(
    assessment: RiskAssessment,
    request: RedemptionRequest
  ): Promise<void> {
    try {
      // Validate wallet address format
      if (!isValidAddress(request.walletAddress)) {
        assessment.riskScore += 50;
        assessment.riskFactors.push({
          type: 'invalid_wallet_format',
          severity: 'high',
          description: 'Invalid wallet address format',
          score: 50
        });
      }
      
      // In a full implementation, we would:
      // 1. Check wallet connection age
      // 2. Check wallet verification status
      // 3. Check for suspicious wallet activity
      // 4. Check against known bad wallet addresses
      
      // For now, we'll just do a simple check for new wallet connections
      // Mock implementation
      const walletIsNew = true; // Replace with actual check
      
      if (walletIsNew) {
        assessment.riskScore += 15;
        assessment.riskFactors.push({
          type: 'new_wallet_connection',
          severity: 'medium',
          description: 'Wallet was recently connected to the account',
          score: 15
        });
      }
    } catch (error) {
      logger.error('Error checking wallet risk', { 
        userId: request.userId,
        walletAddress: request.walletAddress,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Determine velocity type based on count and threshold
   * 
   * @param count Count value
   * @param threshold Threshold value
   * @returns Velocity type
   */
  private determineVelocityType(count: number, threshold: number): VelocityType {
    if (count >= threshold * 2) {
      return VelocityType.SUSPICIOUS;
    } else if (count >= threshold) {
      return VelocityType.HIGH;
    } else {
      return VelocityType.NORMAL;
    }
  }
}
