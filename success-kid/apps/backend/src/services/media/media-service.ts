import { PutBlobResult } from '@vercel/blob';
import { nanoid } from 'nanoid'; // Import nanoid
import { MediaRepository, mediaRepository } from '../../repositories/media-repository';
import { BlobProvider, blobProvider } from './storage/blob-provider';
import { AppError, ErrorCode } from '../../lib/errors'; // Corrected path and filename
import { logger } from '../../lib/logger';
import { Media, NewMedia } from '../../database/schema/media'; // Assuming Media and NewMedia types are exported from schema/index or media.ts

// Define allowed MIME types and max size
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Interface for file data coming from the handler
export interface FileData {
  buffer: Buffer;
  mimetype: string;
  filename: string;
  size: number; // Size in bytes
}

export class MediaService {
  constructor(
    private blobProvider: BlobProvider,
    private mediaRepository: MediaRepository
  ) {}

  async uploadMedia(fileData: FileData, userId: string): Promise<Media> {
    logger.info({ userId, filename: fileData.filename, size: fileData.size, mimetype: fileData.mimetype }, 'Starting media upload process');

    // 1. Validate file
    this.validateFile(fileData);
    logger.debug('File validation passed');

    // 2. Upload to Blob Storage
    let blobResult: PutBlobResult;
    try {
      blobResult = await this.blobProvider.upload(
        fileData.buffer,
        fileData.mimetype,
        fileData.filename
      );
    } catch (uploadError: any) { // Added type annotation
      logger.error({ userId, error: uploadError }, 'Blob upload failed during service call');
      // Corrected AppError usage: message, code, statusCode
      throw new AppError('Failed to upload media file.', ErrorCode.SERVER_ERROR, 500);
    }

    // 3. Save metadata to Database
    try {
      // Prepare data matching the NewMedia type expected by the repository
      const newMediaData: NewMedia = {
        id: nanoid(), // Generate unique ID
        userId: userId,
        blobUrl: blobResult.url, // Corrected field name
        blobPath: blobResult.pathname, // Corrected field name
        mimeType: blobResult.contentType, // Corrected field name based on schema
        size: fileData.size, // Use size from the original file data
        originalName: fileData.filename, // Corrected field name based on schema
        // Add default values for any other non-nullable fields if necessary
        // status: 'active', // Default is set in schema
        // metadata: {}, // Default is set in schema
      };

      const mediaRecord = await this.mediaRepository.create(newMediaData);
      logger.info({ userId, mediaId: mediaRecord.id, blobUrl: mediaRecord.blobUrl }, 'Media metadata saved to database'); // Corrected log field
      return mediaRecord;
    } catch (dbError) {
      logger.error({ userId, blobUrl: blobResult.url, error: dbError }, 'Failed to save media metadata to database'); // Corrected log field
      // TODO: Consider attempting to delete the uploaded blob if DB save fails (cleanup)
      // await this.blobProvider.delete(blobResult.url); // Use URL for deletion as per @vercel/blob docs
      // Corrected AppError usage: message, code, statusCode
      throw new AppError('Failed to save media information.', ErrorCode.SERVER_ERROR, 500);
    }
  }

  private validateFile(fileData: FileData): void {
    if (!ALLOWED_MIME_TYPES.includes(fileData.mimetype)) {
      logger.warn({ mimetype: fileData.mimetype }, 'Invalid file type attempted upload');
      // Corrected AppError usage: message, code, statusCode
      // Using ValidationError subclass might be cleaner: new ValidationError(...)
      throw new AppError(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        ErrorCode.VALIDATION_ERROR, // Corrected Enum member
        400 // Bad Request status code for validation
      );
    }

    if (fileData.size > MAX_FILE_SIZE_BYTES) {
      logger.warn({ size: fileData.size, maxSize: MAX_FILE_SIZE_BYTES }, 'File size exceeds limit');
      // Corrected AppError usage: message, code, statusCode
      // Using ValidationError subclass might be cleaner: new ValidationError(...)
      throw new AppError(
        `File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`,
        ErrorCode.VALIDATION_ERROR, // Corrected Enum member
        400 // Bad Request status code for validation
      );
    }
  }

  /**
   * Get media by ID
   * @param id Media ID
   * @returns Media or null if not found
   */
  async getMediaById(id: string): Promise<Media | null> {
    // Assuming findById exists and returns Media | null
    const media = await this.mediaRepository.findById(id);
    return media ?? null; // Ensure null is returned if undefined/falsy
  }

  /**
   * Get media by URL
   * @param url Media URL
   * @returns Media or null if not found
   */
  async getMediaByUrl(url: string): Promise<Media | null> {
    try {
      // Find media by its blob URL using findMany with limit 1
      const media = await this.mediaRepository.findMany({
        filter: { blobUrl: url },
        limit: 1
      });
      
      return media.length > 0 ? media[0] : null;
    } catch (error) {
      logger.error(`Error retrieving media by URL: ${error}`);
      return null;
    }
  }
}

// Instantiate the service with dependencies
export const mediaService = new MediaService(blobProvider, mediaRepository);
