/**
 * Redemption Service
 * 
 * Handles the conversion of Success Points to tokens,
 * including validation, transaction processing, and record keeping.
 */
import { v4 as uuidv4 } from 'uuid';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { WalletConnectionRepository } from '../../repositories/wallet-connection-repository';
import { eventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { PointsConfig } from './points-service';
import { getRedisClient } from '../../lib/db-client';

/**
 * Redemption status enum
 */
export enum RedemptionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Redemption record interface
 */
export interface RedemptionRecord {
  id: string;
  userId: string;
  pointsAmount: number;
  tokenAmount: number;
  walletAddress: string;
  status: RedemptionStatus;
  requestedAt: Date;
  processedAt?: Date;
  transactionHash?: string;
  failureReason?: string;
}

/**
 * Eligibility response interface
 */
export interface EligibilityResponse {
  isEligible: boolean;
  requirements: {
    minimumBalance: number;
    walletConnected: boolean;
    verificationComplete: boolean;
  };
  limits: {
    conversionRate: number;
    minimumAmount: number;
    weeklyLimit: number;
    weeklyUsed: number;
    remaining: number;
    resetsAt: string;
  };
  balance: {
    current: number;
    pending: number;
  };
}

/**
 * Redemption request response
 */
export interface RedemptionResponse {
  success: boolean;
  redemptionId?: string;
  status?: RedemptionStatus;
  pointsAmount?: number;
  tokenAmount?: number;
  walletAddress?: string;
  estimatedProcessingTime?: string;
  reason?: string;
}

/**
 * Service to handle points-to-token redemptions
 */
export class RedemptionService {
  private redis = getRedisClient();
  
  constructor(
    private userPointsRepository: UserPointsRepository,
    private walletConnectionRepository: WalletConnectionRepository,
    private config: PointsConfig
  ) {}

  /**
   * Request redemption of points for tokens
   */
  async requestRedemption(
    userId: string,
    pointsAmount: number,
    walletAddress?: string
  ): Promise<RedemptionResponse> {
    try {
      // Validate amount
      if (pointsAmount < this.config.minimumRedemptionAmount) {
        return {
          success: false,
          reason: `Minimum redemption amount is ${this.config.minimumRedemptionAmount} points`
        };
      }

      // Check if user has sufficient balance
      const balance = await this.userPointsRepository.getUserPointsBalance(userId);
      if (balance < pointsAmount) {
        return {
          success: false,
          reason: 'Insufficient points balance'
        };
      }

      // Check weekly redemption cap
      const redeemedThisWeek = await this.userPointsRepository.getPointsRedeemedThisWeek(userId);
      if (redeemedThisWeek + pointsAmount > this.config.weeklyRedemptionCap) {
        return {
          success: false,
          reason: `Weekly redemption cap of ${this.config.weeklyRedemptionCap} points exceeded`
        };
      }

      // Get connected wallet if not provided
      let finalWalletAddress = walletAddress;
      if (!finalWalletAddress) {
        const walletConnections = await this.walletConnectionRepository.findByUserId(userId);
        if (walletConnections.length === 0) {
          return {
            success: false,
            reason: 'No wallet connected. Please connect a wallet to redeem points.'
          };
        }
        finalWalletAddress = walletConnections[0].wallet_address;
      } else {
        // Verify wallet belongs to user
        const verifiedWallet = await this.walletConnectionRepository.findByAddress(finalWalletAddress);
        if (!verifiedWallet || verifiedWallet.user_id !== userId) {
          return {
            success: false,
            reason: 'Wallet address not verified for this user'
          };
        }
      }

      // Calculate token amount
      const tokenAmount = pointsAmount / this.config.conversionRate;

      // Create redemption ID
      const redemptionId = uuidv4();

      // Record redemption
      const redemptionRecord: RedemptionRecord = {
        id: redemptionId,
        userId,
        pointsAmount,
        tokenAmount,
        walletAddress: finalWalletAddress,
        status: RedemptionStatus.PENDING,
        requestedAt: new Date()
      };

      // Store in Redis for processing
      await this.redis.set(
        `redemption:${redemptionId}`, 
        JSON.stringify(redemptionRecord),
        'EX',
        60 * 60 * 24 * 7 // 7 days expiry
      );

      // Add to processing queue
      await this.redis.lpush('redemption:queue', redemptionId);

      // Deduct points immediately
      await this.userPointsRepository.awardPoints({
        user_id: userId,
        amount: -pointsAmount,
        source: 'redemption',
        reference_id: redemptionId,
        description: `Redemption request for ${tokenAmount} tokens`
      });

      // Publish event for real-time updates
      await eventBus.publish(EventType.POINTS_REDEEMED, {
        userId,
        pointsAmount,
        tokenAmount,
        redemptionId,
        walletAddress: finalWalletAddress,
        status: RedemptionStatus.PENDING,
        timestamp: new Date().toISOString()
      });

      // Return response
      return {
        success: true,
        redemptionId,
        status: RedemptionStatus.PENDING,
        pointsAmount,
        tokenAmount,
        walletAddress: finalWalletAddress,
        estimatedProcessingTime: '24 hours' // Placeholder
      };
    } catch (error) {
      logger.error('Error processing redemption request', { error, userId, pointsAmount });
      
      return {
        success: false,
        reason: 'An error occurred processing your redemption request'
      };
    }
  }

  /**
   * Get user's redemption eligibility
   */
  async getEligibility(userId: string): Promise<EligibilityResponse> {
    try {
      // Get user's points balance
      const balance = await this.userPointsRepository.getUserPointsBalance(userId);
      
      // Get wallet connection status
      const walletConnections = await this.walletConnectionRepository.findByUserId(userId);
      const walletConnected = walletConnections.length > 0;
      
      // Get points redeemed this week
      const redeemedThisWeek = await this.userPointsRepository.getPointsRedeemedThisWeek(userId);
      
      // Get pending redemptions
      const pendingRedemptions = await this.getPendingRedemptions(userId);
      const pendingAmount = pendingRedemptions.reduce((sum, r) => sum + r.pointsAmount, 0);
      
      // Calculate when weekly limit resets
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const daysUntilSunday = (7 - dayOfWeek) % 7;
      const resetsAt = new Date(now);
      resetsAt.setUTCDate(now.getUTCDate() + daysUntilSunday);
      resetsAt.setUTCHours(0, 0, 0, 0);
      
      // Check if eligible
      const isEligible = 
        balance >= this.config.minimumRedemptionAmount &&
        walletConnected &&
        redeemedThisWeek < this.config.weeklyRedemptionCap;
      
      return {
        isEligible,
        requirements: {
          minimumBalance: this.config.minimumRedemptionAmount,
          walletConnected: walletConnected,
          verificationComplete: true // Placeholder, would be verification status
        },
        limits: {
          conversionRate: this.config.conversionRate,
          minimumAmount: this.config.minimumRedemptionAmount,
          weeklyLimit: this.config.weeklyRedemptionCap,
          weeklyUsed: redeemedThisWeek,
          remaining: Math.max(0, this.config.weeklyRedemptionCap - redeemedThisWeek),
          resetsAt: resetsAt.toISOString()
        },
        balance: {
          current: balance,
          pending: pendingAmount
        }
      };
    } catch (error) {
      logger.error('Error getting redemption eligibility', { error, userId });
      
      // Return default response on error
      return {
        isEligible: false,
        requirements: {
          minimumBalance: this.config.minimumRedemptionAmount,
          walletConnected: false,
          verificationComplete: false
        },
        limits: {
          conversionRate: this.config.conversionRate,
          minimumAmount: this.config.minimumRedemptionAmount,
          weeklyLimit: this.config.weeklyRedemptionCap,
          weeklyUsed: 0,
          remaining: this.config.weeklyRedemptionCap,
          resetsAt: new Date().toISOString()
        },
        balance: {
          current: 0,
          pending: 0
        }
      };
    }
  }

  /**
   * Get redemption status by ID
   */
  async getRedemptionStatus(redemptionId: string): Promise<RedemptionRecord | null> {
    try {
      const data = await this.redis.get(`redemption:${redemptionId}`);
      
      if (!data) {
        return null;
      }
      
      const redemption = JSON.parse(data) as RedemptionRecord;
      
      // Ensure dates are Date objects
      redemption.requestedAt = new Date(redemption.requestedAt);
      if (redemption.processedAt) {
        redemption.processedAt = new Date(redemption.processedAt);
      }
      
      return redemption;
    } catch (error) {
      logger.error('Error getting redemption status', { error, redemptionId });
      return null;
    }
  }

  /**
   * Get user's redemption history
   */
  async getRedemptionHistory(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<RedemptionRecord[]> {
    try {
      // In a real implementation, this would query a database table
      // For now, we'll look for all redemptions in Redis for this user
      const redemptionIds = await this.redis.keys(`redemption:*`);
      const redemptions: RedemptionRecord[] = [];
      
      for (const key of redemptionIds) {
        if (key === 'redemption:queue') continue;
        
        const data = await this.redis.get(key);
        if (data) {
          const redemption = JSON.parse(data) as RedemptionRecord;
          if (redemption.userId === userId) {
            // Ensure dates are Date objects
            redemption.requestedAt = new Date(redemption.requestedAt);
            if (redemption.processedAt) {
              redemption.processedAt = new Date(redemption.processedAt);
            }
            
            redemptions.push(redemption);
          }
        }
      }
      
      // Sort by requested date, newest first
      redemptions.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
      
      // Apply pagination
      const { limit = 20, offset = 0 } = options;
      return redemptions.slice(offset, offset + limit);
    } catch (error) {
      logger.error('Error getting redemption history', { error, userId });
      return [];
    }
  }

  /**
   * Get pending redemptions for a user
   */
  private async getPendingRedemptions(userId: string): Promise<RedemptionRecord[]> {
    try {
      const redemptions = await this.getRedemptionHistory(userId);
      return redemptions.filter(r => r.status === RedemptionStatus.PENDING || r.status === RedemptionStatus.PROCESSING);
    } catch (error) {
      logger.error('Error getting pending redemptions', { error, userId });
      return [];
    }
  }
}
