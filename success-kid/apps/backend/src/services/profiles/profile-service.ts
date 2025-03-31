/**
 * Profile Service
 * 
 * Manages user profiles including level progression and profile data
 */
import { Pool } from 'pg';
import { logger } from '../../lib/logger';
import { InternalServerError } from '../../errors'; // Use InternalServerError instead of DatabaseError

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
  socialLinks: Record<string, string>; // Assuming JSONB in DB mapped to object
  preferences?: Record<string, any>; // Add optional preferences field (assuming JSONB)
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
        preferences: profile.preferences || {}, // Add preferences mapping
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
    } catch (error) {
      logger.error('Error getting user profile', { userId, error });
      throw new InternalServerError('Failed to get user profile', error); // Use InternalServerError
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
        preferences: profile.preferences || {}, // Add preferences mapping
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
    } catch (error) {
      logger.error('Error updating user level', { userId, level, error });
      throw new InternalServerError('Failed to update user level', error); // Use InternalServerError
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
        preferences: profile.preferences || {}, // Add preferences mapping
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
    } catch (error) {
      logger.error('Error updating user title', { userId, title, error });
      throw new InternalServerError('Failed to update user title', error); // Use InternalServerError
    }
  }

  /**
   * Updates a user's profile data.
   * 
   * @param userId User ID
   * @param data Partial profile data to update
   * @returns Updated user profile or null if not found
   */
  async updateProfile(userId: string, data: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'avatarUrl' | 'socialLinks' | 'preferences'>>): Promise<UserProfile | null> {
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let valueIndex = 1; // Start index for query parameters

    // Dynamically build SET clause based on provided data
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        // Map camelCase keys to snake_case DB columns
        let dbColumn: string | null = null;
        switch (key) {
          case 'displayName': dbColumn = 'display_name'; break;
          case 'bio': dbColumn = 'bio'; break;
          case 'avatarUrl': dbColumn = 'avatar_url'; break;
          case 'socialLinks': dbColumn = 'social_links'; break;
          case 'preferences': dbColumn = 'preferences'; break;
          // Add other mappable fields here
        }

        if (dbColumn) {
          // Use JSON.stringify for JSONB fields
          const paramValue = (dbColumn === 'social_links' || dbColumn === 'preferences') ? JSON.stringify(value) : value;
          fieldsToUpdate.push(`${dbColumn} = $${valueIndex}`);
          values.push(paramValue);
          valueIndex++;
        }
      }
    }

    // If no valid fields to update, return current profile
    if (fieldsToUpdate.length === 0) {
      logger.warn('No valid fields provided for profile update', { userId });
      return this.getProfileByUserId(userId);
    }

    // Add updated_at timestamp
    fieldsToUpdate.push(`updated_at = NOW()`);
    values.push(userId); // Add userId for the WHERE clause

    const setClause = fieldsToUpdate.join(', ');
    const queryString = `
      UPDATE profiles
      SET ${setClause}
      WHERE user_id = $${valueIndex}
      RETURNING user_id, display_name, bio, avatar_url, level, total_points, title, social_links, preferences, created_at, updated_at
    `; // Added preferences to RETURNING

    try {
      logger.debug(`Executing profile update query for user ${userId}`, { query: queryString, values });
      const result = await this.db.query(queryString, values);

      if (result.rows.length === 0) {
        logger.warn(`Profile not found during update for user: ${userId}`);
        return null; // Or throw NotFoundError? Depends on desired behavior.
      }

      const profile = result.rows[0];
      logger.info(`Profile updated successfully for user: ${userId}`);

      // Map DB result back to UserProfile interface
      return {
        userId: profile.user_id,
        displayName: profile.display_name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        level: profile.level,
        totalPoints: profile.total_points, // Assuming total_points exists in DB schema
        title: profile.title,
        socialLinks: profile.social_links || {},
        preferences: profile.preferences || {}, // Add preferences mapping
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
    } catch (error) {
      logger.error('Error updating user profile', { userId, data, error });
      throw new InternalServerError('Failed to update user profile', error); // Use InternalServerError
    }
  }
}
