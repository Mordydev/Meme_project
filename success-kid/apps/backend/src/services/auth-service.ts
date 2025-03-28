import { verifyClerkJWT } from '../lib/clerk';
import { logger } from '../lib/logger';

/**
 * Service for authentication and authorization
 */
export class AuthService {
  /**
   * Verify a JWT token
   * @param token The JWT token to verify
   * @returns The decoded user or null if invalid
   */
  async verifyToken(token: string) {
    try {
      return await verifyClerkJWT(token);
    } catch (error) {
      logger.error('Token verification error', { error });
      return null;
    }
  }
  
  /**
   * Check if a user has a specific permission
   * @param userId The user ID
   * @param permission The permission to check
   * @returns Whether the user has the permission
   */
  async hasPermission(userId: string, permission: string) {
    try {
      // This would typically involve checking a permissions database
      // For now, we'll use a simple implementation
      
      // Get the user's roles from database or metadata service
      const roles = await this.getUserRoles(userId);
      
      // Map roles to permissions (in a real system, this would be from a database)
      const rolePermissionsMap: Record<string, string[]> = {
        'admin': ['read', 'write', 'delete', 'manage_users'],
        'moderator': ['read', 'write', 'delete'],
        'user': ['read', 'write'],
      };
      
      // Check if any of the user's roles grant the requested permission
      return roles.some(role => rolePermissionsMap[role]?.includes(permission));
    } catch (error) {
      logger.error('Permission check error', { userId, permission, error });
      return false;
    }
  }
  
  /**
   * Get a user's roles
   * @param userId The user ID
   * @returns An array of role names
   */
  async getUserRoles(userId: string) {
    try {
      // This would typically be fetched from a database
      // For now, we'll return a default role
      // In production, implement proper role retrieval from your data store
      
      return ['user'];
    } catch (error) {
      logger.error('Error fetching user roles', { userId, error });
      return [];
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
