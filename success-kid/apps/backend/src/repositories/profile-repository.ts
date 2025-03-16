/**
 * Profile Repository
 * 
 * Handles data access for user profiles
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { Profile, NewProfileInput, ProfileUpdateInput, ProfileWithUser } from '../models/profile';
import { logger } from '../lib/logger';

export class ProfileRepository extends BaseRepository<Profile> {
  constructor(db: Pool) {
    super(db, 'profiles', 'user_id');
  }

  /**
   * Find a profile by user ID
   */
  async findByUserId(userId: string): Promise<Profile | null> {
    try {
      return await this.findById(userId);
    } catch (error) {
      logger.error('Error finding profile by user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(input: NewProfileInput): Promise<Profile> {
    try {
      const now = new Date();
      return await this.create({
        ...input,
        level: input.level || 1,
        created_at: now,
        updated_at: now
      });
    } catch (error) {
      logger.error('Error creating profile', { error, input });
      throw error;
    }
  }

  /**
   * Update a profile
   */
  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<Profile | null> {
    try {
      const updatedProfile = await this.update(userId, {
        ...input,
        updated_at: new Date()
      });
      
      return updatedProfile;
    } catch (error) {
      logger.error('Error updating profile', { error, userId, input });
      throw error;
    }
  }

  /**
   * Get profile with user data
   */
  async getProfileWithUser(userId: string): Promise<ProfileWithUser | null> {
    try {
      const query = `
        SELECT 
          p.*,
          json_build_object(
            'id', u.id,
            'email', u.email,
            'display_name', u.display_name,
            'status', u.status
          ) as user
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = $1
      `;
      
      const result = await this.db.query<ProfileWithUser>(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting profile with user', { error, userId });
      throw error;
    }
  }

  /**
   * Increment profile level
   */
  async incrementLevel(userId: string): Promise<Profile | null> {
    try {
      const query = `
        UPDATE profiles
        SET level = level + 1, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;
      
      const result = await this.db.query<Profile>(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error incrementing profile level', { error, userId });
      throw error;
    }
  }

  /**
   * Update profile preferences
   */
  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<Profile | null> {
    try {
      // First, get current preferences
      const profile = await this.findById(userId);
      if (!profile) return null;
      
      // Merge existing preferences with new ones
      const mergedPreferences = {
        ...(profile.preferences || {}),
        ...preferences
      };
      
      // Update with merged preferences
      return await this.update(userId, {
        preferences: mergedPreferences,
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('Error updating profile preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Get profiles by level range
   */
  async getProfilesByLevelRange(minLevel: number, maxLevel: number, limit: number = 10): Promise<Profile[]> {
    try {
      const query = `
        SELECT * FROM profiles
        WHERE level BETWEEN $1 AND $2
        ORDER BY level DESC, updated_at DESC
        LIMIT $3
      `;
      
      const result = await this.db.query<Profile>(query, [minLevel, maxLevel, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting profiles by level range', { error, minLevel, maxLevel });
      throw error;
    }
  }
}
