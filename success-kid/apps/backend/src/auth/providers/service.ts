import { ClerkUser } from '../clerk/client';
import { logger } from '../../lib/logger';
import { AppError } from '../../lib/errors';
import { securityAuditService, AuthEvent } from '../security/audit-service';

/**
 * Auth provider types
 */
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  GITHUB = 'github',
  WALLET = 'wallet',
  APPLE = 'apple'
}

/**
 * Unified user identity from any provider
 */
export interface UserIdentity {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  provider: AuthProvider;
  providerUserId?: string; // ID from the provider (e.g., Google ID)
  emailVerified: boolean;
  metadata?: Record<string, any>;
}

/**
 * Service to handle multiple authentication providers
 */
export class AuthProviderService {
  /**
   * Normalize user data from Clerk
   * 
   * @param clerkUser User data from Clerk
   * @returns Normalized user identity
   */
  normalizeClerkUser(clerkUser: ClerkUser): UserIdentity {
    // Determine provider based on available data
    // This is simplified - Clerk actually provides provider info
    let provider = AuthProvider.EMAIL;
    
    return {
      id: clerkUser.id,
      email: clerkUser.email,
      username: clerkUser.username,
      displayName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || clerkUser.email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      profileImageUrl: clerkUser.profileImageUrl,
      provider: provider,
      emailVerified: true, // Clerk handles email verification
      metadata: clerkUser.metadata
    };
  }
  
  /**
   * Link multiple identities for a user
   * 
   * @param primaryUserId Primary user ID
   * @param secondaryIdentity Secondary identity to link
   */
  async linkIdentities(primaryUserId: string, secondaryIdentity: UserIdentity): Promise<void> {
    try {
      // This would normally update a database to link the identities
      // For now, we'll just log it
      logger.info('Linking identities', { primaryUserId, secondaryIdentity });
      
      // Log the linking event
      await securityAuditService.logAuthEvent(
        AuthEvent.ACCOUNT_UPDATE,
        {
          userId: primaryUserId,
          action: 'link_identity',
          provider: secondaryIdentity.provider
        }
      );
    } catch (error) {
      logger.error('Error linking identities', { primaryUserId, secondaryIdentity, error });
      throw new AppError('Failed to link identities', 'IDENTITY_LINK_FAILED', 500);
    }
  }
  
  /**
   * Unlink a specific identity for a user
   * 
   * @param userId User ID
   * @param provider Provider to unlink
   */
  async unlinkIdentity(userId: string, provider: AuthProvider): Promise<void> {
    try {
      // This would normally update a database to unlink the identity
      // For now, we'll just log it
      logger.info('Unlinking identity', { userId, provider });
      
      // Log the unlinking event
      await securityAuditService.logAuthEvent(
        AuthEvent.ACCOUNT_UPDATE,
        {
          userId,
          action: 'unlink_identity',
          provider
        }
      );
    } catch (error) {
      logger.error('Error unlinking identity', { userId, provider, error });
      throw new AppError('Failed to unlink identity', 'IDENTITY_UNLINK_FAILED', 500);
    }
  }
  
  /**
   * Get all identities for a user
   * 
   * @param userId User ID
   * @returns Array of linked identities
   */
  async getUserIdentities(userId: string): Promise<UserIdentity[]> {
    try {
      // This would normally query a database for linked identities
      // For now, we'll return a placeholder
      return [{
        id: userId,
        provider: AuthProvider.EMAIL,
        emailVerified: true
      }];
    } catch (error) {
      logger.error('Error getting user identities', { userId, error });
      throw new AppError('Failed to get user identities', 'IDENTITY_FETCH_FAILED', 500);
    }
  }
  
  /**
   * Get primary identity for a user
   * 
   * @param userId User ID
   * @returns Primary identity
   */
  async getPrimaryIdentity(userId: string): Promise<UserIdentity | null> {
    try {
      const identities = await this.getUserIdentities(userId);
      return identities.length > 0 ? identities[0] : null;
    } catch (error) {
      logger.error('Error getting primary identity', { userId, error });
      throw new AppError('Failed to get primary identity', 'IDENTITY_FETCH_FAILED', 500);
    }
  }
}

// Export singleton instance
export const authProviderService = new AuthProviderService();
