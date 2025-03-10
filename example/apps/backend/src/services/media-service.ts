import { FastifyInstance } from 'fastify';
import { createHash } from 'crypto';
import { ValidationError, AppError } from '../lib/errors';
import { Storage } from '@google-cloud/storage';

/**
 * Upload URL result interface
 */
export interface UploadUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  metadata: Record<string, string>;
}

/**
 * Service for managing media files
 */
export class MediaService {
  // Allowed file types map
  private readonly allowedTypes: { [key: string]: string[] } = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/wav'],
    document: ['application/pdf']
  };
  
  // Size limits in bytes
  private readonly sizeLimits: { [key: string]: number } = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024, // 50MB
    document: 25 * 1024 * 1024 // 25MB
  };
  
  // Storage client
  private storage: Storage;
  
  constructor(private fastify: FastifyInstance) {
    // Initialize storage client if credentials are available
    if (fastify.config.storage?.credentials) {
      this.storage = new Storage({
        credentials: JSON.parse(fastify.config.storage.credentials),
        projectId: fastify.config.storage.projectId
      });
    }
  }

  /**
   * Generate a secure, random filename
   */
  private generateSecureFileName(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const hash = createHash('sha256')
      .update(`${timestamp}${randomString}`)
      .digest('hex')
      .substring(0, 16);
    
    return `${timestamp}-${hash}`;
  }

  /**
   * Get max file size for type
   */
  private getMaxSizeForType(type: string): number {
    return this.sizeLimits[type] || 5 * 1024 * 1024; // Default 5MB
  }

  /**
   * Validate content type
   */
  private validateContentType(fileType: string, contentType: string): boolean {
    const allowedContentTypes = this.allowedTypes[fileType];
    
    if (!allowedContentTypes) {
      return false;
    }
    
    return allowedContentTypes.includes(contentType);
  }

  /**
   * Generate a signed URL for uploading media
   */
  async generateUploadUrl(
    userId: string,
    fileType: string,
    contentType: string,
    options: {
      isPublic?: boolean;
      maxSizeOverride?: number;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<UploadUrlResult> {
    // Validate file type
    if (!this.allowedTypes[fileType]) {
      throw new ValidationError(`Unsupported file type: ${fileType}`);
    }
    
    // Validate content type
    if (!this.validateContentType(fileType, contentType)) {
      throw new ValidationError(`Unsupported content type: ${contentType} for file type: ${fileType}`);
    }
    
    // Generate secure path with user isolation
    const fileName = this.generateSecureFileName();
    const fileExtension = contentType.split('/')[1] || 'bin';
    const path = `users/${userId}/${fileType}s/${fileName}.${fileExtension}`;
    
    // Add security and metadata headers
    const metadata = {
      'x-content-owner': userId,
      'x-upload-timestamp': Date.now().toString(),
      'x-content-type': contentType,
      ...options.metadata
    };
    
    // Set cache control based on public/private
    if (options.isPublic) {
      metadata['Cache-Control'] = 'public, max-age=31536000'; // 1 year for public files
    } else {
      metadata['Cache-Control'] = 'private, max-age=3600'; // 1 hour for private files
    }
    
    // Get max size (use override if provided)
    const maxSize = options.maxSizeOverride || this.getMaxSizeForType(fileType);
    
    try {
      // Generate signed URL
      const [url] = await this.storage
        .bucket(this.fastify.config.storage.bucket)
        .file(path)
        .getSignedUrl({
          version: 'v4',
          action: 'write',
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
          contentType,
          extensionHeaders: metadata,
          conditions: [
            ['content-length-range', 0, maxSize]
          ]
        });
      
      // Build public URL
      const fileUrl = `${this.fastify.config.storage.cdnUrl}/${path}`;
      
      return {
        uploadUrl: url,
        fileUrl,
        key: path,
        metadata
      };
    } catch (error) {
      this.fastify.log.error(error, 'Error generating upload URL');
      throw AppError.internal('Failed to generate upload URL');
    }
  }

  /**
   * Validate uploaded file
   * This is called after the file has been uploaded
   */
  async validateUploadedFile(
    key: string,
    expectedContentType: string,
    expectedOwner: string
  ): Promise<boolean> {
    try {
      const [metadata] = await this.storage
        .bucket(this.fastify.config.storage.bucket)
        .file(key)
        .getMetadata();
      
      // Verify owner
      if (metadata.metadata['x-content-owner'] !== expectedOwner) {
        this.fastify.log.warn({
          key,
          expectedOwner,
          actualOwner: metadata.metadata['x-content-owner']
        }, 'File owner mismatch');
        return false;
      }
      
      // Verify content type
      if (metadata.contentType !== expectedContentType) {
        this.fastify.log.warn({
          key,
          expectedContentType,
          actualContentType: metadata.contentType
        }, 'File content type mismatch');
        return false;
      }
      
      return true;
    } catch (error) {
      this.fastify.log.error(error, 'Error validating uploaded file');
      return false;
    }
  }

  /**
   * Generate a signed URL for retrieving private media
   */
  async generateDownloadUrl(
    key: string,
    expirationSeconds = 3600 // 1 hour
  ): Promise<string> {
    try {
      const [url] = await this.storage
        .bucket(this.fastify.config.storage.bucket)
        .file(key)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + expirationSeconds * 1000
        });
      
      return url;
    } catch (error) {
      this.fastify.log.error(error, 'Error generating download URL');
      throw AppError.internal('Failed to generate download URL');
    }
  }

  /**
   * Delete media file
   */
  async deleteFile(key: string, ownerUserId: string): Promise<void> {
    try {
      // Verify owner before deleting
      const [metadata] = await this.storage
        .bucket(this.fastify.config.storage.bucket)
        .file(key)
        .getMetadata();
      
      if (metadata.metadata['x-content-owner'] !== ownerUserId) {
        throw AppError.forbidden('You do not have permission to delete this file');
      }
      
      await this.storage
        .bucket(this.fastify.config.storage.bucket)
        .file(key)
        .delete();
    } catch (error) {
      this.fastify.log.error(error, 'Error deleting file');
      throw AppError.internal('Failed to delete file');
    }
  }

  /**
   * Validate a file URL
   * Ensures the URL points to our storage bucket
   */
  validateFileUrl(url: string): boolean {
    // URL must start with our CDN URL
    return url.startsWith(this.fastify.config.storage.cdnUrl);
  }

  /**
   * Extract key from file URL
   */
  extractKeyFromUrl(url: string): string | null {
    if (!this.validateFileUrl(url)) {
      return null;
    }
    
    return url.replace(this.fastify.config.storage.cdnUrl + '/', '');
  }
}
