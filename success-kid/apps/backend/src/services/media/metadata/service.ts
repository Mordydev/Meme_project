/**
 * Media Metadata Service
 * 
 * Handles extraction, storage, and management of media file metadata.
 */
import sharp from 'sharp';
import { storage } from '../storage';
import { mediaRepository } from '../../../repositories/media-repository';
import { MediaFile, MediaMetadata } from '../../../models/entities/media';
import { logger } from '../../../lib/logger';

/**
 * Media Metadata Service
 */
export class MetadataService {
  /**
   * Extract metadata from a media file
   * @param mediaId Media file ID
   * @returns Extracted metadata
   */
  async extractMetadata(mediaId: string): Promise<MediaMetadata> {
    try {
      // Get media file
      const mediaFile = await mediaRepository.findById(mediaId);
      if (!mediaFile) {
        throw new Error(`Media file with ID ${mediaId} not found`);
      }
      
      // Get file from storage
      const fileBuffer = await storage.getFile(mediaFile.path);
      
      // Extract metadata based on file type
      let metadata: MediaMetadata = {};
      
      if (mediaFile.mimeType.startsWith('image/')) {
        metadata = await this.extractImageMetadata(fileBuffer);
      } else {
        // Default minimal metadata
        metadata = {
          format: mediaFile.mimeType.split('/')[1]
        };
      }
      
      // Update media file with metadata
      await mediaRepository.update(mediaId, {
        metadata: {
          ...mediaFile.metadata,
          ...metadata
        }
      });
      
      return metadata;
    } catch (error) {
      logger.error(`Error extracting metadata for ${mediaId}`, { error });
      throw error;
    }
  }
  
  /**
   * Extract metadata from image file
   * @param buffer Image buffer
   * @returns Extracted metadata
   */
  async extractImageMetadata(buffer: Buffer): Promise<MediaMetadata> {
    try {
      // Get basic metadata from Sharp
      const sharpMetadata = await sharp(buffer).metadata();
      
      // Build metadata object
      const metadata: MediaMetadata = {
        dimensions: {
          width: sharpMetadata.width || 0,
          height: sharpMetadata.height || 0
        },
        format: sharpMetadata.format,
        colorSpace: sharpMetadata.space,
        orientation: sharpMetadata.orientation,
        hasAlpha: sharpMetadata.hasAlpha
      };
      
      // Extract and sanitize EXIF data if available
      if (sharpMetadata.exif) {
        try {
          const exifData = await this.extractExifData(sharpMetadata.exif);
          return {
            ...metadata,
            ...this.sanitizeExifData(exifData)
          };
        } catch (exifError) {
          logger.warn('Error extracting EXIF data', { error: exifError });
        }
      }
      
      return metadata;
    } catch (error) {
      logger.error('Error extracting image metadata', { error });
      return {};
    }
  }
  
  /**
   * Extract EXIF data from buffer
   * @param exifBuffer EXIF data buffer
   * @returns Extracted EXIF data
   */
  private async extractExifData(exifBuffer: Buffer): Promise<Record<string, any>> {
    // In a real implementation, we would use a library like exif-parser
    // For now, let's just return a placeholder
    return {
      createdAt: new Date(),
      author: 'Unknown',
      copyright: 'Unknown',
      location: {
        latitude: null,
        longitude: null,
        altitude: null
      }
    };
  }
  
  /**
   * Sanitize EXIF data to remove PII and sensitive information
   * @param exifData EXIF data object
   * @returns Sanitized EXIF data
   */
  private sanitizeExifData(exifData: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = { ...exifData };
    
    // Remove GPS data if not explicitly requested to keep it
    if (sanitized.location) {
      delete sanitized.location;
    }
    
    // Remove device information
    if (sanitized.make) delete sanitized.make;
    if (sanitized.model) delete sanitized.model;
    if (sanitized.software) delete sanitized.software;
    
    // Remove serial numbers and device IDs
    if (sanitized.serialNumber) delete sanitized.serialNumber;
    if (sanitized.deviceId) delete sanitized.deviceId;
    if (sanitized.cameraSerialNumber) delete sanitized.cameraSerialNumber;
    
    // Keep creation date and some artistic metadata
    // (copyright, author if available)
    
    return sanitized;
  }
  
  /**
   * Update metadata for a media file
   * @param mediaId Media file ID
   * @param metadata Metadata to update
   * @returns Updated media file
   */
  async updateMetadata(
    mediaId: string,
    metadata: Partial<MediaMetadata>
  ): Promise<MediaFile> {
    try {
      // Get media file
      const mediaFile = await mediaRepository.findById(mediaId);
      if (!mediaFile) {
        throw new Error(`Media file with ID ${mediaId} not found`);
      }
      
      // Update metadata
      const updatedMedia = await mediaRepository.update(mediaId, {
        metadata: {
          ...mediaFile.metadata,
          ...metadata
        }
      });
      
      return updatedMedia;
    } catch (error) {
      logger.error(`Error updating metadata for ${mediaId}`, { error });
      throw error;
    }
  }
  
  /**
   * Search media files by metadata
   * @param query Metadata search query
   * @returns Array of matching media files
   */
  async searchByMetadata(
    query: Record<string, any>,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<MediaFile[]> {
    try {
      // This would typically be a database query with proper indexing
      // For now, just log that it was called and return an empty array
      logger.info('Search by metadata called', { query, options });
      
      // In a real implementation, we would query the database here
      return [];
    } catch (error) {
      logger.error('Error searching by metadata', { error, query });
      throw error;
    }
  }
}

// Create and export service instance
export const metadataService = new MetadataService();
