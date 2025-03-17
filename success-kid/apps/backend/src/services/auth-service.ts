/**
 * Auth Service
 * 
 * Business logic for authentication and authorization
 */
import { ClerkUser } from '../auth/clerk/types';
import { userRepository, profileRepository, roleRepository, walletRepository } from '../repositories';
import { User, CreateUserDto } from '../models/user';
import { sessionService } from './session-service';
import { auditLogger } from '../auth/audit';
import { logger } from '../lib/logger';
import { NotFoundError, UnauthorizedError } from '../errors';
import { generateUsername } from '../lib/username-generator';

export class AuthService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      return await userRepository.findById(id);
    } catch (error) {
      logger.error('Error getting user by ID', { error, id });
      throw error;
    }
  }
  
  /**
   * Get user by external ID (from auth provider)
   */
  async getUserByExternalId(externalId: string): Promise<User | null> {
    try {
      return await userRepository.findByExternalId(externalId);
    } catch (error) {
      logger.error('Error getting user by external ID', { error, externalId });
      throw error;
    }
  }
  
  /**
   * Get user by wallet address
   */
  async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    try {
      // Get wallet connection
      const wallet = await walletRepository.findByAddress(walletAddress);
      if (!wallet) {
        return null;
      }
      
      // Get associated user
      return await userRepository.findById(wallet.user_id);
    } catch (error) {
      logger.error('Error getting user by wallet address', { error, walletAddress });
      throw error;
    }
  }
  
  /**
   * Create a new user from a wallet address
   */
  async createUserFromWallet(walletAddress: string): Promise<User> {
    try {
      // Generate a username from the wallet address
      const walletShort = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
      const username = await generateUsername('wallet_' + walletShort);
      
      // Create user with wallet as auth provider
      const user = await userRepository.createUser({
        display_name: 'Wallet User',
        auth_provider: 'wallet',
        created_at: new Date(),
        last_login: new Date(),
        status: 'active'
      });
      
      // Create initial profile
      await profileRepository.createProfile({
        user_id: user.id,
        level: 1,
        username,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Log user creation
      auditLogger.logUserCreation(user.id, walletAddress, 'wallet');
      
      // Assign default role
      await this.assignDefaultRole(user.id);
      
      return user;
    } catch (error) {
      logger.error('Error creating user from wallet', { error, walletAddress });
      throw error;
    }
  }
  
  /**
   * Create or update user from external auth provider
   */
  async syncUserFromExternalAuth(clerkUser: ClerkUser): Promise<User> {
    try {
      // Check if user already exists
      let user = await userRepository.findByExternalId(clerkUser.id);
      
      if (user) {
        // Update existing user
        user = await userRepository.updateUser(user.id, {
          email: clerkUser.email,
          display_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'User',
          last_login: new Date()
        });
        
        if (!user) {
          throw new Error('Failed to update user');
        }
        
        // Update profile if needed
        const profile = await profileRepository.findByUserId(user.id);
        if (profile) {
          await profileRepository.updateProfile(user.id, {
            username: clerkUser.username || profile.username,
            avatar_url: clerkUser.imageUrl || profile.avatar_url,
            updated_at: new Date()
          });
        } else {
          // Create profile if it doesn't exist
          await profileRepository.createProfile({
            user_id: user.id,
            level: 1,
            avatar_url: clerkUser.imageUrl || null,
            username: clerkUser.username || null,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
        
        auditLogger.logUserLogin(user.id, clerkUser.id, 'clerk');
        return user;
      }
      
      // Create new user
      const newUser = await userRepository.createUser({
        external_id: clerkUser.id,
        email: clerkUser.email,
        display_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'User',
        auth_provider: 'clerk',
        created_at: new Date(),
        last_login: new Date(),
        status: 'active'
      });
      
      // Create initial profile
      await profileRepository.createProfile({
        user_id: newUser.id,
        level: 1,
        avatar_url: clerkUser.imageUrl || null,
        username: clerkUser.username || null,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Assign default role
      await this.assignDefaultRole(newUser.id);
      
      // Log user creation
      auditLogger.logUserCreation(newUser.id, clerkUser.id, 'clerk');
      
      return newUser;
    } catch (error) {
      logger.error('Error syncing user from external auth', { error, externalId: clerkUser.id });
      throw error;
    }
  }
  
  /**
   * Authenticate with Clerk JWT token
   */
  async authenticateWithClerk(token: string, ipAddress?: string, userAgent?: string) {
    // Implementation would verify the Clerk token and create or update the user
    // This is a simplified version
    
    return { 
      user: { id: 'user_123', display_name: 'Test User', email: 'test@example.com' },
      tokens: {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 900
      },
      isNewUser: false
    };
  }
  
  /**
   * Assign default role to user
   */
  async assignDefaultRole(userId: string): Promise<void> {
    try {
      // Get the default user role
      const userRole = await roleRepository.findByName('USER');
      if (!userRole) {
        logger.warn('Default USER role not found');
        return;
      }
      
      // Assign role to user
      await roleRepository.assignRoleToUser(userId, userRole.id);
      
      // Log role assignment
      auditLogger.logRoleAssignment(userId, 'USER', 'system');
    } catch (error) {
      logger.error('Error assigning default role', { error, userId });
      throw error;
    }
  }
  
  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleName: string, organizationId?: string): Promise<boolean> {
    try {
      return await roleRepository.userHasRole(userId, roleName, organizationId);
    } catch (error) {
      logger.error('Error checking user role', { error, userId, roleName });
      throw error;
    }
  }
  
  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roles: string[], organizationId?: string): Promise<boolean> {
    try {
      for (const role of roles) {
        const hasRole = await this.hasRole(userId, role, organizationId);
        if (hasRole) {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Error checking user roles', { error, userId, roles });
      throw error;
    }
  }
  
  /**
   * Check if user has permission for action on resource
   */
  async hasPermission(
    userId: string, 
    resource: string, 
    action: string, 
    organizationId?: string
  ): Promise<boolean> {
    try {
      return await roleRepository.userHasPermission(userId, resource, action, organizationId);
    } catch (error) {
      logger.error('Error checking user permission', { error, userId, resource, action });
      throw error;
    }
  }
  
  /**
   * Get user roles
   */
  async getUserRoles(userId: string, organizationId?: string): Promise<string[]> {
    try {
      return await roleRepository.getUserRoles(userId, organizationId);
    } catch (error) {
      logger.error('Error getting user roles', { error, userId });
      throw error;
    }
  }
  
  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string, organizationId?: string): Promise<string[]> {
    try {
      return await roleRepository.getUserPermissions(userId, organizationId);
    } catch (error) {
      logger.error('Error getting user permissions', { error, userId });
      throw error;
    }
  }
  
  /**
   * Create a session for user
   */
  async createSession(
    userId: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      // Get user
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Update last login
      await userRepository.updateLastLogin(userId);
      
      // Create session
      const result = await sessionService.createSession({
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      return {
        accessToken: result.tokens.access_token,
        refreshToken: result.tokens.refresh_token,
        expiresIn: result.tokens.expires_in
      };
    } catch (error) {
      logger.error('Error creating session', { error, userId });
      throw error;
    }
  }
  
  /**
   * Refresh tokens
   */
  async refreshTokens(
    userId: string, 
    sessionId: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } | null> {
    try {
      const tokens = await sessionService.refreshTokens(userId, sessionId);
      if (!tokens) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in
      };
    } catch (error) {
      logger.error('Error refreshing tokens', { error, userId, sessionId });
      throw error;
    }
  }
  
  /**
   * Logout (revoke session)
   */
  async logout(sessionId: string): Promise<boolean> {
    try {
      // Get session to get user ID
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        return false;
      }
      
      return await sessionService.revokeSession(sessionId, session.user_id);
    } catch (error) {
      logger.error('Error logging out', { error, sessionId });
      throw error;
    }
  }
  
  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<number> {
    try {
      return await sessionService.revokeAllUserSessions(userId);
    } catch (error) {
      logger.error('Error logging out from all devices', { error, userId });
      throw error;
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();
