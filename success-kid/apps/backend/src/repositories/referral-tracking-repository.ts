/**
 * Referral Tracking Repository
 * 
 * Handles data access for referral tracking
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  ReferralTracking, 
  CreateReferralTrackingDto, 
  UpdateReferralTrackingDto 
} from '../models/referral-tracking';
import { logger } from '../lib/logger';

export class ReferralTrackingRepository extends BaseRepository<ReferralTracking> {
  constructor(db: Pool) {
    super(db, 'referral_tracking', 'id');
  }
  
  /**
   * Create a new tracking record
   */
  async createTracking(dto: CreateReferralTrackingDto): Promise<ReferralTracking> {
    try {
      const query = `
        INSERT INTO referral_tracking
        (id, referral_code, referrer_id, visitor_id, ip_hash, user_agent, landing_page, created_at, 
         utm_source, utm_medium, utm_campaign)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralTracking>(query, [
        dto.referral_code,
        dto.referrer_id,
        dto.visitor_id || null,
        dto.ip_hash,
        dto.user_agent,
        dto.landing_page,
        dto.utm_source || null,
        dto.utm_medium || null,
        dto.utm_campaign || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating referral tracking', { error, dto });
      throw error;
    }
  }
  
  /**
   * Record a conversion for tracking
   */
  async recordConversion(
    trackingId: string, 
    userId: string
  ): Promise<ReferralTracking | null> {
    try {
      const query = `
        UPDATE referral_tracking
        SET converted_user_id = $1, conversion_date = NOW()
        WHERE id = $2 AND converted_user_id IS NULL
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralTracking>(query, [userId, trackingId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error recording referral conversion', { error, trackingId, userId });
      throw error;
    }
  }
  
  /**
   * Find tracking by visitor ID
   */
  async findByVisitorId(visitorId: string): Promise<ReferralTracking | null> {
    try {
      // Prioritize most recent tracking with this visitor ID
      const query = `
        SELECT * FROM referral_tracking
        WHERE visitor_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const result = await this.db.query<ReferralTracking>(query, [visitorId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding tracking by visitor ID', { error, visitorId });
      throw error;
    }
  }
  
  /**
   * Find tracking by IP hash and user agent
   */
  async findByUserData(
    ipHash: string, 
    userAgent: string, 
    options: { maxAgeDays?: number } = {}
  ): Promise<ReferralTracking | null> {
    try {
      let query = `
        SELECT * FROM referral_tracking
        WHERE ip_hash = $1 AND user_agent = $2
      `;
      
      // Add age limit if specified
      if (options.maxAgeDays) {
        query += ` AND created_at > NOW() - INTERVAL '${options.maxAgeDays} days'`;
      }
      
      query += ` ORDER BY created_at DESC LIMIT 1`;
      
      const result = await this.db.query<ReferralTracking>(query, [ipHash, userAgent]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding tracking by user data', { error, ipHash, userAgent });
      throw error;
    }
  }
  
  /**
   * Get referral statistics for a user
   */
  async getReferralStats(referrerId: string): Promise<{
    totalVisits: number;
    uniqueVisitors: number;
    conversions: number;
    conversionRate: number;
  }> {
    try {
      // Get total visits
      const visitsQuery = `
        SELECT COUNT(*) as count 
        FROM referral_tracking 
        WHERE referrer_id = $1
      `;
      const visitsResult = await this.db.query<{ count: string }>(visitsQuery, [referrerId]);
      const totalVisits = parseInt(visitsResult.rows[0]?.count || '0', 10);
      
      // Get unique visitors (approximate based on visitor_id or ip_hash)
      const uniqueVisitorsQuery = `
        SELECT COUNT(DISTINCT COALESCE(visitor_id, ip_hash)) as count 
        FROM referral_tracking 
        WHERE referrer_id = $1
      `;
      const uniqueVisitorsResult = await this.db.query<{ count: string }>(uniqueVisitorsQuery, [referrerId]);
      const uniqueVisitors = parseInt(uniqueVisitorsResult.rows[0]?.count || '0', 10);
      
      // Get conversions
      const conversionsQuery = `
        SELECT COUNT(*) as count 
        FROM referral_tracking 
        WHERE referrer_id = $1 AND converted_user_id IS NOT NULL
      `;
      const conversionsResult = await this.db.query<{ count: string }>(conversionsQuery, [referrerId]);
      const conversions = parseInt(conversionsResult.rows[0]?.count || '0', 10);
      
      // Calculate conversion rate
      const conversionRate = totalVisits > 0 ? (conversions / totalVisits) * 100 : 0;
      
      return {
        totalVisits,
        uniqueVisitors,
        conversions,
        conversionRate
      };
    } catch (error) {
      logger.error('Error getting referral statistics', { error, referrerId });
      throw error;
    }
  }
  
  /**
   * Get referral conversions for a user
   */
  async getReferralConversions(
    referrerId: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ 
    data: (ReferralTracking & { referee_name?: string })[];
    total: number; 
  }> {
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      
      // Get conversions with basic user info
      const query = `
        SELECT rt.*, u.display_name as referee_name
        FROM referral_tracking rt
        LEFT JOIN users u ON rt.converted_user_id = u.id
        WHERE rt.referrer_id = $1 AND rt.converted_user_id IS NOT NULL
        ORDER BY rt.conversion_date DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query<ReferralTracking & { referee_name?: string }>(
        query, 
        [referrerId, limit, offset]
      );
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM referral_tracking
        WHERE referrer_id = $1 AND converted_user_id IS NOT NULL
      `;
      
      const countResult = await this.db.query<{ count: string }>(countQuery, [referrerId]);
      const total = parseInt(countResult.rows[0]?.count || '0', 10);
      
      return {
        data: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error getting referral conversions', { error, referrerId });
      throw error;
    }
  }
  
  /**
   * Find tracking records by referral code
   */
  async findByReferralCode(
    code: string,
    options: { limit?: number; offset?: number; convertedOnly?: boolean } = {}
  ): Promise<{ 
    data: ReferralTracking[];
    total: number; 
  }> {
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      
      let query = `
        SELECT *
        FROM referral_tracking
        WHERE referral_code = $1
      `;
      
      if (options.convertedOnly) {
        query += ' AND converted_user_id IS NOT NULL';
      }
      
      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      
      const result = await this.db.query<ReferralTracking>(query, [code, limit, offset]);
      
      // Get total count
      let countQuery = `
        SELECT COUNT(*) as count
        FROM referral_tracking
        WHERE referral_code = $1
      `;
      
      if (options.convertedOnly) {
        countQuery += ' AND converted_user_id IS NOT NULL';
      }
      
      const countResult = await this.db.query<{ count: string }>(countQuery, [code]);
      const total = parseInt(countResult.rows[0]?.count || '0', 10);
      
      return {
        data: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error finding tracking by referral code', { error, code });
      throw error;
    }
  }
}
