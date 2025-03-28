// Removed FastifyInstance import
import { User, Profile, NewUser, NewProfile } from '../database/schema/users'; // Import Drizzle types
import { UserRepository, userRepository } from '../repositories/user-repository'; // Import singleton instance
import { PointsRepository, pointsRepository, AwardPointsInput } from '../repositories/points-repository'; // Import singleton instance and input type
import { ValidationError } from '../lib/errors'; // Assuming this error class exists
import { Logger } from 'pino';

// Placeholder for logger import (adjust path as needed)
let logger: Logger;
try {
  const loggerModule = require('../lib/logger.js'); // Using require for CommonJS
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../lib/logger.js', using console.", e);
  logger = console as any;
}

/**
 * Service for user-related business logic
 * Implements the service layer pattern for business logic abstraction.
 * Uses dependency injection for repositories.
 */
export class UserService {
  // Use private readonly for injected dependencies
  private readonly userRepository: UserRepository;
  private readonly pointsRepository: PointsRepository;

  // Inject repository instances (using defaults for singleton pattern)
  constructor(
    userRepo: UserRepository = userRepository,
    pointsRepo: PointsRepository = pointsRepository
  ) {
    this.userRepository = userRepo;
    this.pointsRepository = pointsRepo;
  }
  
  /**
   * Get a user by ID
   * 
   * @param id User ID
   * @returns User object or null if not found
   */
  async getUserById(id: string): Promise<User | null> {
    // findById now returns null if not found
    return this.userRepository.findById(id);
  }
  
  /**
   * Create a new user
   * 
   * @param userData Data for the new user (conforming to NewUser type).
   * @param profileData Optional data for the user's profile.
   * @returns The newly created User entity.
   * @throws ValidationError if email already exists.
   * @throws Error if user creation fails.
   */
  async createUser(userData: NewUser, profileData: Omit<NewProfile, 'userId'> = {}): Promise<User> {
    try {
      // Check if email already exists
      if (userData.email) {
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
          logger.warn('Attempted to create user with existing email', { email: userData.email });
          throw new ValidationError('Email already in use', {
            email: 'This email is already registered'
          });
        }
      } else {
          // Handle cases where email might be missing if schema allows
          throw new ValidationError('Email is required to create a user.', { email: 'Email cannot be empty' });
      }

      // Create user with profile using the repository method
      logger.info('Attempting to create user and profile', { email: userData.email });
      const user = await this.userRepository.createWithProfile(userData, profileData);

      // Award welcome points using PointsRepository
      const welcomeBonus: AwardPointsInput = {
        userId: user.id,
        amount: 100, // Welcome bonus amount
        source: 'welcome_bonus',
        description: 'Welcome to Success Kid Community!'
      };
      await this.pointsRepository.awardPoints(welcomeBonus);
      logger.info(`Awarded welcome bonus to user ${user.id}`);

      return user;

    } catch (error) {
      // Log the error and re-throw or handle appropriately
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error creating user in UserService', { error: errorMsg, email: userData.email });

      // Re-throw validation errors directly
      if (error instanceof ValidationError) {
          throw error;
      }

      // Wrap other errors
      throw new Error(`Failed to create user: ${errorMsg}`);
    }
  }
  
  /**
   * Update a user
   * 
   * @param id User ID
   * @param userData User data to update (Partial<NewUser> based on BaseRepository)
   * @returns Updated user or null if not found
   */
  async updateUser(id: string, userData: Partial<NewUser>): Promise<User | null> {
    try {
        // Validate email uniqueness if changing email
        if (userData.email) {
          const existingUser = await this.userRepository.findByEmail(userData.email);
          if (existingUser && existingUser.id !== id) {
             logger.warn('Attempted to update user email to an existing one', { userId: id, newEmail: userData.email });
             throw new ValidationError('Email already in use', {
               email: 'This email is already registered by another user.'
             });
          }
        }

        // Update user using repository method
        logger.info('Attempting to update user', { userId: id });
        const updatedUser = await this.userRepository.update(id, userData);

        if (!updatedUser) {
            logger.warn('User not found for update', { userId: id });
            // Optionally throw a NotFoundError here
        } else {
            logger.info('User updated successfully', { userId: id });
        }

        return updatedUser;

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Error updating user in UserService', { error: errorMsg, userId: id });
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error(`Failed to update user: ${errorMsg}`);
    }
  }

  // --- Add other service methods as needed ---
  // Example: Get user with profile
  async getUserWithProfile(userId: string): Promise<{ user: User; profile: Profile | null } | null> {
      return this.userRepository.getUserWithProfile(userId);
  }

}

// Export a singleton instance if desired, or instantiate where needed
export const userService = new UserService();
