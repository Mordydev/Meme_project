/**
 * Upload Service
 * 
 * Handles file upload functionality including validation and storage
 */
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { 
  UploadOptions, 
  ValidationResult, 
  MediaType,
  MediaStatus
} from '../../../models/media/media';
import { StorageService } from '../storage/storage-service';
import { MediaRepository } from '../../../repositories/media/media-repository';
import { MediaProcessingService } from '../processing/media-processing-service';
import { fileTypeFromBuffer } from 'file-type';
import { logger } from '../../../lib/logger';
import { ValidationError, RequestEntityTooLargeError, BadRequestError } from '../../../errors/api-errors';

/**
 * Allowed mime types by category
 */
const ALLOWED_MIME_TYPES = {
  [MediaType.IMAGE]: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff'
  ],
  [MediaType.VIDEO]: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ],
  [MediaType.AUDIO]: [
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/midi'
  ],
  [MediaType.DOCUMENT]: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/json'
  ]
};

/**
 * Maximum file size by type in bytes
 */
const MAX_FILE_SIZE = {
  [MediaType.IMAGE]: 10 * 1024 * 1024, // 10MB
  [MediaType.VIDEO]: 100 * 1024 * 1024, // 100MB
  [MediaType.AUDIO]: 50 * 1024 * 1024, // 50MB
  [MediaType.DOCUMENT]: 20 * 1024 * 1024, // 20MB
  [MediaType.OTHER]: 5 * 1024 * 1024 // 5MB
};

/**
 * Upload service for handling file uploads
 */
export class UploadService {
  constructor(
    private storageService: StorageService,
    private mediaRepository: MediaRepository,
    private processingService: MediaProcessingService
  ) {}
  
  /**
   * Handle file upload
   */
  async handleUpload(
    file: Buffer,
    options: UploadOptions
  ) {
    try {
      // Step 1: Validate file content
      const validation = await this.validateFile(file, options.filename, options.mimeType);
      
      if (!validation.valid) {
        throw new ValidationError(validation.reason || 'Invalid file');
      }
      
      // Step 2: Determine file type from content
      const detectedType = await fileTypeFromBuffer(file);
      const actualMimeType = detectedType?.mime || options.mimeType;
      
      // Step 3: Determine media type category
      const mediaType = this.determineMediaType(actualMimeType);
      
      // Step 4: Generate secure filename and path
      const filename = this.generateSafeFilename(options.filename);
      const userId = options.userId;
      const folder = options.folder || this.getDefaultFolder(mediaType);
      const uploadPath = `uploads/${folder}/${userId}/${Date.now()}-${filename}`;
      
      // Step 5: Store file in storage
      const storageResult = await this.storageService.storeFile(file, uploadPath, {
        contentType: actualMimeType,
        metadata: {
          userId,
          originalName: options.filename
        },
        acl: options.visibility === 'public' ? 'public-read' : 'private'
      });
      
      // Step 6: Create database record
      const mediaRecord = await this.mediaRepository.createMedia({
        userId,
        originalName: options.filename,
        mimeType: actualMimeType,
        size: file.length,
        type: mediaType,
        path: storageResult.path,
        publicUrl: options.visibility === 'public' ? storageResult.url : undefined,
        status: MediaStatus.UPLOADING
      });
      
      // Step 7: Queue for processing if needed
      if (options.generateVariants && mediaType === MediaType.IMAGE) {
        await this.processingService.queueMediaProcessing(mediaRecord.id);
      } else {
        // If no processing needed, mark as ready
        await this.mediaRepository.updateMedia(mediaRecord.id, {
          status: MediaStatus.READY,
          processingCompletedAt: new Date()
        });
      }
      
      return mediaRecord;
    } catch (error) {
      logger.error('Error handling upload', { error, options });
      throw error;
    }
  }
  
  /**
   * Validate file content (not just extension)
   */
  async validateFile(
    file: Buffer,
    filename: string,
    declaredMimeType: string
  ): Promise<ValidationResult> {
    try {
      // Check if file has content
      if (!file || file.length === 0) {
        return { valid: false, reason: 'Empty file' };
      }
      
      // Check file size
      const mediaType = this.determineMediaType(declaredMimeType);
      const maxSize = MAX_FILE_SIZE[mediaType] || MAX_FILE_SIZE[MediaType.OTHER];
      
      if (file.length > maxSize) {
        return {
          valid: false,
          reason: `File too large. Maximum size for ${mediaType} is ${Math.floor(maxSize / (1024 * 1024))}MB`
        };
      }
      
      // Detect actual mime type from file content
      const detectedType = await fileTypeFromBuffer(file);
      
      // If type can't be detected for non-document files, reject
      if (!detectedType && mediaType !== MediaType.DOCUMENT && mediaType !== MediaType.OTHER) {
        return { valid: false, reason: 'File type could not be determined from content' };
      }
      
      // If type detected, check if it matches declared mime type or is in the same category
      if (detectedType) {
        const detectedMediaType = this.determineMediaType(detectedType.mime);
        
        // If declared type is different from detected category, reject
        if (mediaType !== detectedMediaType) {
          return {
            valid: false,
            reason: `Declared file type (${declaredMimeType}) doesn't match detected file type (${detectedType.mime})`
          };
        }
        
        // If exact mime type mismatch within same category, log but accept
        if (detectedType.mime !== declaredMimeType) {
          logger.warn('Mime type mismatch', {
            declaredMimeType,
            detectedMimeType: detectedType.mime,
            filename
          });
        }
      }
      
      // Check if mime type is allowed
      if (!this.isMimeTypeAllowed(detectedType?.mime || declaredMimeType)) {
        return { valid: false, reason: 'File type not allowed' };
      }
      
      // All checks passed
      return { valid: true };
    } catch (error) {
      logger.error('Error validating file', { error, filename });
      return { valid: false, reason: 'File validation error' };
    }
  }
  
  /**
   * Generate a pre-signed URL for direct upload
   */
  async getUploadUrl(userId: string, fileInfo: {
    filename: string;
    mimeType: string;
    size: number;
    folder?: string;
    visibility?: 'public' | 'private';
  }) {
    try {
      // Validate file type and size
      const mediaType = this.determineMediaType(fileInfo.mimeType);
      const maxSize = MAX_FILE_SIZE[mediaType] || MAX_FILE_SIZE[MediaType.OTHER];
      
      if (fileInfo.size > maxSize) {
        throw new RequestEntityTooLargeError(
          `File too large. Maximum size for ${mediaType} is ${Math.floor(maxSize / (1024 * 1024))}MB`
        );
      }
      
      if (!this.isMimeTypeAllowed(fileInfo.mimeType)) {
        throw new ValidationError(`File type ${fileInfo.mimeType} not allowed`);
      }
      
      // Generate secure path
      const filename = this.generateSafeFilename(fileInfo.filename);
      const folder = fileInfo.folder || this.getDefaultFolder(mediaType);
      const uploadId = uuidv4();
      const uploadPath = `uploads/${folder}/${userId}/${Date.now()}-${uploadId}-${filename}`;
      
      // Generate presigned URL
      const presignedUrl = await this.storageService.generatePresignedUrl(
        'upload',
        uploadPath,
        {
          contentType: fileInfo.mimeType,
          expires: 3600 // 1 hour
        }
      );
      
      // Create media record in "uploading" state
      const mediaRecord = await this.mediaRepository.createMedia({
        userId,
        originalName: fileInfo.filename,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size,
        type: mediaType,
        path: uploadPath,
        publicUrl: fileInfo.visibility === 'public' ? this.storageService.getPublicUrl(uploadPath) : undefined,
        status: MediaStatus.UPLOADING
      });
      
      return {
        mediaId: mediaRecord.id,
        uploadUrl: presignedUrl,
        uploadId,
        expiresIn: 3600
      };
    } catch (error) {
      logger.error('Error generating upload URL', { error, userId, fileInfo });
      throw error;
    }
  }
  
  /**
   * Complete a direct upload initiated with getUploadUrl
   */
  async completeUpload(mediaId: string, generateVariants: boolean = true) {
    try {
      // Get media record
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new ValidationError('Media record not found');
      }
      
      // Check if the file exists in storage
      const fileExists = await this.storageService.fileExists(media.path);
      
      if (!fileExists) {
        throw new BadRequestError('Upload not completed. File not found in storage.');
      }
      
      // Update media record status
      if (generateVariants && media.type === MediaType.IMAGE) {
        // Queue for processing
        await this.mediaRepository.updateMedia(mediaId, {
          status: MediaStatus.PROCESSING
        });
        
        await this.processingService.queueMediaProcessing(mediaId);
      } else {
        // Mark as ready immediately
        await this.mediaRepository.updateMedia(mediaId, {
          status: MediaStatus.READY,
          processingCompletedAt: new Date()
        });
      }
      
      return await this.mediaRepository.findById(mediaId);
    } catch (error) {
      logger.error('Error completing upload', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Cancel an in-progress upload
   */
  async cancelUpload(mediaId: string) {
    try {
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new ValidationError('Media record not found');
      }
      
      // Only cancel if still in uploading or processing state
      if (media.status === MediaStatus.UPLOADING || media.status === MediaStatus.PROCESSING) {
        // Delete file from storage if it exists
        try {
          await this.storageService.deleteFile(media.path);
        } catch (error) {
          logger.warn('Error deleting file during upload cancellation', { error, mediaId });
          // Continue even if deletion fails
        }
        
        // Update media record status
        await this.mediaRepository.updateMedia(mediaId, {
          status: MediaStatus.DELETED
        });
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Error canceling upload', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Determine media type from mime type
   */
  private determineMediaType(mimeType: string): MediaType {
    const mediaType = Object.entries(ALLOWED_MIME_TYPES).find(([_, types]) => 
      types.includes(mimeType)
    )?.[0] as MediaType;
    
    return mediaType || MediaType.OTHER;
  }
  
  /**
   * Check if mime type is allowed
   */
  private isMimeTypeAllowed(mimeType: string): boolean {
    return Object.values(ALLOWED_MIME_TYPES).some(types => 
      types.includes(mimeType)
    );
  }
  
  /**
   * Generate a safe filename to prevent path traversal and other issues
   */
  private generateSafeFilename(originalName: string): string {
    // Get extension
    const ext = path.extname(originalName).toLowerCase();
    
    // Create a base filename from the original name
    // Remove special characters and spaces
    let baseName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 100); // Limit length
      
    // Add a unique hash to prevent filename collisions
    const hash = crypto.createHash('md5')
      .update(originalName + Date.now().toString())
      .digest('hex')
      .substring(0, 8);
      
    return `${baseName}_${hash}${ext}`;
  }
  
  /**
   * Get default folder name for media type
   */
  private getDefaultFolder(mediaType: MediaType): string {
    return mediaType.toLowerCase() + 's';
  }
}
