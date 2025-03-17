/**
 * Referral Services
 * 
 * Factory functions and exports for referral-related services
 */
import { ReferralService } from './referral-service';
import { ReferralCodeService } from './code-service';
import { ReferralCampaignService } from './campaign-service';
import { ReferralRewardService } from './rewards/reward-service';
import { ReferralNetworkService } from './multilevel/network-service';
import { ReferralAnalyticsService } from './analytics/analytics-service';
import { ReferralProtectionService } from './protection/protection-service';
import { ReferralRateLimiter } from './protection/rate-limiter';
import { ReferralStatusService } from './status/status-service';

import { ReferralRepository, ReferralCodeRepository, ReferralCampaignRepository } from '../../repositories/referral';
import { PointsService } from '../points/points-service';
import { NotificationService } from '../notification/notification-service';
import { EventBus } from '../../lib/event-bus';
import { db } from '../../database';
import { Redis } from 'ioredis';

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get Redis client
 * 
 * @returns Redis client
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  return redisClient;
}

// Service singletons
let referralService: ReferralService | null = null;
let referralCodeService: ReferralCodeService | null = null;
let referralCampaignService: ReferralCampaignService | null = null;
let referralRewardService: ReferralRewardService | null = null;
let referralNetworkService: ReferralNetworkService | null = null;
let referralAnalyticsService: ReferralAnalyticsService | null = null;
let referralProtectionService: ReferralProtectionService | null = null;
let referralRateLimiter: ReferralRateLimiter | null = null;
let referralStatusService: ReferralStatusService | null = null;

/**
 * Get ReferralService instance
 * 
 * @returns ReferralService
 */
export function getReferralService(): ReferralService {
  if (!referralService) {
    const referralRepository = new ReferralRepository(db);
    const referralCodeRepository = new ReferralCodeRepository(db);
    const referralCampaignRepository = new ReferralCampaignRepository(db);
    const eventBus = EventBus.getInstance();
    const verifier = getReferralVerifier();
    
    referralService = new ReferralService(
      referralRepository,
      referralCodeRepository,
      referralCampaignRepository,
      getPointsService(),
      eventBus,
      verifier
    );
  }
  
  return referralService;
}

/**
 * Get ReferralCodeService instance
 * 
 * @returns ReferralCodeService
 */
export function getReferralCodeService(): ReferralCodeService {
  if (!referralCodeService) {
    const referralCodeRepository = new ReferralCodeRepository(db);
    const referralCampaignRepository = new ReferralCampaignRepository(db);
    const eventBus = EventBus.getInstance();
    
    referralCodeService = new ReferralCodeService(
      referralCodeRepository,
      referralCampaignRepository,
      eventBus
    );
  }
  
  return referralCodeService;
}

/**
 * Get ReferralCampaignService instance
 * 
 * @returns ReferralCampaignService
 */
export function getReferralCampaignService(): ReferralCampaignService {
  if (!referralCampaignService) {
    const referralCampaignRepository = new ReferralCampaignRepository(db);
    const referralRepository = new ReferralRepository(db);
    const eventBus = EventBus.getInstance();
    
    referralCampaignService = new ReferralCampaignService(
      referralCampaignRepository,
      referralRepository,
      eventBus
    );
  }
  
  return referralCampaignService;
}

/**
 * Get ReferralRewardService instance
 * 
 * @returns ReferralRewardService
 */
export function getReferralRewardService(): ReferralRewardService {
  if (!referralRewardService) {
    const referralRepository = new ReferralRepository(db);
    const referralCodeRepository = new ReferralCodeRepository(db);
    const pointsService = getPointsService();
    const eventBus = EventBus.getInstance();
    
    referralRewardService = new ReferralRewardService(
      referralRepository,
      referralCodeRepository,
      pointsService,
      eventBus
    );
  }
  
  return referralRewardService;
}

/**
 * Get ReferralNetworkService instance
 * 
 * @returns ReferralNetworkService
 */
export function getReferralNetworkService(): ReferralNetworkService {
  if (!referralNetworkService) {
    const referralRepository = new ReferralRepository(db);
    const pointsService = getPointsService();
    const eventBus = EventBus.getInstance();
    
    referralNetworkService = new ReferralNetworkService(
      referralRepository,
      pointsService,
      eventBus
    );
  }
  
  return referralNetworkService;
}

/**
 * Get ReferralAnalyticsService instance
 * 
 * @returns ReferralAnalyticsService
 */
export function getReferralAnalyticsService(): ReferralAnalyticsService {
  if (!referralAnalyticsService) {
    const referralRepository = new ReferralRepository(db);
    const referralCodeRepository = new ReferralCodeRepository(db);
    const referralCampaignRepository = new ReferralCampaignRepository(db);
    
    referralAnalyticsService = new ReferralAnalyticsService(
      referralRepository,
      referralCodeRepository,
      referralCampaignRepository
    );
  }
  
  return referralAnalyticsService;
}

/**
 * Get ReferralProtectionService instance
 * 
 * @returns ReferralProtectionService
 */
export function getReferralProtectionService(): ReferralProtectionService {
  if (!referralProtectionService) {
    const referralRepository = new ReferralRepository(db);
    const redis = getRedisClient();
    const eventBus = EventBus.getInstance();
    
    referralProtectionService = new ReferralProtectionService(
      referralRepository,
      redis,
      eventBus
    );
  }
  
  return referralProtectionService;
}

/**
 * Get ReferralRateLimiter instance
 * 
 * @returns ReferralRateLimiter
 */
export function getReferralRateLimiter(): ReferralRateLimiter {
  if (!referralRateLimiter) {
    const redis = getRedisClient();
    const eventBus = EventBus.getInstance();
    
    referralRateLimiter = new ReferralRateLimiter(
      redis,
      eventBus
    );
  }
  
  return referralRateLimiter;
}

/**
 * Get ReferralStatusService instance
 * 
 * @returns ReferralStatusService
 */
export function getReferralStatusService(): ReferralStatusService {
  if (!referralStatusService) {
    const referralRepository = new ReferralRepository(db);
    const notificationService = getNotificationService();
    const eventBus = EventBus.getInstance();
    
    referralStatusService = new ReferralStatusService(
      referralRepository,
      notificationService,
      eventBus
    );
  }
  
  return referralStatusService;
}

/**
 * Get ReferralVerifier instance
 * 
 * @returns ReferralVerifier
 */
export function getReferralVerifier() {
  const referralRepository = new ReferralRepository(db);
  return new ReferralVerifier(referralRepository);
}

/**
 * Get PointsService instance
 * 
 * This is a placeholder. In a real implementation, this would be
 * imported from the points service module.
 * 
 * @returns PointsService
 */
function getPointsService(): any {
  // This is a placeholder for the actual points service
  return {
    awardPoints: async (params: any) => {
      return { success: true };
    },
    getUserTotalPoints: async (userId: string) => {
      return Math.floor(Math.random() * 2000);
    }
  };
}

/**
 * Get NotificationService instance
 * 
 * This is a placeholder. In a real implementation, this would be
 * imported from the notification service module.
 * 
 * @returns NotificationService
 */
function getNotificationService(): any {
  // This is a placeholder for the actual notification service
  return {
    sendNotification: async (params: any) => {
      return { success: true, channels: ['in-app'] };
    }
  };
}

// Import types from Referral Verifier
// This is to avoid circular dependencies
class ReferralVerifier {
  constructor(private referralRepository: ReferralRepository) {}
  
  async verifyReferral(referralId: string): Promise<any> {
    // Simplified implementation
    return { legitimate: true, confidenceScore: 1.0, signals: [], decision: 'approve' };
  }
}
