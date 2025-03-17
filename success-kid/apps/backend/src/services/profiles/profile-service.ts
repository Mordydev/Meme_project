/**
 * Profile Service
 * 
 * Manages user profiles including level progression and profile data
 */
import { Pool } from 'pg';
import { logger } from '../../lib/logger';
import { DatabaseError } from '../../errors';

/**
 * User profile interface
 */
export interface UserProfile {
  userId: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  level: number;
  totalPoints: number;
  title: string | null;
  socialLinks: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service for managing user profiles
 */
export class ProfileService {
  /**
   * Create a new ProfileService
   * 
   * @param db Database connection pool
   */
  constructor(private db: Pool) {}
  
  /**
   * Get a user's profile by user ID
   * 
   * @param userId User ID
   * @returns User profile or null if not found
   */
  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    try {
      const result = await this.db.query(
        `SELECT 
          user_id, display_name, bio, avatar_url, 
          level, total_points, title, social_links,
          created_at, updated_at
        FROM profiles
        WHERE user_id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const profile = result.rows[0];
      
      return {
        userId: profile.user_id,
        displayName: profile.display_name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        level: profile.level,
        totalPoints: profile.total_points,
        title: profile.title,
        socialLinks: profile.social_links || {},
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
    } catch (error) {
      logger.error('Error getting user profile', { userId, error });
      throw new DatabaseError('Failed to get user profile', error);
    }
  }
  
  /**
   * Update a user's level
   * 
   * @param userId User ID
   * @param level New level
   * @returns Updated user profile
   */
  async updateUserLevel(userId: string, level: number): Promise<UserProfile> {
    try {
      const result = await this.db.query(
        `UPDATE profiles
        SET level = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING *`,
        [level, userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const profile = result.rows[0];
      
      return {
        userId: profile.user_id,
        displayName: profile.display_name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        level: profile.level,
        totalPoints: profile.total_points,
        title: profile.title,
        socialLinks: profile.social_links || {},
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
    } catch (error) {
      logger.error('Error updating user level', { userId, level, error });
      throw new DatabaseError('Failed to update user level', error);
    }
  }
  
  /**
   * Update a user's title
   * 
   * @param userId User ID
   * @param title New title
   * @returns Updated user profile
   */
  async updateUserTitle(userId: string, title: string): Promise<UserProfile> {
    try {
      const result = await this.db.query(
        `UPDATE profiles
        SET title = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING *`,
        [title, userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const profile = result.rows[0];
      
      return {
        userId: profile.user_id,
        displayName: profile.display_name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        level: profile.level,
        totalPoints: profile.total_points,
        title: profile.title,
        socialLinks: profile.social_links || {},
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
    } catch (error) {
      logger.error('Error updating user title', { userId, title, error });
      throw new DatabaseError('Failed to update user title', error);
    }
  }
}
