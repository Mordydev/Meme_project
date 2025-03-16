import { Pool } from 'pg';
import { UserRepository } from './repository';
import { 
  User, 
  CreateUserDto, 
  UpdateUserDto, 
  PublicUserData, 
  PrivateUserData, 
  SearchUsersRequest,
  UserSearchResponse 
} from './types';
import { ValidationError, NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { ProfileService } from '../profiles/service';

/**
 * User service for business logic related to users
 */
export class UserService {
  private repository: UserRepository;
  private profileService: ProfileService;
  
  constructor(db: Pool) {
    this.repository = new UserRepository(db);
    this.profileService = new ProfileService(db);
  }
  
  /**
   * Create a new user
   */
  async createUser(data: CreateUserDto): Promise<User> {
    try {
      // Check if email is already in use
      const existingUser = await this.repository.findByEmail(data.email);
      
      if (existingUser) {
        throw new ValidationError('Email already in use');
      }
      
      // Create user
      const user = await this.repository.create(data);
      
      // Create default profile for user
      await this.profileService.createProfile(user.id, {
        bio: `Hi, I'm ${user.display_name}!`
      });
      
      return user;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Error creating user', { data, error });
      throw error;
    }
  }
  
  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const user = await this.repository.findById(id);
      
      if (!user) {
        throw new NotFoundError('User', id);
      }
      
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error getting user by ID', { id, error });
      throw error;
    }
  }
  
  /**
   * Update a user
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.repository.findById(id);
      
      if (!existingUser) {
        throw new NotFoundError('User', id);
      }
      
      // Check if updating to an email that's already in use
      if (data.email && data.email !== existingUser.email) {
        const emailUser = await this.repository.findByEmail(data.email);
        
        if (emailUser && emailUser.id !== id) {
          throw new ValidationError('Email already in use');
        }
      }
      
      // Update user
      const updatedUser = await this.repository.update(id, data);
      
      if (!updatedUser) {
        throw new NotFoundError('User', id);
      }
      
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Error updating user', { id, data, error });
      throw error;
    }
  }
  
  /**
   * Update last login time
   */
  async updateLastLogin(id: string): Promise<User | null> {
    try {
      return await this.repository.updateLastLogin(id);
    } catch (error) {
      logger.error('Error updating last login', { id, error });
      return null;
    }
  }
  
  /**
   * Delete a user (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const deleted = await this.repository.softDelete(id);
      
      if (!deleted) {
        throw new NotFoundError('User', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error deleting user', { id, error });
      throw error;
    }
  }
  
  /**
   * Get user's public data
   */
  async getPublicUserData(id: string): Promise<PublicUserData> {
    try {
      const user = await this.getUserById(id);
      const profile = await this.profileService.getProfile(id);
      
      return {
        id: user.id,
        displayName: user.display_name,
        profileImageUrl: profile?.avatar_url
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error getting public user data', { id, error });
      throw error;
    }
  }
  
  /**
   * Get user's private data (for the user themselves)
   */
  async getPrivateUserData(id: string): Promise<PrivateUserData> {
    try {
      const user = await this.getUserById(id);
      const profile = await this.profileService.getProfile(id);
      
      return {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        authProvider: user.auth_provider,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        status: user.status,
        profileImageUrl: profile?.avatar_url
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error getting private user data', { id, error });
      throw error;
    }
  }
  
  /**
   * Search for users
   */
  async searchUsers(options: SearchUsersRequest): Promise<UserSearchResponse> {
    try {
      const { users, total } = await this.repository.search({
        query: options.query,
        status: options.status,
        limit: options.limit || 10,
        offset: options.offset || 0
      });
      
      // Map to public user data
      const publicUsers: PublicUserData[] = await Promise.all(
        users.map(async (user) => {
          const profile = await this.profileService.getProfile(user.id);
          
          return {
            id: user.id,
            displayName: user.display_name,
            profileImageUrl: profile?.avatar_url
          };
        })
      );
      
      return {
        users: publicUsers,
        total,
        limit: options.limit || 10,
        offset: options.offset || 0
      };
    } catch (error) {
      logger.error('Error searching users', { options, error });
      throw error;
    }
  }
  
  /**
   * Get or create a user from Clerk data
   */
  async getOrCreateClerkUser(clerkData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.repository.findById(clerkData.id);
      
      if (existingUser) {
        // Update last login
        await this.updateLastLogin(existingUser.id);
        return existingUser;
      }
      
      // Create new user
      const displayName = [clerkData.firstName, clerkData.lastName]
        .filter(Boolean)
        .join(' ') || clerkData.email.split('@')[0];
      
      return this.createUser({
        id: clerkData.id,
        email: clerkData.email,
        display_name: displayName,
        auth_provider: 'clerk'
      });
    } catch (error) {
      logger.error('Error getting or creating Clerk user', { clerkData, error });
      throw error;
    }
  }
}
