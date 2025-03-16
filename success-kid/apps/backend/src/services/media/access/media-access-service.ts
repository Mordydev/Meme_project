/**
 * Media Access Service
 * 
 * Manages access control and permissions for media files
 */
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { 
  MediaPermissionRepository 
} from '../../../repositories/media/media-permission-repository';
import { MediaRepository } from '../../../repositories/media/media-repository';
import { 
  PermissionEntityType, 
  PermissionType, 
  TemporaryAccessOptions 
} from '../../../models/media/media-permission';
import { getRedisClient } from '../../../lib/db-client';
import { logger } from '../../../lib/logger';
import { ForbiddenError, NotFoundError } from '../../../errors/api-errors';

/**
 * Media Access Service
 */
export class MediaAccessService {
  constructor(
    private mediaRepository: MediaRepository,
    private permissionRepository: MediaPermissionRepository
  ) {}
  
  /**
   * Check if user has permission for a media file
   */
  async hasPermission(
    mediaId: string, 
    userId: string, 
    permission: PermissionType
  ): Promise<boolean> {
    try {
      // Get media to check ownership
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        return false;
      }
      
      // Owner has all permissions
      if (media.userId === userId) {
        return true;
      }
      
      // Check permissions in repository
      return this.permissionRepository.hasPermission(mediaId, userId, permission);
    } catch (error) {
      logger.error('Error checking media permission', { error, mediaId, userId, permission });
      return false;
    }
  }
  
  /**
   * Grant permission to a media file
   */
  async grantPermission(
    mediaId: string, 
    grantingUserId: string,
    permission: {
      entityType: PermissionEntityType;
      entityId?: string;
      permission: PermissionType;
      expiresAt?: Date;
    }
  ) {
    try {
      // Check if media exists
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Check if granting user is the owner
      if (media.userId !== grantingUserId) {
        throw new ForbiddenError('Only the media owner can grant permissions');
      }
      
      // Create permission
      const result = await this.permissionRepository.createPermission({
        mediaId,
        entityType: permission.entityType,
        entityId: permission.entityId,
        permission: permission.permission,
        expiresAt: permission.expiresAt,
        createdBy: grantingUserId
      });
      
      return result;
    } catch (error) {
      logger.error('Error granting media permission', { error, mediaId, permission });
      throw error;
    }
  }
  
  /**
   * Revoke permission
   */
  async revokePermission(
    permissionId: string, 
    revokingUserId: string
  ) {
    try {
      // Get the permission
      const permission = await this.permissionRepository.findById(permissionId);
      
      if (!permission) {
        throw new NotFoundError('Permission not found');
      }
      
      // Get the media to check ownership
      const media = await this.mediaRepository.findById(permission.mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Check if revoking user is the owner
      if (media.userId !== revokingUserId) {
        throw new ForbiddenError('Only the media owner can revoke permissions');
      }
      
      // Delete the permission
      await this.permissionRepository.delete(permissionId);
      
      return { success: true };
    } catch (error) {
      logger.error('Error revoking media permission', { error, permissionId });
      throw error;
    }
  }
  
  /**
   * Get all permissions for a media file
   */
  async getMediaPermissions(mediaId: string, requestingUserId: string) {
    try {
      // Check if media exists
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Check if requesting user is the owner
      if (media.userId !== requestingUserId) {
        throw new ForbiddenError('Only the media owner can view permissions');
      }
      
      // Get permissions
      return this.permissionRepository.getMediaPermissions(mediaId);
    } catch (error) {
      logger.error('Error getting media permissions', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Create temporary access for a media file (time-limited token)
   */
  async createTemporaryAccess(
    mediaId: string, 
    userId: string, 
    options: TemporaryAccessOptions
  ): Promise<string> {
    try {
      // Check if user has permission to create temporary access
      const hasPermission = await this.hasPermission(mediaId, userId, PermissionType.READ);
      
      if (!hasPermission) {
        throw new ForbiddenError('No permission to create temporary access');
      }
      
      // Generate a unique token
      const token = uuidv4();
      
      // Store token in Redis with expiration
      const redis = getRedisClient();
      
      const tokenData = {
        mediaId,
        createdBy: userId,
        permissions: options.permissions,
        metadata: options.metadata || {},
        createdAt: new Date().toISOString()
      };
      
      await redis.set(
        `media:temp-access:${token}`,
        JSON.stringify(tokenData),
        'EX',
        options.duration
      );
      
      // Log the access creation
      logger.info('Created temporary media access', {
        mediaId,
        userId,
        token: token.substring(0, 8) + '...',
        expiresIn: options.duration
      });
      
      return token;
    } catch (error) {
      logger.error('Error creating temporary access', { error, mediaId, userId });
      throw error;
    }
  }
  
  /**
   * Verify temporary access token
   */
  async verifyTemporaryAccess(
    token: string,
    requiredPermission: PermissionType
  ): Promise<{ valid: boolean; mediaId?: string; metadata?: any }> {
    try {
      const redis = getRedisClient();
      
      // Get token data from Redis
      const tokenData = await redis.get(`media:temp-access:${token}`);
      
      if (!tokenData) {
        return { valid: false };
      }
      
      // Parse token data
      const data = JSON.parse(tokenData);
      
      // Check if token has the required permission
      if (!data.permissions.includes(requiredPermission)) {
        return { valid: false };
      }
      
      return {
        valid: true,
        mediaId: data.mediaId,
        metadata: data.metadata
      };
    } catch (error) {
      logger.error('Error verifying temporary access', { error, token });
      return { valid: false };
    }
  }
  
  /**
   * Revoke temporary access token
   */
  async revokeTemporaryAccess(token: string, userId: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      
      // Get token data from Redis
      const tokenData = await redis.get(`media:temp-access:${token}`);
      
      if (!tokenData) {
        return false;
      }
      
      // Parse token data
      const data = JSON.parse(tokenData);
      
      // Check if the user can revoke this token (creator or media owner)
      if (data.createdBy !== userId) {
        // Check if user is media owner
        const media = await this.mediaRepository.findById(data.mediaId);
        
        if (!media || media.userId !== userId) {
          return false;
        }
      }
      
      // Delete the token
      await redis.del(`media:temp-access:${token}`);
      
      return true;
    } catch (error) {
      logger.error('Error revoking temporary access', { error, token, userId });
      return false;
    }
  }
  
  /**
   * Generate a signed URL for a media file
   */
  generateSignedUrl(
    mediaId: string,
    path: string,
    expiresIn: number = 3600
  ): string {
    // Generate expiration timestamp
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    
    // Create signature data
    const signatureData = `${mediaId}:${path}:${expires}`;
    
    // Create HMAC signature
    const signature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
      .update(signatureData)
      .digest('hex');
    
    // Return signed URL parameters
    return `?mediaId=${mediaId}&expires=${expires}&signature=${signature}`;
  }
  
  /**
   * Verify a signed URL
   */
  verifySignedUrl(
    mediaId: string,
    path: string,
    expires: number,
    signature: string
  ): boolean {
    try {
      // Check if URL has expired
      if (expires < Math.floor(Date.now() / 1000)) {
        return false;
      }
      
      // Create signature data
      const signatureData = `${mediaId}:${path}:${expires}`;
      
      // Create expected signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
        .update(signatureData)
        .digest('hex');
      
      // Verify signature
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Error verifying signed URL', { error, mediaId, path });
      return false;
    }
  }
}
