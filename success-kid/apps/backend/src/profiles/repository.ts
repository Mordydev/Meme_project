import { Pool } from 'pg';
import { logger } from '../lib/logger';
import { Profile } from './types';

/**
 * Repository for user profiles
 */
export class ProfileRepository {
  constructor(private db: Pool) {}
  
  /**
   * Get profile by user ID
   */
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    try {
      const query = 'SELECT * FROM profiles WHERE user_id = $1';
      const result = await this.db.query<Profile>(query, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting profile', { userId, error });
      throw error;
    }
  }
  
  /**
   * Create a new profile
   */
  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    try {
      const query = `
        INSERT INTO profiles (
          user_id, bio, avatar_url, level, title, social_links, preferences
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await this.db.query<Profile>(query, [
        profile.user_id,
        profile.bio,
        profile.avatar_url,
        profile.level || 1,
        profile.title,
        JSON.stringify(profile.social_links || {}),
        JSON.stringify(profile.preferences || {})
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating profile', { profile, error });
      throw error;
    }
  }
  
  /**
   * Update a profile
   */
  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile | null> {
    try {
      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Add each field to update
      if (data.bio !== undefined) {
        updates.push(`bio = $${paramIndex++}`);
        values.push(data.bio);
      }
      
      if (data.avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramIndex++}`);
        values.push(data.avatar_url);
      }
      
      if (data.level !== undefined) {
        updates.push(`level = $${paramIndex++}`);
        values.push(data.level);
      }
      
      if (data.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(data.title);
      }
      
      if (data.social_links !== undefined) {
        updates.push(`social_links = $${paramIndex++}`);
        values.push(JSON.stringify(data.social_links));
      }
      
      if (data.preferences !== undefined) {
        updates.push(`preferences = $${paramIndex++}`);
        values.push(JSON.stringify(data.preferences));
      }
      
      // Add updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      // If no updates, return current profile
      if (updates.length === 0) {
        return this.getProfileByUserId(userId);
      }
      
      // Add userId as the last parameter
      values.push(userId);
      
      const query = `
        UPDATE profiles
        SET ${updates.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await this.db.query<Profile>(query, values);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating profile', { userId, data, error });
      throw error;
    }
  }
  
  /**
   * Update specific profile preferences
   */
  async updateProfilePreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<Profile | null> {
    try {
      // Get current preferences
      const profile = await this.getProfileByUserId(userId);
      
      if (!profile) {
        return null;
      }
      
      // Merge new preferences with existing ones
      const currentPreferences = profile.preferences || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      // Update preferences in database
      const query = `
        UPDATE profiles
        SET preferences = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING *
      `;
      
      const result = await this.db.query<Profile>(query, [
        JSON.stringify(updatedPreferences),
        userId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating profile preferences', { userId, preferences, error });
      throw error;
    }
  }
  
  /**
   * Delete a profile
   */
  async deleteProfile(userId: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM profiles WHERE user_id = $1';
      const result = await this.db.query(query, [userId]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting profile', { userId, error });
      throw error;
    }
  }
}
