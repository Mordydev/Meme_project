/**
 * Badge Repository
 * 
 * Repository for managing badges, user badges, and badge display preferences.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '../base-repository';
import { logger } from '../../lib/logger';
import { DatabaseError } from '../../errors';
import {
  Badge,
  BadgeFilter,
  UserBadge,
  CreateBadgeDto,
  UpdateBadgeDto,
  MAX_EQUIPPED_BADGES
} from '../../models/entities/achievement/badge.model';

/**
 * Badge repository implementation
 */
export class BadgeRepository extends BaseRepository<Badge> {
  /**
   * Create a new BadgeRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'badges');
  }

  /**
   * Find badges by filter criteria
   * 
   * @param filter Filter criteria
   * @returns Array of badges matching the filter
   */
  async findByFilter(filter: BadgeFilter): Promise<Badge[]> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (filter.category) {
        conditions.push(`category = $${paramIndex++}`);
        values.push(filter.category);
      }
      
      if (filter.tier) {
        conditions.push(`tier = $${paramIndex++}`);
        values.push(filter.tier);
      }
      
      if (filter.search) {
        conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        values.push(`%${filter.search}%`);
        paramIndex++;
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const query = `
        SELECT * FROM badges
        ${whereClause}
        ORDER BY display_priority DESC, tier, category, name
      `;
      
      const result = await this.db.query<Badge>(query, values);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find badges by filter', { filter, error });
      throw new DatabaseError('Failed to find badges by filter', error);
    }
  }

  /**
   * Create a new badge
   * 
   * @param data Badge data
   * @returns Created badge
   */
  async createBadge(data: CreateBadgeDto): Promise<Badge> {
    try {
      const id = uuidv4();
      
      const result = await this.db.query<Badge>(
        `INSERT INTO badges(
          id, name, description, image_url, category, tier, 
          points_value, display_priority, created_at, updated_at
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
        [
          id,
          data.name,
          data.description,
          data.image_url,
          data.category,
          data.tier,
          data.points_value || 0,
          data.display_priority || 0
        ]
      );
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create badge', { data, error });
      throw new DatabaseError('Failed to create badge', error);
    }
  }

  /**
   * Update a badge
   * 
   * @param id Badge ID
   * @param data Badge data to update
   * @returns Updated badge or null if not found
   */
  async updateBadge(id: string, data: UpdateBadgeDto): Promise<Badge | null> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [id];
      let paramIndex = 2;
      
      if (data.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      
      if (data.image_url !== undefined) {
        updateFields.push(`image_url = $${paramIndex++}`);
        values.push(data.image_url);
      }
      
      if (data.category !== undefined) {
        updateFields.push(`category = $${paramIndex++}`);
        values.push(data.category);
      }
      
      if (data.tier !== undefined) {
        updateFields.push(`tier = $${paramIndex++}`);
        values.push(data.tier);
      }
      
      if (data.points_value !== undefined) {
        updateFields.push(`points_value = $${paramIndex++}`);
        values.push(data.points_value);
      }
      
      if (data.display_priority !== undefined) {
        updateFields.push(`display_priority = $${paramIndex++}`);
        values.push(data.display_priority);
      }
      
      // Add updated_at field
      updateFields.push(`updated_at = NOW()`);
      
      if (updateFields.length === 0) {
        // No fields to update, just return the existing badge
        return this.findById(id);
      }
      
      const query = `
        UPDATE badges
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.db.query<Badge>(query, values);
      
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to update badge', { id, data, error });
      throw new DatabaseError('Failed to update badge', error);
    }
  }

  /**
   * Get user badges
   * 
   * @param userId User ID
   * @returns Array of user badges with badge info
   */
  async getUserBadges(userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT ub.*, b.*
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.equipped DESC, b.display_priority DESC, b.tier, b.category, b.name
      `;
      
      const result = await this.db.query(query, [userId]);
      
      // Transform results into a more useful structure
      return result.rows.map(row => ({
        userBadge: {
          user_id: row.user_id,
          badge_id: row.badge_id,
          awarded_at: row.awarded_at,
          source: row.source,
          equipped: row.equipped,
          slot: row.slot,
          updated_at: row.updated_at
        },
        badge: {
          id: row.id,
          name: row.name,
          description: row.description,
          image_url: row.image_url,
          category: row.category,
          tier: row.tier,
          points_value: row.points_value,
          display_priority: row.display_priority
        }
      }));
    } catch (error) {
      logger.error('Failed to get user badges', { userId, error });
      throw new DatabaseError('Failed to get user badges', error);
    }
  }

  /**
   * Get user's equipped badges
   * 
   * @param userId User ID
   * @returns Array of equipped badges
   */
  async getEquippedBadges(userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT ub.*, b.*
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1 AND ub.equipped = true
        ORDER BY ub.slot
      `;
      
      const result = await this.db.query(query, [userId]);
      
      // Transform results
      return result.rows.map(row => ({
        userBadge: {
          user_id: row.user_id,
          badge_id: row.badge_id,
          awarded_at: row.awarded_at,
          source: row.source,
          equipped: row.equipped,
          slot: row.slot,
          updated_at: row.updated_at
        },
        badge: {
          id: row.id,
          name: row.name,
          description: row.description,
          image_url: row.image_url,
          category: row.category,
          tier: row.tier,
          points_value: row.points_value,
          display_priority: row.display_priority
        }
      }));
    } catch (error) {
      logger.error('Failed to get equipped badges', { userId, error });
      throw new DatabaseError('Failed to get equipped badges', error);
    }
  }

  /**
   * Award a badge to a user
   * 
   * @param userId User ID
   * @param badgeId Badge ID
   * @param source Source of the badge award
   * @returns Created user badge
   */
  async awardBadge(userId: string, badgeId: string, source: string): Promise<UserBadge> {
    return this.withTransaction(async (client) => {
      try {
        // Check if badge exists
        const badgeResult = await client.query<Badge>(
          'SELECT * FROM badges WHERE id = $1',
          [badgeId]
        );
        
        if (badgeResult.rows.length === 0) {
          throw new Error(`Badge with ID ${badgeId} not found`);
        }
        
        // Check if user already has this badge
        const existingResult = await client.query<UserBadge>(
          'SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2',
          [userId, badgeId]
        );
        
        if (existingResult.rows.length > 0) {
          // User already has this badge
          return existingResult.rows[0];
        }
        
        // Award the badge
        const result = await client.query<UserBadge>(
          `INSERT INTO user_badges(
            user_id, badge_id, awarded_at, source, equipped, updated_at
          ) VALUES($1, $2, NOW(), $3, false, NOW())
          RETURNING *`,
          [userId, badgeId, source]
        );
        
        // If badge has points value, award points
        const badge = badgeResult.rows[0];
        if (badge.points_value > 0) {
          // Implementation of points award would be handled by the service, not directly here
        }
        
        return result.rows[0];
      } catch (error) {
        logger.error('Failed to award badge', { userId, badgeId, source, error });
        throw error; // Will be caught by withTransaction
      }
    });
  }

  /**
   * Equip or unequip a badge
   * 
   * @param userId User ID
   * @param badgeId Badge ID
   * @param equipped Whether the badge should be equipped
   * @param slot Optional slot for the badge
   * @returns Updated user badge
   */
  async toggleEquipBadge(
    userId: string,
    badgeId: string,
    equipped: boolean,
    slot?: number
  ): Promise<UserBadge | null> {
    return this.withTransaction(async (client) => {
      try {
        // Check if user has this badge
        const existingResult = await client.query<UserBadge>(
          'SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2',
          [userId, badgeId]
        );
        
        if (existingResult.rows.length === 0) {
          // User doesn't have this badge
          return null;
        }
        
        if (equipped) {
          // Check if maximum equipped badges would be exceeded
          const equippedCountResult = await client.query<{ count: string }>(
            'SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1 AND equipped = true',
            [userId]
          );
          
          const equippedCount = parseInt(equippedCountResult.rows[0].count, 10);
          
          if (equippedCount >= MAX_EQUIPPED_BADGES && !existingResult.rows[0].equipped) {
            throw new Error(`Maximum equipped badges (${MAX_EQUIPPED_BADGES}) would be exceeded`);
          }
          
          // If slot is provided, make sure it's valid
          if (slot !== undefined) {
            if (slot < 0 || slot >= MAX_EQUIPPED_BADGES) {
              throw new Error(`Invalid slot: ${slot}. Must be between 0 and ${MAX_EQUIPPED_BADGES - 1}`);
            }
            
            // Check if another badge is already in this slot
            const slotInUseResult = await client.query<UserBadge>(
              'SELECT * FROM user_badges WHERE user_id = $1 AND equipped = true AND slot = $2 AND badge_id != $3',
              [userId, slot, badgeId]
            );
            
            if (slotInUseResult.rows.length > 0) {
              // Another badge is in this slot, unequip it
              await client.query(
                'UPDATE user_badges SET equipped = false, slot = NULL, updated_at = NOW() WHERE user_id = $1 AND badge_id = $2',
                [userId, slotInUseResult.rows[0].badge_id]
              );
            }
          } else {
            // No slot provided, find the next available slot
            const usedSlotsResult = await client.query<{ slot: number }>(
              'SELECT slot FROM user_badges WHERE user_id = $1 AND equipped = true ORDER BY slot',
              [userId]
            );
            
            const usedSlots = usedSlotsResult.rows.map(row => row.slot);
            
            // Find the first unused slot
            for (let i = 0; i < MAX_EQUIPPED_BADGES; i++) {
              if (!usedSlots.includes(i)) {
                slot = i;
                break;
              }
            }
            
            // If all slots are used, use the first slot
            if (slot === undefined) {
              slot = 0;
            }
          }
        }
        
        // Update the badge equipped status
        const updateQuery = equipped
          ? 'UPDATE user_badges SET equipped = true, slot = $3, updated_at = NOW() WHERE user_id = $1 AND badge_id = $2 RETURNING *'
          : 'UPDATE user_badges SET equipped = false, slot = NULL, updated_at = NOW() WHERE user_id = $1 AND badge_id = $2 RETURNING *';
        
        const updateValues = equipped
          ? [userId, badgeId, slot]
          : [userId, badgeId];
        
        const result = await client.query<UserBadge>(updateQuery, updateValues);
        
        return result.rows.length > 0 ? result.rows[0] : null;
      } catch (error) {
        logger.error('Failed to toggle equip badge', { userId, badgeId, equipped, slot, error });
        throw error; // Will be caught by withTransaction
      }
    });
  }

  /**
   * Check if a user has a specific badge
   * 
   * @param userId User ID
   * @param badgeId Badge ID
   * @returns True if user has the badge
   */
  async userHasBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const result = await this.db.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1 AND badge_id = $2',
        [userId, badgeId]
      );
      
      return parseInt(result.rows[0].count, 10) > 0;
    } catch (error) {
      logger.error('Failed to check if user has badge', { userId, badgeId, error });
      throw new DatabaseError('Failed to check if user has badge', error);
    }
  }

  /**
   * Get the total number of badges a user has
   * 
   * @param userId User ID
   * @returns Number of badges
   */
  async getUserBadgeCount(userId: string): Promise<number> {
    try {
      const result = await this.db.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1',
        [userId]
      );
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to count user badges', { userId, error });
      throw new DatabaseError('Failed to count user badges', error);
    }
  }

  /**
   * Convert a database row to a badge entity
   * 
   * @param row Database row
   * @returns Badge entity
   */
  protected mapToEntity(row: Record<string, any>): Badge {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      image_url: row.image_url,
      category: row.category,
      tier: row.tier,
      points_value: row.points_value,
      display_priority: row.display_priority,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
