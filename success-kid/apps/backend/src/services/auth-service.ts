/**
 * Authentication and Authorization Service
 */
import { randomUUID } from 'crypto';
import { verifyClerkJWT, mapClerkUserToSystemUser, ClerkUser, extractTokenFromHeader } from '../lib/clerk';
import { logger } from '../lib/logger';
import { User, NewUserInput } from '../models/user';
import { RoleRepository, PermissionRepository } from '../repositories/role-repository';
import { UserRepository } from '../repositories/user-repository';
import { ProfileRepository } from '../repositories/profile-repository';
import { SessionService } from './session-service';
import { DatabaseError, AuthorizationError, ForbiddenError } from '../errors';
import { CreateSessionInput, TokenPair, Session } from '../models/session';
import { redis } from '../lib/redis';

/**
 * Service for authentication and authorization
 */
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private profileRepository: ProfileRepository,
    private roleRepository: RoleRepository,
    private permissionRepository: PermissionRepository,
    private sessionService: SessionService
  ) {}

  /**
   * Authenticate a user with Clerk JWT
   * Creates a user record if it doesn't exist
   * 
   * @param token The JWT token to verify
   * @returns The authenticated user and session tokens
   */
  async authenticateWithClerk(token: string, ipAddress?: string, userAgent?: string): Promise<{
    user: User;
    tokens: TokenPair;
    isNewUser: boolean;
  } | null> {
    try {
      // Verify the JWT with Clerk
      const clerkUser = await verifyClerkJWT(token);
      
      if (!clerkUser) {
        return null;
      }
      
      // Check if user exists in our database
      let user = await this.userRepository.findByEmail(clerkUser.email);
      let isNewUser = false;
      
      if (!user) {
        // User doesn't exist, create a new one
        isNewUser = true;
        user = await this.createUserFromClerk(clerkUser);
      } else {
        // Update last login time
        user = await this.userRepository.updateLastLogin(user.id) || user;
      }
      
      // Create a session
      const session = await this.sessionService.createSession({
        user_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      // Get user roles and permissions
      const roles = await this.getUserRoles(user.id);
      const permissions = await this.getUserPermissions(user.id);
      
      // Generate tokens
      const tokens = await this.sessionService.generateTokens(
        user.id,
        session.id,
        roles.map(r => r.name),
        permissions.map(p => `${p.resource}:${p.action}`)
      );
      
      return { user, tokens, isNewUser };
    } catch (error) {
      logger.error('Authentication with Clerk failed', { error });
      return null;
    }
  }
  
  /**
   * Create a new user from Clerk user data
   */
  private async createUserFromClerk(clerkUser: ClerkUser): Promise<User> {
    try {
      // Map Clerk user to our user model
      const userInput = mapClerkUserToSystemUser(clerkUser);
      
      // Create the user in a transaction
      const user = await this.userRepository.createUser({
        id: userInput.id,
        email: userInput.email,
        display_name: userInput.display_name,
        auth_provider: 'clerk'
      });
      
      // Create initial profile
      await this.profileRepository.createProfile({
        user_id: user.id,
        avatar_url: userInput.avatar_url,
        bio: ''
      });
      
      // Assign default user role
      await this.assignDefaultRole(user.id);
      
      return user;
    } catch (error) {
      logger.error('Error creating user from Clerk data', { error });
      throw new DatabaseError('Failed to create user from Clerk data');
    }
  }
  
  /**
   * Assign default role to a new user
   */
  private async assignDefaultRole(userId: string): Promise<void> {
    try {
      // Get the default user role
      const defaultRole = await this.roleRepository.findByName('user');
      
      if (!defaultRole) {
        logger.error('Default user role not found');
        return;
      }
      
      // Assign the role to the user
      await this.roleRepository.assignRoleToUser(userId, defaultRole.id);
    } catch (error) {
      logger.error('Error assigning default role', { error, userId });
      // Non-critical error, don't throw
    }
  }
  
  /**
   * Log out a user by invalidating their session
   */
  async logout(sessionId: string): Promise<boolean> {
    try {
      await this.sessionService.deleteSession(sessionId);
      return true;
    } catch (error) {
      logger.error('Error logging out user', { error, sessionId });
      return false;
    }
  }
  
  /**
   * Log out a user from all devices
   */
  async logoutAll(userId: string, currentSessionId?: string): Promise<boolean> {
    try {
      await this.sessionService.deleteAllUserSessions(userId, currentSessionId);
      return true;
    } catch (error) {
      logger.error('Error logging out user from all devices', { error, userId });
      return false;
    }
  }
  
  /**
   * Refresh authentication tokens
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    return await this.sessionService.refreshTokens(refreshToken);
  }
  
  /**
   * Get a user's roles
   */
  async getUserRoles(userId: string, organizationId?: string) {
    return await this.roleRepository.getUserRoles(userId, organizationId);
  }
  
  /**
   * Get a user's permissions
   */
  async getUserPermissions(userId: string, organizationId?: string) {
    return await this.permissionRepository.getUserPermissions(userId, organizationId);
  }
  
  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, resource: string, action: string, organizationId?: string): Promise<boolean> {
    try {
      // Get user permissions
      const permissions = await this.permissionRepository.getUserPermissions(userId, organizationId);
      
      // Check for exact permission
      const hasExactPermission = permissions.some(
        p => p.resource === resource && p.action === action
      );
      
      if (hasExactPermission) return true;
      
      // Check for wildcard "manage" permission for the resource
      const hasManagePermission = permissions.some(
        p => p.resource === resource && p.action === 'manage'
      );
      
      if (hasManagePermission) return true;
      
      // Check for global admin permission
      const hasGlobalAdmin = permissions.some(
        p => p.resource === '*' && p.action === '*'
      );
      
      return hasGlobalAdmin;
    } catch (error) {
      logger.error('Error checking permission', { error, userId, resource, action });
      return false;
    }
  }
  
  /**
   * Verify a user has the required permission or throw error
   */
  async requirePermission(userId: string, resource: string, action: string, organizationId?: string): Promise<void> {
    const hasPermission = await this.hasPermission(userId, resource, action, organizationId);
    
    if (!hasPermission) {
      throw new ForbiddenError(`You do not have permission to ${action} on ${resource}`);
    }
  }
  
  /**
   * Check if a user has a specific role
   */
  async hasRole(userId: string, roleName: string, organizationId?: string): Promise<boolean> {
    return await this.roleRepository.userHasRole(userId, roleName, organizationId);
  }
  
  /**
   * Assign a role to a user
   */
  async assignRole(userId: string, roleName: string, organizationId?: string): Promise<void> {
    try {
      // Find the role
      const role = await this.roleRepository.findByName(roleName);
      
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }
      
      // Assign the role
      await this.roleRepository.assignRoleToUser(userId, role.id, organizationId);
    } catch (error) {
      logger.error('Error assigning role', { error, userId, roleName });
      throw error;
    }
  }
  
  /**
   * Remove a role from a user
   */
  async removeRole(userId: string, roleName: string, organizationId?: string): Promise<void> {
    try {
      // Find the role
      const role = await this.roleRepository.findByName(roleName);
      
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }
      
      // Remove the role
      await this.roleRepository.removeRoleFromUser(userId, role.id, organizationId);
    } catch (error) {
      logger.error('Error removing role', { error, userId, roleName });
      throw error;
    }
  }
  
  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    return await this.sessionService.getUserSessions(userId);
  }
  
  /**
   * Verify a request is authenticated and has required permissions
   */
  async verifyRequest(
    authorization: string | undefined, 
    { resource, action, required = true }: { 
      resource?: string; 
      action?: string; 
      required?: boolean;
    } = {}
  ) {
    try {
      // Extract token
      const token = extractTokenFromHeader(authorization);
      
      if (!token) {
        if (required) {
          throw new AuthorizationError('Authentication required');
        } else {
          return { authenticated: false, userId: null };
        }
      }
      
      // Verify token
      const result = await this.sessionService.verifyToken(token);
      
      if (!result.valid || !result.payload) {
        if (required) {
          throw new AuthorizationError('Invalid or expired token');
        } else {
          return { authenticated: false, userId: null };
        }
      }
      
      // Update session activity
      await this.sessionService.updateSessionActivity(result.payload.jti);
      
      const userId = result.payload.sub;
      
      // Check permission if resource and action are provided
      if (resource && action) {
        const hasPermission = await this.hasPermission(userId, resource, action);
        
        if (!hasPermission) {
          throw new ForbiddenError(`You do not have permission to ${action} on ${resource}`);
        }
      }
      
      return { authenticated: true, userId, sessionId: result.payload.jti };
    } catch (error) {
      if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
        throw error;
      }
      
      logger.error('Error verifying request', { error });
      
      if (required) {
        throw new AuthorizationError('Authentication failed');
      } else {
        return { authenticated: false, userId: null };
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService(
  // Dependencies will be initialized in a separate initialization module
  null as unknown as UserRepository,
  null as unknown as ProfileRepository,
  null as unknown as RoleRepository,
  null as unknown as PermissionRepository,
  null as unknown as SessionService
);

// Method to initialize the authService with dependencies
export function initializeAuthService(
  userRepository: UserRepository,
  profileRepository: ProfileRepository,
  roleRepository: RoleRepository,
  permissionRepository: PermissionRepository,
  sessionService: SessionService
) {
  // Use Object.assign to initialize the authService singleton
  Object.assign(authService, new AuthService(
    userRepository,
    profileRepository,
    roleRepository,
    permissionRepository,
    sessionService
  ));
}
