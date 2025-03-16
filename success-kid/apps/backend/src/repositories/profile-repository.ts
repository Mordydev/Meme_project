/**
 * Profile Repository
 * 
 * Handles data access operations for user profiles
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { Profile, CreateProfileDto, UpdateProfileDto } from '../models/entities/profile.model';
import { logger } from '../lib/logger';

export class ProfileRepository extends BaseRepository<Profile> {
  /**
   * Create a new ProfileRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'profiles', 'user_id');
  }

  /**
   * Find profile by user ID
   * 
   * @param userId User ID
   * @returns Profile or null if not found
   */
  async findByUserId(userId: string): Promise<Profile | null> {
    return this.findById(userId);
  }

  /**
   * Create a new profile
   * 
   * @param data Profile data
   * @returns Created profile
   */
  async createProfile(data: CreateProfileDto): Promise<Profile> {
    try {
      return await this.create({
        ...data,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        level: data.level || 1,
        title: data.title || null,
        social_links: data.social_links || {},
        preferences: data.preferences || {},
        total_points: data.total_points || 0,
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('Error creating profile', { error, data });
      throw error;
    }
  }

  /**
   * Update a profile
   * 
   * @param userId User ID
   * @param data Profile data to update
   * @returns Updated profile or null if not found
   */
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<Profile | null> {
    try {
      // Always update the updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      return await this.update(userId, updateData);
    } catch (error) {
      logger.error('Error updating profile', { error, userId, data });
      throw error;
    }
  }

  /**
   * Increment profile's total points
   * 
   * @param userId User ID
   * @param amount Points to add (use negative value to subtract)
   * @returns Updated profile or null if not found
   */
  async incrementPoints(userId: string, amount: number): Promise<Profile | null> {
    try {
      const query = `
        UPDATE profiles
        SET total_points = total_points + $1,
            updated_at = NOW()
        WHERE user_id = $2
        RETURNING *
      `;
      
      const result = await this.db.query<Profile>(query, [amount, userId]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error incrementing profile points', { error, userId, amount });
      throw error;
    }
  }

  /**
   * Get profiles by level range
   * 
   * @param minLevel Minimum level (inclusive)
   * @param maxLevel Maximum level (inclusive)
   * @param limit Maximum number of profiles to return
   * @param offset Number of profiles to skip
   * @returns Array of profiles
   */
  async findByLevelRange(
    minLevel: number, 
    maxLevel: number, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<Profile[]> {
    try {
      const query = `
        SELECT * FROM profiles
        WHERE level >= $1 AND level <= $2
        ORDER BY level DESC, total_points DESC
        LIMIT $3 OFFSET $4
      `;
      
      const result = await this.db.query<Profile>(query, [minLevel, maxLevel, limit, offset]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Error finding profiles by level range', { error, minLevel, maxLevel });
      throw error;
    }
  }

  /**
   * Get top profiles by points
   * 
   * @param limit Maximum number of profiles to return
   * @returns Array of profiles
   */
  async findTopByPoints(limit: number = 10): Promise<Profile[]> {
    try {
      const query = `
        SELECT * FROM profiles
        ORDER BY total_points DESC
        LIMIT $1
      `;
      
      const result = await this.db.query<Profile>(query, [limit]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Error finding top profiles by points', { error, limit });
      throw error;
    }
  }

  /**
   * Update user level
   * 
   * @param userId User ID
   * @param newLevel New level
   * @returns Updated profile or null if not found
   */
  async updateLevel(userId: string, newLevel: number): Promise<Profile | null> {
    try {
      const query = `
        UPDATE profiles
        SET level = $1,
            updated_at = NOW()
        WHERE user_id = $2
        RETURNING *
      `;
      
      const result = await this.db.query<Profile>(query, [newLevel, userId]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error updating user level', { error, userId, newLevel });
      throw error;
    }
  }

  /**
   * Map database row to Profile entity
   * 
   * @param row Database row
   * @returns Profile entity
   */
  protected mapToEntity(row: Record<string, any>): Profile {
    return {
      user_id: row.user_id,
      bio: row.bio,
      avatar_url: row.avatar_url,
      level: row.level,
      title: row.title,
      social_links: row.social_links || {},
      preferences: row.preferences || {},
      total_points: row.total_points || 0,
      updated_at: row.updated_at
    };
  }
}
