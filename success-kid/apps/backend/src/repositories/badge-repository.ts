/**
 * Badge Repository
 * 
 * Handles data access for badges and user badges
 */
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base-repository';
import { 
  Badge, 
  CreateBadgeDto, 
  UpdateBadgeDto,
  UserBadge,
  CreateUserBadgeDto,
  BadgeCategory,
  BadgeTier,
  badgeDbMapping,
  userBadgeDbMapping
} from '../models/badge';
import { logger } from '../lib/logger';

export class BadgeRepository extends BaseRepository<Badge> {
  constructor(db: Pool) {
    super(db, 'badges', 'id');
  }

  /**
   * Get all badges
   */
  async getBadges(
    filters: { 
      category?: BadgeCategory;
      tier?: BadgeTier;
      includeExpired?: boolean;
    } = {}
  ): Promise<Badge[]> {
    try {
      let query = `SELECT * FROM badges`;
      const queryParams: any[] = [];
      const conditions: string[] = [];
      
      if (filters.category) {
        conditions.push(`category = $${queryParams.length + 1}`);
        queryParams.push(filters.category);
      }
      
      if (filters.tier) {
        conditions.push(`tier = $${queryParams.length + 1}`);
        queryParams.push(filters.tier);
      }
      
      if (!filters.includeExpired) {
        conditions.push(`(available_until IS NULL OR available_until > NOW())`);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY display_priority DESC, tier DESC, name ASC`;
      
      const result = await this.db.query<Badge>(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error getting badges', { error, filters });
      throw error;
    }
  }

  /**
   * Create a new badge
   */
  async createBadge(data: CreateBadgeDto): Promise<Badge> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const query = `
        INSERT INTO badges (
          id, name, description, image_url, category, 
          tier, display_priority, created_at, requirements,
          limited_time, available_until
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        id,
        data.name,
        data.description,
        data.image_url,
        data.category,
        data.tier,
        data.display_priority,
        now,
        data.requirements || null,
        data.limited_time || false,
        data.available_until || null
      ];
      
      const result = await this.db.query<Badge>(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating badge', { error, data });
      throw error;
    }
  }

  /**
   * Update a badge
   */
  async updateBadge(id: string, data: UpdateBadgeDto): Promise<Badge | null> {
    try {
      // Build update parts
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Add field updates if they exist in the data
      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      
      if (data.image_url !== undefined) {
        updates.push(`image_url = $${paramIndex++}`);
        values.push(data.image_url);
      }
      
      if (data.category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(data.category);
      }
      
      if (data.tier !== undefined) {
        updates.push(`tier = $${paramIndex++}`);
        values.push(data.tier);
      }
      
      if (data.display_priority !== undefined) {
        updates.push(`display_priority = $${paramIndex++}`);
        values.push(data.display_priority);
      }
      
      if (data.requirements !== undefined) {
        updates.push(`requirements = $${paramIndex++}`);
        values.push(data.requirements);
      }
      
      if (data.limited_time !== undefined) {
        updates.push(`limited_time = $${paramIndex++}`);
        values.push(data.limited_time);
      }
      
      if (data.available_until !== undefined) {
        updates.push(`available_until = $${paramIndex++}`);
        values.push(data.available_until);
      }
      
      // Add ID for WHERE clause
      values.push(id);
      
      // Execute update if there are fields to update
      if (updates.length > 0) {
        const query = `
          UPDATE badges
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        const result = await this.db.query<Badge>(query, values);
        return result.rows[0] || null;
      }
      
      // If no fields to update, return the current badge
      return this.findById(id);
    } catch (error) {
      logger.error('Error updating badge', { error, id, data });
      throw error;
    }
  }

  /**
   * Get user badges
   */
  async getUserBadges(userId: string): Promise<(UserBadge & Badge)[]> {
    try {
      const query = `
        SELECT ub.*, b.name, b.description, b.image_url, b.category, 
               b.tier, b.display_priority, b.created_at, b.requirements,
               b.limited_time, b.available_until
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.awarded_at DESC
      `;
      
      const result = await this.db.query<UserBadge & Badge>(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user badges', { error, userId });
      throw error;
    }
  }

  /**
   * Get equipped user badges
   */
  async getUserEquippedBadges(userId: string): Promise<(UserBadge & Badge)[]> {
    try {
      const query = `
        SELECT ub.*, b.name, b.description, b.image_url, b.category, 
               b.tier, b.display_priority, b.created_at, b.requirements,
               b.limited_time, b.available_until
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1 AND ub.equipped = true
        ORDER BY b.display_priority DESC, b.tier DESC
      `;
      
      const result = await this.db.query<UserBadge & Badge>(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user equipped badges', { error, userId });
      throw error;
    }
  }

  /**
   * Check if user has badge
   */
  async userHasBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1 FROM user_badges
          WHERE user_id = $1 AND badge_id = $2
        ) AS has_badge
      `;
      
      const result = await this.db.query<{ has_badge: boolean }>(query, [userId, badgeId]);
      return result.rows[0].has_badge;
    } catch (error) {
      logger.error('Error checking if user has badge', { error, userId, badgeId });
      throw error;
    }
  }

  /**
   * Award badge to user
   */
  async awardBadge(data: CreateUserBadgeDto): Promise<UserBadge> {
    try {
      // Check if user already has this badge
      const hasBadge = await this.userHasBadge(data.user_id, data.badge_id);
      
      if (hasBadge) {
        throw new Error('User already has this badge');
      }
      
      const id = uuidv4();
      
      const query = `
        INSERT INTO user_badges (
          id, user_id, badge_id, awarded_at, source, equipped, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        id,
        data.user_id,
        data.badge_id,
        data.awarded_at,
        data.source || null,
        data.equipped || false,
        data.metadata ? JSON.stringify(data.metadata) : null
      ];
      
      const result = await this.db.query<UserBadge>(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.message === 'User already has this badge') {
        throw error;
      }
      
      logger.error('Error awarding badge', { error, data });
      throw error;
    }
  }

  /**
   * Award badge with transaction
   */
  async awardBadgeWithTransaction(
    client: PoolClient,
    data: CreateUserBadgeDto
  ): Promise<UserBadge> {
    try {
      // Check if user already has this badge
      const hasBadgeQuery = `
        SELECT EXISTS (
          SELECT 1 FROM user_badges
          WHERE user_id = $1 AND badge_id = $2
        ) AS has_badge
      `;
      
      const hasBadgeResult = await client.query<{ has_badge: boolean }>(
        hasBadgeQuery, 
        [data.user_id, data.badge_id]
      );
      
      if (hasBadgeResult.rows[0].has_badge) {
        throw new Error('User already has this badge');
      }
      
      const id = uuidv4();
      
      const query = `
        INSERT INTO user_badges (
          id, user_id, badge_id, awarded_at, source, equipped, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        id,
        data.user_id,
        data.badge_id,
        data.awarded_at,
        data.source || null,
        data.equipped || false,
        data.metadata ? JSON.stringify(data.metadata) : null
      ];
      
      const result = await client.query<UserBadge>(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.message === 'User already has this badge') {
        throw error;
      }
      
      logger.error('Error awarding badge with transaction', { error, data });
      throw error;
    }
  }

  /**
   * Equip or unequip user badge
   */
  async toggleBadgeEquipped(
    userId: string,
    badgeId: string,
    equipped: boolean
  ): Promise<UserBadge | null> {
    try {
      const query = `
        UPDATE user_badges
        SET equipped = $3
        WHERE user_id = $1 AND badge_id = $2
        RETURNING *
      `;
      
      const result = await this.db.query<UserBadge>(query, [userId, badgeId, equipped]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error toggling badge equipped', { error, userId, badgeId, equipped });
      throw error;
    }
  }

  /**
   * Get badge stats
   */
  async getBadgeStats(badgeId: string): Promise<{
    totalAwarded: number;
    recentlyAwarded: {
      userId: string;
      displayName: string;
      awardedAt: Date;
    }[];
  }> {
    try {
      // Get total awarded
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_badges
        WHERE badge_id = $1
      `;
      
      const countResult = await this.db.query<{ total: string }>(countQuery, [badgeId]);
      const totalAwarded = parseInt(countResult.rows[0].total, 10);
      
      // Get recently awarded
      const recentQuery = `
        SELECT ub.user_id, u.display_name, ub.awarded_at
        FROM user_badges ub
        JOIN users u ON ub.user_id = u.id
        WHERE ub.badge_id = $1
        ORDER BY ub.awarded_at DESC
        LIMIT 5
      `;
      
      const recentResult = await this.db.query(recentQuery, [badgeId]);
      
      return {
        totalAwarded,
        recentlyAwarded: recentResult.rows.map(row => ({
          userId: row.user_id,
          displayName: row.display_name,
          awardedAt: row.awarded_at
        }))
      };
    } catch (error) {
      logger.error('Error getting badge stats', { error, badgeId });
      throw error;
    }
  }

  /**
   * Get user badge summary
   */
  async getUserBadgeSummary(userId: string): Promise<{
    total: number;
    byTier: Record<string, number>;
    byCategory: Record<string, number>;
    equipped: number;
    recentlyAwarded: {
      id: string;
      name: string;
      tier: string;
      awardedAt: Date;
    }[];
  }> {
    try {
      // Get counts
      const statsQuery = `
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE b.tier = 'bronze') AS bronze_count,
          COUNT(*) FILTER (WHERE b.tier = 'silver') AS silver_count,
          COUNT(*) FILTER (WHERE b.tier = 'gold') AS gold_count,
          COUNT(*) FILTER (WHERE b.tier = 'platinum') AS platinum_count,
          COUNT(*) FILTER (WHERE b.tier = 'special') AS special_count,
          COUNT(*) FILTER (WHERE b.category = 'achievements') AS achievements_count,
          COUNT(*) FILTER (WHERE b.category = 'participation') AS participation_count,
          COUNT(*) FILTER (WHERE b.category = 'community') AS community_count,
          COUNT(*) FILTER (WHERE b.category = 'contribution') AS contribution_count,
          COUNT(*) FILTER (WHERE b.category = 'holder') AS holder_count,
          COUNT(*) FILTER (WHERE b.category = 'special') AS special_category_count,
          COUNT(*) FILTER (WHERE b.category = 'seasonal') AS seasonal_count,
          COUNT(*) FILTER (WHERE ub.equipped = true) AS equipped_count
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
      `;
      
      const statsResult = await this.db.query(statsQuery, [userId]);
      const stats = statsResult.rows[0];
      
      // Get recently awarded
      const recentQuery = `
        SELECT b.id, b.name, b.tier, ub.awarded_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.awarded_at DESC
        LIMIT 5
      `;
      
      const recentResult = await this.db.query(recentQuery, [userId]);
      
      return {
        total: parseInt(stats.total || '0', 10),
        byTier: {
          bronze: parseInt(stats.bronze_count || '0', 10),
          silver: parseInt(stats.silver_count || '0', 10),
          gold: parseInt(stats.gold_count || '0', 10),
          platinum: parseInt(stats.platinum_count || '0', 10),
          special: parseInt(stats.special_count || '0', 10)
        },
        byCategory: {
          achievements: parseInt(stats.achievements_count || '0', 10),
          participation: parseInt(stats.participation_count || '0', 10),
          community: parseInt(stats.community_count || '0', 10),
          contribution: parseInt(stats.contribution_count || '0', 10),
          holder: parseInt(stats.holder_count || '0', 10),
          special: parseInt(stats.special_category_count || '0', 10),
          seasonal: parseInt(stats.seasonal_count || '0', 10)
        },
        equipped: parseInt(stats.equipped_count || '0', 10),
        recentlyAwarded: recentResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          tier: row.tier,
          awardedAt: row.awarded_at
        }))
      };
    } catch (error) {
      logger.error('Error getting user badge summary', { error, userId });
      throw error;
    }
  }

  /**
   * Delete user badge (for testing/admin)
   */
  async removeUserBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM user_badges
        WHERE user_id = $1 AND badge_id = $2
        RETURNING id
      `;
      
      const result = await this.db.query(query, [userId, badgeId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error removing user badge', { error, userId, badgeId });
      throw error;
    }
  }
}
