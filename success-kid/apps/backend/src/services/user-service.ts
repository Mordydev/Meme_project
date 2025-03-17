/**
 * User Service
 * 
 * Business logic for user operations
 */
import { User, UpdateUserDto } from '../models/user';
import { Profile, UpdateProfileDto } from '../models/profile';
import { userRepository, profileRepository } from '../repositories';
import { logger } from '../lib/logger';
import { auditLogger } from '../auth/audit';
import { NotFoundError, ValidationError, ConflictError } from '../errors';

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await userRepository.findById(id);
      return user;
    } catch (error) {
      logger.error('Error fetching user by ID', { error, id });
      throw error;
    }
  }
  
  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await userRepository.findByEmail(email);
      return user;
    } catch (error) {
      logger.error('Error fetching user by email', { error, email });
      throw error;
    }
  }
  
  /**
   * Get user by external ID (from auth provider)
   */
  async getUserByExternalId(externalId: string): Promise<User | null> {
    try {
      const user = await userRepository.findByExternalId(externalId);
      return user;
    } catch (error) {
      logger.error('Error fetching user by external ID', { error, externalId });
      throw error;
    }
  }
  
  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      const profile = await profileRepository.findByUserId(userId);
      return profile;
    } catch (error) {
      logger.error('Error fetching user profile', { error, userId });
      throw error;
    }
  }
  
  /**
   * Get user with profile
   */
  async getUserWithProfile(userId: string): Promise<{ user: User; profile: Profile } | null> {
    try {
      // Get user
      const user = await userRepository.findById(userId);
      if (!user) return null;
      
      // Get profile
      let profile = await profileRepository.findByUserId(userId);
      
      // If no profile exists, create a default one
      if (!profile) {
        profile = await profileRepository.createProfile({
          user_id: userId,
          level: 1
        });
      }
      
      return { user, profile };
    } catch (error) {
      logger.error('Error fetching user with profile', { error, userId });
      throw error;
    }
  }
  
  /**
   * Update user
   */
  async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
    try {
      // Verify user exists
      const existingUser = await userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }
      
      // If email is being updated, check if it's already in use
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await userRepository.findByEmail(data.email);
        if (emailExists && emailExists.id !== userId) {
          throw new ConflictError('Email already in use');
        }
      }
      
      // Update user
      const updatedUser = await userRepository.updateUser(userId, data);
      if (!updatedUser) {
        throw new Error('User update failed');
      }
      
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user', { error, userId });
      throw error;
    }
  }
  
  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<Profile> {
    try {
      // Verify user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Get existing profile
      let profile = await profileRepository.findByUserId(userId);
      
      // If username is being updated, check if it's already in use
      if (data.username) {
        const existingUsername = await profileRepository.findByUsername(data.username);
        if (existingUsername && existingUsername.user_id !== userId) {
          throw new ConflictError('Username already in use');
        }
      }
      
      // Create or update profile
      if (!profile) {
        profile = await profileRepository.createProfile({
          user_id: userId,
          level: 1,
          ...data
        });
      } else {
        profile = await profileRepository.updateProfile(userId, data);
        if (!profile) {
          throw new Error('Profile update failed');
        }
      }
      
      return profile;
    } catch (error) {
      logger.error('Error updating profile', { error, userId });
      throw error;
    }
  }
  
  /**
   * Complete user onboarding
   */
  async completeOnboarding(
    userId: string, 
    profileData: UpdateProfileDto
  ): Promise<{ user: User; profile: Profile }> {
    try {
      // Verify user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Update profile with onboarding data
      const profile = await this.updateProfile(userId, profileData);
      
      // Set user as onboarded in metadata (could be stored in user table or profile)
      // This is a simplified approach - in a real system you might have an onboarding_completed flag
      await profileRepository.updateProfile(userId, {
        preferences: {
          ...(profile.preferences || {}),
          onboardingCompleted: true
        }
      });
      
      // Log onboarding completion
      auditLogger.logAuditEvent('user.onboarding.completed', userId, {
        timestamp: new Date().toISOString()
      });
      
      return { user, profile };
    } catch (error) {
      logger.error('Error completing onboarding', { error, userId });
      throw error;
    }
  }
  
  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      // Check for existing username
      const existingUsername = await profileRepository.findByUsername(username);
      return !existingUsername;
    } catch (error) {
      logger.error('Error checking username availability', { error, username });
      throw error;
    }
  }
  
  /**
   * Search users
   */
  async searchUsers(
    query: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<User[]> {
    try {
      if (query.length < 3) {
        throw new ValidationError('Search query must be at least 3 characters');
      }
      
      // Search by display name
      return await userRepository.searchByDisplayName(query, limit);
    } catch (error) {
      logger.error('Error searching users', { error, query });
      throw error;
    }
  }
  
  /**
   * Get recent users
   */
  async getRecentUsers(limit: number = 10): Promise<User[]> {
    try {
      return await userRepository.getRecentUsers(limit);
    } catch (error) {
      logger.error('Error getting recent users', { error, limit });
      throw error;
    }
  }
  
  /**
   * Increment user profile level
   */
  async incrementUserLevel(userId: string): Promise<Profile | null> {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Get profile
      const profile = await profileRepository.findByUserId(userId);
      if (!profile) {
        throw new NotFoundError('User profile not found');
      }
      
      // Increment level
      const updatedProfile = await profileRepository.incrementLevel(userId);
      
      // Log level-up event
      auditLogger.logAuditEvent('user.level.increased', userId, {
        oldLevel: profile.level,
        newLevel: (updatedProfile?.level || profile.level + 1),
        timestamp: new Date().toISOString()
      });
      
      return updatedProfile;
    } catch (error) {
      logger.error('Error incrementing user level', { error, userId });
      throw error;
    }
  }
}

// Create and export singleton instance
export const userService = new UserService();
