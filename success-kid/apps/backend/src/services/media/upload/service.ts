/**
 * Media Upload Service
 * 
 * Handles secure file uploads, validation, and storage.
 */
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { validateFile, generateSafeFilename } from './validators';
import { 
  CreateMediaFileDto, 
  MediaFile,
  UpdateMediaFileDto,
  UploadOptions,
  ValidationResult
} from '../../../models/entities/media';
import { logger } from '../../../lib/logger';
import crypto from 'crypto';

// Forward declaration of repository - will be implemented separately
// This is to avoid circular dependencies
import { mediaRepository } from '../../../repositories/media-repository';

/**
 * Presigned URL info for clients
 */
export interface PresignedUrl {
  url: string;
  expires: number; // Expiration in seconds from now
  fields?: Record<string, string>; // For form uploads (S3)
}

/**
 * Upload status for multi-part uploads
 */
export interface UploadStatus {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress: number;
  message?: string;
}

/**
 * Media Upload Service
 */
export class MediaUploadService {
  /**
   * Validate a file before upload
   * @param file File buffer
   * @param filename Original filename
   * @param mimeType MIME type
   * @returns Validation result
   */
  async validateFile(
    file: Buffer, 
    filename: string, 
    mimeType: string
  ): Promise<ValidationResult> {
    return validateFile(file, filename, mimeType);
  }
  
  /**
   * Handle a single file upload
   * @param file File buffer
   * @param options Upload options
   * @returns Created media file
   */
  async handleUpload(
    file: Buffer,
    options: UploadOptions
  ): Promise<MediaFile> {
    try {
      // Validate file content
      const validation = await this.validateFile(file, options.filename, options.mimeType);
      if (!validation.valid) {
        logger.warn('File validation failed', {
          filename: options.filename,
          mimeType: options.mimeType,
          reason: validation.reason
        });
        throw new Error(validation.reason || 'File validation failed');
      }
      
      // Generate safe filename and construct path
      const safeFilename = generateSafeFilename(options.filename);
      const userId = options.userId;
      const folder = options.folder || 'uploads';
      const datePath = new Date().toISOString().split('T')[0].replace(/-/g, '/');
      const path = `${folder}/${userId}/${datePath}/${safeFilename}`;
      
      // Store file in storage provider
      const result = await storage.storeFile(file, path, {
        contentType: options.mimeType,
        metadata: {
          userId,
          originalName: options.filename,
          ...options.metadata
        },
        public: options.public
      });
      
      // Create database record
      const mediaFile: CreateMediaFileDto = {
        user_id: userId,
        original_name: options.filename,
        path: result.path,
        mimeType: options.mimeType,
        size: file.length,
        status: 'processing',
        metadata: options.metadata || {}
      };
      
      // Save to database
      const createdMedia = await mediaRepository.create(mediaFile);
      
      // Queue for processing (to create variants, extract metadata, etc.)
      // This will be implemented in the processing service
      // processingQueue.add('process-media', { mediaId: createdMedia.id });
      
      return createdMedia;
    } catch (error) {
      logger.error('File upload failed', {
        filename: options.filename,
        userId: options.userId,
        error
      });
      throw error;
    }
  }
  
  /**
   * Get a presigned URL for direct upload
   * @param userId User ID
   * @param fileInfo File information
   * @returns Presigned URL information
   */
  async getUploadUrl(
    userId: string,
    fileInfo: { filename: string; mimeType: string; size: number }
  ): Promise<PresignedUrl> {
    try {
      // Generate safe filename and path
      const safeFilename = generateSafeFilename(fileInfo.filename);
      const folder = 'uploads';
      const datePath = new Date().toISOString().split('T')[0].replace(/-/g, '/');
      const path = `${folder}/${userId}/${datePath}/${safeFilename}`;
      
      // Generate upload ID for tracking
      const uploadId = uuidv4();
      
      // Generate presigned URL
      const url = await storage.generatePresignedUrl('upload', path, {
        contentType: fileInfo.mimeType,
        expires: 30 * 60, // 30 minutes
        maxSize: 50 * 1024 * 1024, // 50MB max
        metadata: {
          userId,
          uploadId,
          originalName: fileInfo.filename
        }
      });
      
      // Store pending upload information
      // This will be used to track and confirm uploads
      await this.storePendingUpload(uploadId, {
        userId,
        path,
        filename: fileInfo.filename,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size
      });
      
      return {
        url,
        expires: 30 * 60, // 30 minutes
        fields: {} // S3 form fields would go here if needed
      };
    } catch (error) {
      logger.error('Failed to generate upload URL', {
        userId,
        filename: fileInfo.filename,
        error
      });
      throw error;
    }
  }
  
  /**
   * Complete a chunked or direct upload
   * This is called after the client has uploaded the file directly
   * @param uploadId Upload ID
   * @returns Created media file
   */
  async completeUpload(uploadId: string): Promise<MediaFile> {
    try {
      // Get pending upload info
      const uploadInfo = await this.getPendingUpload(uploadId);
      if (!uploadInfo) {
        throw new Error('Upload not found or expired');
      }
      
      // Check if file exists in storage
      const exists = await storage.fileExists(uploadInfo.path);
      if (!exists) {
        throw new Error('Uploaded file not found in storage');
      }
      
      // Create database record
      const mediaFile: CreateMediaFileDto = {
        user_id: uploadInfo.userId,
        original_name: uploadInfo.filename,
        path: uploadInfo.path,
        mimeType: uploadInfo.mimeType,
        size: uploadInfo.size,
        status: 'processing',
        metadata: {}
      };
      
      // Save to database
      const createdMedia = await mediaRepository.create(mediaFile);
      
      // Queue for processing
      // processingQueue.add('process-media', { mediaId: createdMedia.id });
      
      // Clear pending upload
      await this.clearPendingUpload(uploadId);
      
      return createdMedia;
    } catch (error) {
      logger.error('Failed to complete upload', { uploadId, error });
      throw error;
    }
  }
  
  /**
   * Get upload status
   * @param uploadId Upload ID
   * @returns Upload status
   */
  async getUploadStatus(uploadId: string): Promise<UploadStatus> {
    try {
      // Check pending uploads
      const pendingUpload = await this.getPendingUpload(uploadId);
      if (pendingUpload) {
        return {
          id: uploadId,
          status: 'pending',
          progress: 0,
          message: 'Upload pending'
        };
      }
      
      // Check processing uploads
      // This would check a queue or database for processing status
      // For now, just return a default status
      return {
        id: uploadId,
        status: 'processing',
        progress: 50,
        message: 'Upload processing'
      };
    } catch (error) {
      logger.error('Failed to get upload status', { uploadId, error });
      throw error;
    }
  }
  
  /**
   * Cancel an upload
   * @param uploadId Upload ID
   * @returns Success indication
   */
  async cancelUpload(uploadId: string): Promise<boolean> {
    try {
      // Get pending upload info
      const uploadInfo = await this.getPendingUpload(uploadId);
      if (!uploadInfo) {
        return false;
      }
      
      // Clear pending upload
      await this.clearPendingUpload(uploadId);
      
      // Try to delete from storage if already uploaded
      try {
        if (await storage.fileExists(uploadInfo.path)) {
          await storage.deleteFile(uploadInfo.path);
        }
      } catch (storageError) {
        logger.warn('Failed to delete file during upload cancellation', {
          uploadId,
          path: uploadInfo.path,
          error: storageError
        });
        // Continue with cancellation even if deletion fails
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to cancel upload', { uploadId, error });
      throw error;
    }
  }
  
  /**
   * Delete a media file
   * @param mediaId Media ID
   * @returns Success indication
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      // Get media file
      const media = await mediaRepository.findById(mediaId);
      if (!media) {
        return false;
      }
      
      // Delete main file from storage
      await storage.deleteFile(media.path);
      
      // Delete all variants if they exist
      if (media.variants) {
        await Promise.all(
          Object.values(media.variants).map(variant => 
            storage.deleteFile(variant.path)
          )
        );
      }
      
      // Mark as deleted in database
      await mediaRepository.update(mediaId, {
        status: 'deleted',
        deleted_at: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete media', { mediaId, error });
      throw error;
    }
  }
  
  // ----- Private methods for managing pending uploads -----
  
  /**
   * Store pending upload information (temporary storage)
   * Note: In a full implementation, this would use Redis or similar
   * @param uploadId Upload ID
   * @param info Upload information
   */
  private async storePendingUpload(
    uploadId: string,
    info: {
      userId: string;
      path: string;
      filename: string;
      mimeType: string;
      size: number;
    }
  ): Promise<void> {
    // This would use Redis or similar in production
    // For now, just log it
    logger.info('Storing pending upload', { uploadId, info });
    
    // Simulate storage
    pendingUploads[uploadId] = {
      ...info,
      expires: Date.now() + 30 * 60 * 1000 // 30 minutes
    };
  }
  
  /**
   * Get pending upload information
   * @param uploadId Upload ID
   * @returns Upload information or null if not found/expired
   */
  private async getPendingUpload(uploadId: string): Promise<{
    userId: string;
    path: string;
    filename: string;
    mimeType: string;
    size: number;
    expires: number;
  } | null> {
    // This would use Redis or similar in production
    const info = pendingUploads[uploadId];
    
    if (!info) {
      return null;
    }
    
    // Check expiration
    if (info.expires < Date.now()) {
      delete pendingUploads[uploadId];
      return null;
    }
    
    return info;
  }
  
  /**
   * Clear pending upload information
   * @param uploadId Upload ID
   */
  private async clearPendingUpload(uploadId: string): Promise<void> {
    // This would use Redis or similar in production
    delete pendingUploads[uploadId];
  }
}

// Temporary in-memory storage for pending uploads
// This would be replaced with Redis or similar in production
const pendingUploads: Record<string, {
  userId: string;
  path: string;
  filename: string;
  mimeType: string;
  size: number;
  expires: number;
}> = {};

// Create and export service instance
export const uploadService = new MediaUploadService();
