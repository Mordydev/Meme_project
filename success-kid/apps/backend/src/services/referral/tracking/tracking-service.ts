/**
 * Referral Tracking Service
 * 
 * Handles tracking and attribution of referral visits
 */
import { Redis } from 'ioredis';
import { ReferralCodeRepository } from '../../../repositories/referral';
import { logger } from '../../../lib/logger';
import { EventBus } from '../../../lib/event-bus';
import { NotFoundError } from '../../../errors';

/**
 * Visitor data for tracking
 */
export interface VisitorData {
  visitorId: string;
  ipHash: string;
  userAgent: string;
  landingPage: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

/**
 * Tracking data stored in Redis
 */
interface StoredTrackingData {
  code: string;
  referrerId: string;
  visitorId: string;
  ipHash: string;
  userAgent: string;
  landingPage: string;
  timestamp: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

/**
 * Attribution result
 */
export interface AttributionResult {
  success: boolean;
  referrerId?: string;
  referralCode?: string;
  source?: string;
}

/**
 * Tracking service for referral visits and attribution
 */
export class ReferralTrackingService {
  /**
   * Default expiration time for tracking data (7 days)
   */
  private readonly trackingExpiration = 60 * 60 * 24 * 7; // 7 days in seconds

  /**
   * Create a new ReferralTrackingService instance
   */
  constructor(
    private referralCodeRepository: ReferralCodeRepository,
    private redis: Redis,
    private eventBus: EventBus
  ) {}

  /**
   * Track a referral link visit
   * 
   * @param code Referral code
   * @param visitorData Visitor data
   * @returns Tracking result
   */
  async trackVisit(code: string, visitorData: VisitorData): Promise<{
    success: boolean;
    referrerId?: string;
    code?: string;
  }> {
    try {
      // Verify the referral code exists
      const referralCode = await this.referralCodeRepository.findByCode(code);
      if (!referralCode) {
        throw new NotFoundError('Referral code', code);
      }

      // Store tracking data in Redis
      const trackingData: StoredTrackingData = {
        code,
        referrerId: referralCode.user_id,
        visitorId: visitorData.visitorId,
        ipHash: visitorData.ipHash,
        userAgent: visitorData.userAgent,
        landingPage: visitorData.landingPage,
        timestamp: new Date().toISOString(),
        utmSource: visitorData.utmSource,
        utmMedium: visitorData.utmMedium,
        utmCampaign: visitorData.utmCampaign,
        referrer: visitorData.referrer
      };

      // Store by visitor ID for later attribution
      await this.redis.setex(
        `referral:tracking:visitor:${visitorData.visitorId}`,
        this.trackingExpiration,
        JSON.stringify(trackingData)
      );

      // Store by IP hash as a fallback
      await this.redis.setex(
        `referral:tracking:ip:${visitorData.ipHash}`,
        this.trackingExpiration,
        JSON.stringify(trackingData)
      );

      // Emit tracking event
      await this.eventBus.publish('referral.link_visited', {
        code,
        referrerId: referralCode.user_id,
        visitorId: visitorData.visitorId,
        landingPage: visitorData.landingPage,
        timestamp: trackingData.timestamp
      });

      logger.info(`Tracked referral visit: ${code}`, {
        referrerId: referralCode.user_id,
        visitorId: visitorData.visitorId
      });

      return {
        success: true,
        referrerId: referralCode.user_id,
        code
      };
    } catch (error) {
      logger.error('Failed to track referral visit', {
        code,
        visitorId: visitorData.visitorId,
        error
      });

      if (error instanceof NotFoundError) {
        return { success: false };
      }

      throw error;
    }
  }

  /**
   * Find attribution data for a new user
   * 
   * @param userId New user ID
   * @param visitorId Visitor ID from cookie/localStorage
   * @param ipHash Hash of the user's IP address
   * @param userAgent User agent string
   * @returns Attribution result
   */
  async findAttribution(
    userId: string,
    visitorId?: string,
    ipHash?: string,
    userAgent?: string
  ): Promise<AttributionResult> {
    try {
      let trackingData: StoredTrackingData | null = null;

      // Try to find tracking data by visitor ID
      if (visitorId) {
        const data = await this.redis.get(`referral:tracking:visitor:${visitorId}`);
        if (data) {
          trackingData = JSON.parse(data);
        }
      }

      // If no data found, try by IP hash
      if (!trackingData && ipHash) {
        const data = await this.redis.get(`referral:tracking:ip:${ipHash}`);
        if (data) {
          trackingData = JSON.parse(data);
        }
      }

      // If no tracking data found, no attribution
      if (!trackingData) {
        return { success: false };
      }

      // Emit attribution event
      await this.eventBus.publish('referral.attribution_found', {
        userId,
        referrerId: trackingData.referrerId,
        referralCode: trackingData.code,
        source: trackingData.utmSource || 'direct',
        visitorId: trackingData.visitorId
      });

      logger.info(`Attribution found for user ${userId}`, {
        referrerId: trackingData.referrerId,
        code: trackingData.code
      });

      return {
        success: true,
        referrerId: trackingData.referrerId,
        referralCode: trackingData.code,
        source: trackingData.utmSource || 'direct'
      };
    } catch (error) {
      logger.error('Failed to find attribution', {
        userId,
        visitorId,
        ipHash,
        error
      });

      return { success: false };
    }
  }

  /**
   * Clear tracking data for a visitor
   * 
   * @param visitorId Visitor ID
   * @param ipHash IP hash
   */
  async clearTrackingData(visitorId?: string, ipHash?: string): Promise<void> {
    try {
      if (visitorId) {
        await this.redis.del(`referral:tracking:visitor:${visitorId}`);
      }

      if (ipHash) {
        await this.redis.del(`referral:tracking:ip:${ipHash}`);
      }
    } catch (error) {
      logger.error('Failed to clear tracking data', {
        visitorId,
        ipHash,
        error
      });
    }
  }

  /**
   * Store a custom attribution
   * 
   * @param userId User ID
   * @param referralCode Referral code
   * @returns Whether the attribution was stored
   */
  async storeCustomAttribution(userId: string, referralCode: string): Promise<boolean> {
    try {
      // Verify the referral code exists
      const code = await this.referralCodeRepository.findByCode(referralCode);
      if (!code) {
        return false;
      }

      // Store the custom attribution for a short time (1 hour)
      await this.redis.setex(
        `referral:custom_attribution:${userId}`,
        3600, // 1 hour
        JSON.stringify({
          referrerId: code.user_id,
          referralCode,
          timestamp: new Date().toISOString()
        })
      );

      return true;
    } catch (error) {
      logger.error('Failed to store custom attribution', {
        userId,
        referralCode,
        error
      });
      return false;
    }
  }

  /**
   * Get custom attribution for a user
   * 
   * @param userId User ID
   * @returns Attribution data or null if not found
   */
  async getCustomAttribution(userId: string): Promise<{
    referrerId: string;
    referralCode: string;
  } | null> {
    try {
      const data = await this.redis.get(`referral:custom_attribution:${userId}`);
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to get custom attribution', {
        userId,
        error
      });
      return null;
    }
  }
}
