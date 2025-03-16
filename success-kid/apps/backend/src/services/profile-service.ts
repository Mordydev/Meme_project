/**
 * Profile Service
 * 
 * Handles operations related to user profiles
 */
import { ProfileRepository } from '../repositories/profile-repository';
import { UserRepository } from '../repositories/user-repository';
import { logger } from '../lib/logger';
import { Profile, ProfileUpdateInput, ProfileWithUser } from '../models/profile';
import { NotFoundError, ValidationError, DatabaseError } from '../errors';

export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Get a user's profile
   */
  async getProfile(userId: string): Promise<Profile> {
    try {
      const profile = await this.profileRepository.findByUserId(userId);
      
      if (!profile) {
        throw new NotFoundError('Profile', userId);
      }
      
      return profile;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error getting profile', { error, userId });
      throw new DatabaseError('Failed to retrieve profile');
    }
  }

  /**
   * Get profile with user information
   */
  async getProfileWithUser(userId: string): Promise<ProfileWithUser> {
    try {
      const profile = await this.profileRepository.getProfileWithUser(userId);
      
      if (!profile) {
        throw new NotFoundError('Profile', userId);
      }
      
      return profile;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error getting profile with user', { error, userId });
      throw new DatabaseError('Failed to retrieve profile with user information');
    }
  }

  /**
   * Update a user's profile
   */
  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<Profile> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }
      
      // Verify profile exists
      const existingProfile = await this.profileRepository.findByUserId(userId);
      
      if (!existingProfile) {
        throw new NotFoundError('Profile', userId);
      }
      
      // Validate input
      this.validateProfileUpdate(input);
      
      // Update profile
      const updatedProfile = await this.profileRepository.updateProfile(userId, input);
      
      if (!updatedProfile) {
        throw new DatabaseError('Failed to update profile');
      }
      
      return updatedProfile;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Error updating profile', { error, userId, input });
      throw new DatabaseError('Failed to update profile');
    }
  }

  /**
   * Update profile preferences
   */
  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<Profile> {
    try {
      // Verify profile exists
      const existingProfile = await this.profileRepository.findByUserId(userId);
      
      if (!existingProfile) {
        throw new NotFoundError('Profile', userId);
      }
      
      // Validate preferences
      if (typeof preferences !== 'object' || preferences === null) {
        throw new ValidationError('Preferences must be an object');
      }
      
      // Update preferences
      const updatedProfile = await this.profileRepository.updatePreferences(userId, preferences);
      
      if (!updatedProfile) {
        throw new DatabaseError('Failed to update preferences');
      }
      
      return updatedProfile;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Error updating preferences', { error, userId });
      throw new DatabaseError('Failed to update preferences');
    }
  }

  /**
   * Increment a user's level
   */
  async incrementLevel(userId: string): Promise<Profile> {
    try {
      const updatedProfile = await this.profileRepository.incrementLevel(userId);
      
      if (!updatedProfile) {
        throw new NotFoundError('Profile', userId);
      }
      
      return updatedProfile;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error incrementing level', { error, userId });
      throw new DatabaseError('Failed to increment level');
    }
  }

  /**
   * Get profiles by level range
   */
  async getProfilesByLevelRange(
    minLevel: number, 
    maxLevel: number, 
    limit: number = 10
  ): Promise<Profile[]> {
    try {
      return await this.profileRepository.getProfilesByLevelRange(minLevel, maxLevel, limit);
    } catch (error) {
      logger.error('Error getting profiles by level range', { error, minLevel, maxLevel });
      throw new DatabaseError('Failed to retrieve profiles by level range');
    }
  }

  /**
   * Validate profile update input
   */
  private validateProfileUpdate(input: ProfileUpdateInput): void {
    // Check bio length
    if (input.bio !== undefined && input.bio.length > 500) {
      throw new ValidationError('Bio cannot exceed 500 characters');
    }
    
    // Check title length
    if (input.title !== undefined && input.title.length > 50) {
      throw new ValidationError('Title cannot exceed 50 characters');
    }
    
    // Validate social links
    if (input.social_links !== undefined) {
      if (typeof input.social_links !== 'object' || input.social_links === null) {
        throw new ValidationError('Social links must be an object');
      }
      
      // Validate each social link
      for (const [platform, url] of Object.entries(input.social_links)) {
        if (typeof url !== 'string') {
          throw new ValidationError(`Social link for ${platform} must be a string`);
        }
        
        if (url.length > 255) {
          throw new ValidationError(`Social link for ${platform} cannot exceed 255 characters`);
        }
        
        // Basic URL validation
        try {
          new URL(url);
        } catch (error) {
          throw new ValidationError(`Invalid URL for ${platform}`);
        }
      }
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService(
  null as unknown as ProfileRepository,
  null as unknown as UserRepository
);

// Method to initialize the profileService with dependencies
export function initializeProfileService(
  profileRepository: ProfileRepository,
  userRepository: UserRepository
) {
  Object.assign(profileService, new ProfileService(profileRepository, userRepository));
}
