/**
 * Media Processing Service
 * 
 * Handles media processing operations including image resizing, format conversion,
 * metadata extraction, and variant generation.
 */
import sharp from 'sharp';
import path from 'path';
import { Queue } from 'bull';
import { 
  MediaRepository, 
} from '../../../repositories/media/media-repository';
import {
  Media,
  MediaVariant,
  MediaStatus,
  MediaType,
  MediaMetadata,
  Dimensions,
  ImageProcessingOptions,
  ResizeOptions,
} from '../../../models/media/media';
import { StorageService } from '../storage/storage-service';
import { logger } from '../../../lib/logger';
import { NotFoundError, ValidationError } from '../../../errors/api-errors';

/**
 * Image variant definitions
 */
const IMAGE_VARIANTS = {
  thumbnail: { width: 150, height: 150, fit: 'cover', format: 'webp', quality: 80 },
  small: { width: 300, height: 300, fit: 'inside', format: 'webp', quality: 80 },
  medium: { width: 800, height: 800, fit: 'inside', format: 'webp', quality: 85 },
  large: { width: 1200, height: 1200, fit: 'inside', format: 'webp', quality: 90 }
};

/**
 * Media Processing Service
 */
export class MediaProcessingService {
  private processingQueue: Queue;
  
  constructor(
    private mediaRepository: MediaRepository,
    private storageService: StorageService,
    queueOptions: any = {}
  ) {
    // Create a processing queue
    this.processingQueue = new Queue('media-processing', queueOptions);
    
    // Process jobs
    this.processingQueue.process('processMedia', this.processMediaJob.bind(this));
    this.processingQueue.process('createVariants', this.createVariantsJob.bind(this));
    this.processingQueue.process('extractMetadata', this.extractMetadataJob.bind(this));
    
    // Handle failed jobs
    this.processingQueue.on('failed', (job, err) => {
      logger.error('Media processing job failed', {
        jobId: job.id,
        jobName: job.name,
        mediaId: job.data.mediaId,
        error: err
      });
    });
  }
  
  /**
   * Queue media for processing
   */
  async queueMediaProcessing(mediaId: string) {
    try {
      // Update status to processing
      await this.mediaRepository.updateMedia(mediaId, {
        status: MediaStatus.PROCESSING
      });
      
      // Add to processing queue
      await this.processingQueue.add('processMedia', { mediaId }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true
      });
      
      return { queued: true, mediaId };
    } catch (error) {
      logger.error('Error queueing media for processing', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Process an image and create variants
   */
  async processImage(mediaId: string, options?: ImageProcessingOptions) {
    try {
      // Get media
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Only process images
      if (media.type !== MediaType.IMAGE) {
        throw new ValidationError('Media is not an image');
      }
      
      // Extract metadata
      await this.processMediaJob({ data: { mediaId } } as any);
      
      return await this.mediaRepository.findById(mediaId);
    } catch (error) {
      logger.error('Error processing image', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Create variants for an image
   */
  async createVariants(mediaId: string) {
    try {
      await this.createVariantsJob({ data: { mediaId } } as any);
      return await this.mediaRepository.findById(mediaId);
    } catch (error) {
      logger.error('Error creating variants', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Apply a watermark to an image
   */
  async applyWatermark(
    mediaId: string,
    options: { text?: string; position?: string; opacity?: number }
  ) {
    try {
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      if (media.type !== MediaType.IMAGE) {
        throw new ValidationError('Media is not an image');
      }
      
      // Get image
      const fileBuffer = await this.storageService.getFile(media.path);
      
      // Apply watermark
      const image = sharp(fileBuffer);
      
      // Get image metadata
      const metadata = await image.metadata();
      
      // Create text overlay
      const watermarkText = options.text || 'Success Kid';
      const position = options.position || 'bottom-right';
      const opacity = options.opacity !== undefined ? options.opacity : 0.5;
      
      // Create a new image with watermark text
      const svgBuffer = Buffer.from(`
        <svg width="${metadata.width}" height="${metadata.height}">
          <text
            x="${this.getTextPosition(position, 'x', metadata.width || 0)}"
            y="${this.getTextPosition(position, 'y', metadata.height || 0)}"
            font-family="Arial"
            font-size="24"
            fill="rgba(255, 255, 255, ${opacity})"
            text-anchor="${this.getTextAnchor(position)}"
          >${watermarkText}</text>
        </svg>
      `);
      
      // Composite the watermark onto the image
      const watermarkedBuffer = await image.composite([
        { input: svgBuffer, top: 0, left: 0 }
      ]).toBuffer();
      
      // Save watermarked image
      const ext = path.extname(media.path);
      const watermarkedPath = media.path.replace(ext, `-watermarked${ext}`);
      
      await this.storageService.storeFile(watermarkedBuffer, watermarkedPath, {
        contentType: media.mimeType
      });
      
      // Add as a variant
      await this.mediaRepository.addVariant(media.id, 'watermarked', {
        name: 'watermarked',
        path: watermarkedPath,
        mimeType: media.mimeType,
        size: watermarkedBuffer.length,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0
        }
      });
      
      return await this.mediaRepository.findById(mediaId);
    } catch (error) {
      logger.error('Error applying watermark', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Process media job handler
   */
  private async processMediaJob(job: any) {
    const { mediaId } = job.data;
    
    try {
      logger.info('Processing media', { mediaId });
      
      // Update status to processing if not already
      await this.mediaRepository.updateMedia(mediaId, {
        status: MediaStatus.PROCESSING
      });
      
      // Get media
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Process based on media type
      if (media.type === MediaType.IMAGE) {
        // For images, extract metadata and create variants
        await this.processingQueue.add('extractMetadata', { mediaId }, { attempts: 3 });
        await this.processingQueue.add('createVariants', { mediaId }, { attempts: 3 });
      } else {
        // For other media types, just extract metadata
        await this.processingQueue.add('extractMetadata', { mediaId }, { attempts: 3 });
      }
      
      // Update media status to ready
      await this.mediaRepository.updateMedia(mediaId, {
        status: MediaStatus.READY,
        processingCompletedAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      // Update status to failed
      await this.mediaRepository.updateMedia(mediaId, {
        status: MediaStatus.FAILED
      });
      
      logger.error('Error in media processing job', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Extract metadata job handler
   */
  private async extractMetadataJob(job: any) {
    const { mediaId } = job.data;
    
    try {
      logger.info('Extracting metadata', { mediaId });
      
      // Get media
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Get file from storage
      const fileBuffer = await this.storageService.getFile(media.path);
      
      // Extract metadata based on media type
      let metadata: MediaMetadata | undefined;
      
      if (media.type === MediaType.IMAGE) {
        metadata = await this.extractImageMetadata(fileBuffer);
      } else if (media.type === MediaType.VIDEO) {
        // Video metadata extraction would go here
        // Placeholder for now
        metadata = { format: 'video' };
      } else {
        // Generic metadata
        metadata = {
          format: media.mimeType
        };
      }
      
      // Update media with metadata
      await this.mediaRepository.updateMedia(mediaId, { metadata });
      
      return { success: true };
    } catch (error) {
      logger.error('Error extracting metadata', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Create variants job handler
   */
  private async createVariantsJob(job: any) {
    const { mediaId } = job.data;
    
    try {
      logger.info('Creating image variants', { mediaId });
      
      // Get media
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      if (media.type !== MediaType.IMAGE) {
        throw new ValidationError('Media is not an image');
      }
      
      // Get file from storage
      const fileBuffer = await this.storageService.getFile(media.path);
      
      // Create variants
      const variants: Record<string, MediaVariant> = {};
      
      for (const [variantName, options] of Object.entries(IMAGE_VARIANTS)) {
        try {
          const variant = await this.createImageVariant(
            media,
            fileBuffer,
            variantName,
            options
          );
          
          variants[variantName] = variant;
        } catch (error) {
          logger.error('Error creating variant', {
            error,
            mediaId,
            variantName
          });
          // Continue with other variants even if one fails
        }
      }
      
      // Update media with variants
      await this.mediaRepository.updateMedia(mediaId, { variants });
      
      return { success: true, variantCount: Object.keys(variants).length };
    } catch (error) {
      logger.error('Error creating variants', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Extract metadata from an image
   */
  private async extractImageMetadata(fileBuffer: Buffer): Promise<MediaMetadata> {
    try {
      // Use sharp to extract metadata
      const metadata = await sharp(fileBuffer).metadata();
      
      // Build metadata object
      const result: MediaMetadata = {
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0
        },
        format: metadata.format,
        colorSpace: metadata.space,
        orientation: metadata.orientation
      };
      
      // Extract EXIF data if available
      if (metadata.exif) {
        try {
          // This would be a more comprehensive EXIF parser in a real implementation
          // For now, we'll just extract some basic info
          const exif = this.parseExif(metadata.exif);
          
          // Apply sanitization to remove sensitive data
          const sanitizedExif = this.sanitizeExifData(exif);
          
          // Add to metadata
          Object.assign(result, sanitizedExif);
        } catch (error) {
          logger.warn('Error parsing EXIF data', { error });
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error extracting image metadata', { error });
      throw error;
    }
  }
  
  /**
   * Create an image variant
   */
  private async createImageVariant(
    media: Media,
    fileBuffer: Buffer,
    variantName: string,
    options: any
  ): Promise<MediaVariant> {
    try {
      // Create transformer with sharp
      let transformer = sharp(fileBuffer);
      
      // Apply resize
      if (options.width || options.height) {
        transformer = transformer.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'cover',
          position: options.position || 'centre'
        });
      }
      
      // Apply format conversion
      if (options.format) {
        transformer = transformer.toFormat(options.format, {
          quality: options.quality || 80
        });
      }
      
      // Get resulting buffer
      const resultBuffer = await transformer.toBuffer({ resolveWithMetadata: true });
      
      // Generate variant path
      const originalExt = path.extname(media.path);
      const newExt = options.format ? `.${options.format}` : originalExt;
      const variantPath = media.path.replace(originalExt, `-${variantName}${newExt}`);
      
      // Determine mime type
      let mimeType = media.mimeType;
      if (options.format) {
        mimeType = `image/${options.format}`;
      }
      
      // Store variant
      await this.storageService.storeFile(resultBuffer.data, variantPath, {
        contentType: mimeType
      });
      
      // Return variant info
      return {
        name: variantName,
        path: variantPath,
        mimeType,
        size: resultBuffer.data.length,
        dimensions: {
          width: resultBuffer.info.width,
          height: resultBuffer.info.height
        },
        quality: options.quality,
        format: options.format
      };
    } catch (error) {
      logger.error('Error creating image variant', { error, mediaId: media.id, variantName });
      throw error;
    }
  }
  
  /**
   * Transform an image with the given options
   */
  async transformImage(
    mediaId: string,
    options: {
      resize?: ResizeOptions;
      format?: string;
      quality?: number;
    }
  ) {
    try {
      // Get media
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      if (media.type !== MediaType.IMAGE) {
        throw new ValidationError('Media is not an image');
      }
      
      // Get file from storage
      const fileBuffer = await this.storageService.getFile(media.path);
      
      // Apply transformations
      let transformer = sharp(fileBuffer);
      
      // Apply resize
      if (options.resize) {
        transformer = transformer.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: options.resize.fit || 'cover',
          position: options.resize.position || 'centre'
        });
      }
      
      // Apply format conversion
      const outputFormat = options.format || path.extname(media.path).substring(1);
      transformer = transformer.toFormat(outputFormat, {
        quality: options.quality || 80
      });
      
      // Get resulting buffer
      const resultBuffer = await transformer.toBuffer({ resolveWithMetadata: true });
      
      // Generate output info
      return {
        buffer: resultBuffer.data,
        metadata: {
          width: resultBuffer.info.width,
          height: resultBuffer.info.height,
          format: resultBuffer.info.format,
          size: resultBuffer.data.length
        }
      };
    } catch (error) {
      logger.error('Error transforming image', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Simple EXIF parser (placeholder - would be more comprehensive in production)
   */
  private parseExif(exifBuffer: Buffer): any {
    // This is a placeholder for a real EXIF parser
    // In a real implementation, this would use a library like exif-parser
    return {};
  }
  
  /**
   * Sanitize EXIF data to remove sensitive information
   */
  private sanitizeExifData(exif: any): any {
    // Remove potentially sensitive information
    const sanitized = { ...exif };
    
    // Remove GPS data
    delete sanitized.gps;
    delete sanitized.GPSLatitude;
    delete sanitized.GPSLongitude;
    delete sanitized.GPSPosition;
    
    // Remove device identifiers
    delete sanitized.SerialNumber;
    delete sanitized.DeviceID;
    delete sanitized.HostComputer;
    
    return sanitized;
  }
  
  /**
   * Helper function to get text position for watermark
   */
  private getTextPosition(position: string, axis: 'x' | 'y', dimension: number): number {
    const padding = 20;
    
    if (axis === 'x') {
      if (position.includes('left')) {
        return padding;
      } else if (position.includes('right')) {
        return dimension - padding;
      } else {
        return dimension / 2;
      }
    } else {
      if (position.includes('top')) {
        return padding + 20; // Add font size
      } else if (position.includes('bottom')) {
        return dimension - padding;
      } else {
        return dimension / 2;
      }
    }
  }
  
  /**
   * Helper function to get text anchor for watermark
   */
  private getTextAnchor(position: string): string {
    if (position.includes('left')) {
      return 'start';
    } else if (position.includes('right')) {
      return 'end';
    } else {
      return 'middle';
    }
  }
}
