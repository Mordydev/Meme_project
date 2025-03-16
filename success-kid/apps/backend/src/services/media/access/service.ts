/**
 * Media Access Service
 * 
 * Manages access control and permissions for media files.
 */
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { 
  MediaPermission, 
  CreateMediaPermissionDto,
  UpdateMediaPermissionDto,
  TemporaryAccess,
  CreateTemporaryAccessDto,
  PermissionType,
  EntityType
} from '../../../models/entities/media';
import { logger } from '../../../lib/logger';

// Forward declaration of repository - will be implemented separately
// This is to avoid circular dependencies
// In a real implementation, these would be proper repositories with database integration
const mediaPermissionRepository = {
  create: async (data: any) => ({ id: uuidv4(), ...data }),
  findById: async (id: string) => null,
  delete: async (id: string) => true,
  findByMediaId: async (mediaId: string) => [] as MediaPermission[]
};

const temporaryAccessRepository = {
  create: async (data: any) => ({ ...data, token: uuidv4() }),
  findByToken: async (token: string) => null,
  delete: async (token: string) => true
};

/**
 * Media Access Service
 */
export class MediaAccessService {
  private secretKey: string;
  
  /**
   * Create a new media access service
   * @param secretKey Secret key for signing tokens
   */
  constructor(secretKey: string = 'default-media-access-secret') {
    this.secretKey = secretKey;
  }
  
  /**
   * Check if a user has the specified permission for a media file
   * @param mediaId Media file ID
   * @param userId User ID
   * @param permission Permission type
   * @returns Whether user has permission
   */
  async hasPermission(
    mediaId: string,
    userId: string,
    permission: PermissionType
  ): Promise<boolean> {
    try {
      logger.debug(`Checking permission ${permission} for user ${userId} on media ${mediaId}`);
      
      // Get media permissions
      const permissions = await mediaPermissionRepository.findByMediaId(mediaId);
      
      // Check user-specific permissions
      const userPermission = permissions.find(p => 
        p.entity_type === 'user' && 
        p.entity_id === userId &&
        p.permission === permission
      );
      
      if (userPermission) {
        // Check if permission is expired
        if (userPermission.expires_at && userPermission.expires_at < new Date()) {
          return false;
        }
        
        return true;
      }
      
      // Check role-based permissions (requires user roles to be passed or retrieved)
      // This is a simplified check - in a real system, you'd get the user's roles
      const userRoles = ['user']; // Get from user service or pass into function
      
      const rolePermission = permissions.find(p => 
        p.entity_type === 'role' && 
        userRoles.includes(p.entity_id || '') &&
        p.permission === permission
      );
      
      if (rolePermission) {
        // Check if permission is expired
        if (rolePermission.expires_at && rolePermission.expires_at < new Date()) {
          return false;
        }
        
        return true;
      }
      
      // Check public permissions
      const publicPermission = permissions.find(p => 
        p.entity_type === 'public' &&
        p.permission === permission
      );
      
      if (publicPermission) {
        // Check if permission is expired
        if (publicPermission.expires_at && publicPermission.expires_at < new Date()) {
          return false;
        }
        
        return true;
      }
      
      // No permission found
      return false;
    } catch (error) {
      logger.error(`Error checking permission for ${mediaId}`, { error, userId, permission });
      return false;
    }
  }
  
  /**
   * Grant a permission for a media file
   * @param permission Permission to grant
   * @returns Created permission
   */
  async grantPermission(
    permission: CreateMediaPermissionDto
  ): Promise<MediaPermission> {
    try {
      logger.debug(`Granting permission for media ${permission.media_id}`, permission);
      
      // Create permission
      return await mediaPermissionRepository.create(permission);
    } catch (error) {
      logger.error(`Error granting permission for ${permission.media_id}`, { error, permission });
      throw error;
    }
  }
  
  /**
   * Revoke a permission
   * @param permissionId Permission ID
   * @returns Success indication
   */
  async revokePermission(permissionId: string): Promise<boolean> {
    try {
      logger.debug(`Revoking permission ${permissionId}`);
      
      // Delete permission
      return await mediaPermissionRepository.delete(permissionId);
    } catch (error) {
      logger.error(`Error revoking permission ${permissionId}`, { error });
      throw error;
    }
  }
  
  /**
   * Get all permissions for a media file
   * @param mediaId Media file ID
   * @returns Array of permissions
   */
  async getMediaPermissions(mediaId: string): Promise<MediaPermission[]> {
    try {
      logger.debug(`Getting permissions for media ${mediaId}`);
      
      // Get permissions
      return await mediaPermissionRepository.findByMediaId(mediaId);
    } catch (error) {
      logger.error(`Error getting permissions for ${mediaId}`, { error });
      throw error;
    }
  }
  
  /**
   * Create temporary access to a media file
   * @param mediaId Media file ID
   * @param data Temporary access data
   * @returns Temporary access token
   */
  async createTemporaryAccess(
    mediaId: string,
    data: CreateTemporaryAccessDto
  ): Promise<string> {
    try {
      logger.debug(`Creating temporary access for media ${mediaId}`, { duration: data.duration });
      
      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.duration);
      
      // Create temporary access
      const access = await temporaryAccessRepository.create({
        media_id: mediaId,
        expires_at: expiresAt,
        created_by: data.created_by,
        created_at: new Date()
      });
      
      return access.token;
    } catch (error) {
      logger.error(`Error creating temporary access for ${mediaId}`, { error });
      throw error;
    }
  }
  
  /**
   * Verify temporary access token
   * @param mediaId Media file ID
   * @param token Access token
   * @returns Whether token is valid
   */
  async verifyTemporaryAccess(
    mediaId: string,
    token: string
  ): Promise<boolean> {
    try {
      logger.debug(`Verifying temporary access for media ${mediaId}`);
      
      // Get temporary access
      const access = await temporaryAccessRepository.findByToken(token);
      
      // Check if token exists and matches media ID
      if (!access || access.media_id !== mediaId) {
        return false;
      }
      
      // Check if token is expired
      if (access.expires_at < new Date()) {
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Error verifying temporary access for ${mediaId}`, { error });
      return false;
    }
  }
  
  /**
   * Generate a signed URL for media access
   * @param mediaId Media file ID
   * @param expiresIn Expiration time in seconds
   * @param options URL options
   * @returns Signed URL
   */
  generateSignedUrl(
    mediaId: string,
    expiresIn: number,
    options: {
      variant?: string;
      transform?: string;
      download?: boolean;
    } = {}
  ): string {
    try {
      // Create expiration timestamp
      const expires = Math.floor(Date.now() / 1000) + expiresIn;
      
      // Create URL parameters
      const params = new URLSearchParams();
      params.append('expires', expires.toString());
      
      if (options.variant) {
        params.append('variant', options.variant);
      }
      
      if (options.transform) {
        params.append('transform', options.transform);
      }
      
      if (options.download) {
        params.append('download', '1');
      }
      
      // Create string to sign
      const stringToSign = `${mediaId}?${params.toString()}`;
      
      // Generate signature
      const signature = crypto
        .createHmac('sha256', this.secretKey)
        .update(stringToSign)
        .digest('hex');
      
      // Add signature to params
      params.append('signature', signature);
      
      // Return URL
      return `/api/v1/media/${mediaId}?${params.toString()}`;
    } catch (error) {
      logger.error(`Error generating signed URL for ${mediaId}`, { error });
      throw error;
    }
  }
  
  /**
   * Verify a signed URL
   * @param mediaId Media file ID
   * @param signature Signature string
   * @param expires Expiration timestamp
   * @param params Original URL parameters
   * @returns Whether signature is valid
   */
  verifySignedUrl(
    mediaId: string,
    signature: string,
    expires: number,
    params: URLSearchParams
  ): boolean {
    try {
      // Check if URL is expired
      const now = Math.floor(Date.now() / 1000);
      if (now > expires) {
        return false;
      }
      
      // Create signature params (without the signature itself)
      const signatureParams = new URLSearchParams();
      signatureParams.append('expires', expires.toString());
      
      // Add other parameters except signature
      params.forEach((value, key) => {
        if (key !== 'signature' && key !== 'expires') {
          signatureParams.append(key, value);
        }
      });
      
      // Create string to sign
      const stringToSign = `${mediaId}?${signatureParams.toString()}`;
      
      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(stringToSign)
        .digest('hex');
      
      // Compare signatures
      return signature === expectedSignature;
    } catch (error) {
      logger.error(`Error verifying signed URL for ${mediaId}`, { error });
      return false;
    }
  }
}

// Create and export service instance
export const accessService = new MediaAccessService(
  process.env.MEDIA_ACCESS_SECRET || 'default-media-access-secret'
);
