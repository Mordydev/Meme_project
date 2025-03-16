import { Pool } from 'pg';
import { ProfileRepository } from './repository';
import { 
  Profile, 
  CreateProfileDto, 
  UpdateProfileDto, 
  PublicProfile 
} from './types';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * Profile service for managing user profiles
 */
export class ProfileService {
  private repository: ProfileRepository;
  
  constructor(db: Pool) {
    this.repository = new ProfileRepository(db);
  }
  
  /**
   * Get a user's profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      return await this.repository.getProfileByUserId(userId);
    } catch (error) {
      logger.error('Error getting profile', { userId, error });
      throw error;
    }
  }
  
  /**
   * Create a new profile for a user
   */
  async createProfile(userId: string, data: CreateProfileDto): Promise<Profile> {
    try {
      // Check if profile already exists
      const existingProfile = await this.repository.getProfileByUserId(userId);
      
      if (existingProfile) {
        throw new ValidationError('Profile already exists for this user');
      }
      
      // Create profile with default values
      return await this.repository.createProfile({
        user_id: userId,
        bio: data.bio,
        avatar_url: data.avatar_url,
        level: 1, // Default starting level
        title: data.title,
        social_links: data.social_links || {},
        preferences: data.preferences || {}
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Error creating profile', { userId, data, error });
      throw error;
    }
  }
  
  /**
   * Update a user's profile
   */
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<Profile> {
    try {
      const profile = await this.repository.updateProfile(userId, data);
      
      if (!profile) {
        throw new NotFoundError('Profile', userId);
      }
      
      return profile;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error updating profile', { userId, data, error });
      throw error;
    }
  }
  
  /**
   * Update specific profile preferences
   */
  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<Profile> {
    try {
      const profile = await this.repository.updateProfilePreferences(userId, preferences);
      
      if (!profile) {
        throw new NotFoundError('Profile', userId);
      }
      
      return profile;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error updating preferences', { userId, preferences, error });
      throw error;
    }
  }
  
  /**
   * Delete a user's profile
   */
  async deleteProfile(userId: string): Promise<void> {
    try {
      const deleted = await this.repository.deleteProfile(userId);
      
      if (!deleted) {
        throw new NotFoundError('Profile', userId);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error deleting profile', { userId, error });
      throw error;
    }
  }
  
  /**
   * Get public profile for a user
   */
  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    try {
      const profile = await this.repository.getProfileByUserId(userId);
      
      if (!profile) {
        return null;
      }
      
      // Transform to public profile format
      return {
        userId: profile.user_id,
        displayName: 'User ' + profile.user_id.substring(0, 6), // This would be fetched from user table
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        level: profile.level,
        title: profile.title,
        socialLinks: profile.social_links || {}
      };
    } catch (error) {
      logger.error('Error getting public profile', { userId, error });
      throw error;
    }
  }
  
  /**
   * Update a user's profile level
   */
  async updateLevel(userId: string, newLevel: number): Promise<Profile> {
    try {
      if (newLevel < 1) {
        throw new ValidationError('Level must be at least 1');
      }
      
      const profile = await this.repository.updateProfile(userId, { level: newLevel });
      
      if (!profile) {
        throw new NotFoundError('Profile', userId);
      }
      
      return profile;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Error updating level', { userId, newLevel, error });
      throw error;
    }
  }
}
