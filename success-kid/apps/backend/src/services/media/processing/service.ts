/**
 * Media Processing Service
 * 
 * Handles image optimization, variant generation, and processing operations.
 */
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { storage } from '../storage';
import { mediaRepository } from '../../../repositories/media-repository';
import { MediaFile, MediaVariant, UpdateMediaFileDto } from '../../../models/entities/media';
import { logger } from '../../../lib/logger';

// Configure Sharp for optimal performance
sharp.cache(false); // Disable cache to avoid memory growth
sharp.concurrency(2); // Limit concurrent processing to avoid memory issues

/**
 * Processing options interface
 */
export interface ImageProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    position?: string | number;
  };
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  withoutEnlargement?: boolean;
  background?: string;
  withMetadata?: boolean;
}

/**
 * Variant generation options
 */
export interface VariantDefinition {
  name: string;
  options: ImageProcessingOptions;
}

/**
 * Media Processing Service
 */
export class MediaProcessingService {
  // Default variants to generate for images
  private defaultVariants: VariantDefinition[] = [
    {
      name: 'thumbnail',
      options: {
        resize: { width: 150, height: 150, fit: 'cover' },
        format: 'webp',
        quality: 80
      }
    },
    {
      name: 'small',
      options: {
        resize: { width: 400, height: 400, fit: 'inside', withoutEnlargement: true },
        format: 'webp',
        quality: 85
      }
    },
    {
      name: 'medium',
      options: {
        resize: { width: 800, height: 800, fit: 'inside', withoutEnlargement: true },
        format: 'webp',
        quality: 85
      }
    },
    {
      name: 'large',
      options: {
        resize: { width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true },
        format: 'webp',
        quality: 85
      }
    }
  ];
  
  /**
   * Process an image file and create variants
   * @param mediaId Media file ID
   * @returns Updated media file with variants
   */
  async processImage(mediaId: string): Promise<MediaFile> {
    try {
      // Get media file
      const mediaFile = await mediaRepository.findById(mediaId);
      if (!mediaFile) {
        throw new Error(`Media file with ID ${mediaId} not found`);
      }
      
      // Verify it's an image
      if (!mediaFile.mimeType.startsWith('image/')) {
        logger.warn(`Attempted to process non-image file as image: ${mediaId}`);
        return mediaFile;
      }
      
      // Download original file
      const originalBuffer = await storage.getFile(mediaFile.path);
      
      // Extract metadata
      const metadata = await this.extractImageMetadata(originalBuffer);
      
      // Generate variants
      const variants = await this.generateVariants(mediaFile, originalBuffer);
      
      // Update media file with metadata and variants
      const updatedMedia = await mediaRepository.update(mediaId, {
        status: 'active',
        metadata: {
          ...mediaFile.metadata,
          ...metadata
        },
        variants
      });
      
      logger.info(`Successfully processed image ${mediaId} with ${Object.keys(variants).length} variants`);
      
      return updatedMedia;
    } catch (error) {
      logger.error(`Error processing image ${mediaId}`, { error });
      
      // Update status to failed
      await mediaRepository.update(mediaId, {
        status: 'failed',
        metadata: {
          ...((await mediaRepository.findById(mediaId))?.metadata || {}),
          processingError: error.message
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Generate standard variants for an image
   * @param mediaFile Media file
   * @param buffer Original image buffer
   * @returns Generated variants
   */
  async generateVariants(
    mediaFile: MediaFile,
    buffer: Buffer
  ): Promise<Record<string, MediaVariant>> {
    try {
      const variants: Record<string, MediaVariant> = {};
      
      // Process each variant in sequence to avoid memory issues
      for (const variant of this.defaultVariants) {
        // Skip variants where the original is smaller than the variant
        const metadata = await sharp(buffer).metadata();
        if (
          variant.options.resize &&
          variant.options.resize.width &&
          variant.options.resize.height &&
          variant.options.resize.withoutEnlargement &&
          metadata.width &&
          metadata.height &&
          metadata.width <= variant.options.resize.width &&
          metadata.height <= variant.options.resize.height
        ) {
          continue;
        }
        
        // Process the variant
        const variantResult = await this.createVariant(
          mediaFile,
          buffer,
          variant.name,
          variant.options
        );
        
        // Add to variants collection
        if (variantResult) {
          variants[variant.name] = variantResult;
        }
      }
      
      return variants;
    } catch (error) {
      logger.error(`Error generating variants for ${mediaFile.id}`, { error });
      throw error;
    }
  }
  
  /**
   * Create a single variant of an image
   * @param mediaFile Media file
   * @param buffer Original image buffer
   * @param variantName Variant name
   * @param options Processing options
   * @returns Generated variant or null if failed
   */
  async createVariant(
    mediaFile: MediaFile,
    buffer: Buffer,
    variantName: string,
    options: ImageProcessingOptions
  ): Promise<MediaVariant | null> {
    try {
      // Create Sharp instance
      let transformer = sharp(buffer);
      
      // Apply resize if specified
      if (options.resize) {
        transformer = transformer.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: options.resize.fit || 'cover',
          position: options.resize.position || 'centre',
          withoutEnlargement: options.resize.withoutEnlargement !== false,
          background: options.background || { r: 255, g: 255, b: 255, alpha: 1 }
        });
      }
      
      // Set output format
      const outputFormat = options.format || this.getOutputFormat(mediaFile.mimeType);
      switch (outputFormat) {
        case 'jpeg':
          transformer = transformer.jpeg({ quality: options.quality || 85 });
          break;
        case 'png':
          transformer = transformer.png({ quality: options.quality || 90 });
          break;
        case 'webp':
          transformer = transformer.webp({ quality: options.quality || 85 });
          break;
        case 'avif':
          transformer = transformer.avif({ quality: options.quality || 80 });
          break;
      }
      
      // Preserve metadata if requested
      if (options.withMetadata) {
        transformer = transformer.withMetadata();
      }
      
      // Process image
      const outputBuffer = await transformer.toBuffer({ resolveWithObject: true });
      
      // Generate path for variant
      const variantPath = this.generateVariantPath(mediaFile.path, variantName, outputFormat);
      
      // Store in storage provider
      const result = await storage.storeFile(
        outputBuffer.data,
        variantPath,
        {
          contentType: `image/${outputFormat}`,
          metadata: {
            userId: mediaFile.user_id,
            variant: variantName,
            originalName: mediaFile.original_name
          },
          public: mediaFile.status === 'active'
        }
      );
      
      // Return variant information
      return {
        name: variantName,
        path: result.path,
        size: outputBuffer.data.length,
        dimensions: {
          width: outputBuffer.info.width,
          height: outputBuffer.info.height
        },
        mimeType: `image/${outputFormat}` as any
      };
    } catch (error) {
      logger.error(`Error creating variant ${variantName} for ${mediaFile.id}`, { error });
      return null;
    }
  }
  
  /**
   * Generate transformation URL path for a variant
   * @param originalPath Original file path
   * @param variantName Variant name
   * @param format Output format
   * @returns Variant path
   */
  private generateVariantPath(
    originalPath: string,
    variantName: string,
    format: string
  ): string {
    const parsedPath = path.parse(originalPath);
    return `${parsedPath.dir}/${parsedPath.name}-${variantName}.${format}`;
  }
  
  /**
   * Extract metadata from image
   * @param buffer Image buffer
   * @returns Extracted metadata
   */
  async extractImageMetadata(buffer: Buffer): Promise<Record<string, any>> {
    try {
      // Get Sharp metadata
      const sharpMetadata = await sharp(buffer).metadata();
      
      // Extract relevant metadata
      const metadata: Record<string, any> = {
        dimensions: {
          width: sharpMetadata.width,
          height: sharpMetadata.height
        },
        format: sharpMetadata.format,
        colorSpace: sharpMetadata.space,
        hasAlpha: sharpMetadata.hasAlpha,
        orientation: sharpMetadata.orientation
      };
      
      // Extract EXIF if available (but sanitize it)
      if (sharpMetadata.exif) {
        try {
          // This would extract and sanitize EXIF data
          // We're keeping it simple for now
          metadata.exif = 'EXIF data available';
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
   * Get output format based on input mime type
   * @param mimeType Input mime type
   * @returns Output format
   */
  private getOutputFormat(mimeType: string): 'jpeg' | 'png' | 'webp' | 'avif' {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpeg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/avif':
        return 'avif';
      default:
        return 'webp'; // Default to WebP for best compatibility/efficiency
    }
  }
  
  /**
   * Apply transformations to an image
   * @param mediaId Media file ID
   * @param options Transformation options
   * @returns Transformed image buffer
   */
  async transformImage(
    mediaId: string,
    options: ImageProcessingOptions
  ): Promise<Buffer> {
    try {
      // Get media file
      const mediaFile = await mediaRepository.findById(mediaId);
      if (!mediaFile) {
        throw new Error(`Media file with ID ${mediaId} not found`);
      }
      
      // Get file from storage
      const fileBuffer = await storage.getFile(mediaFile.path);
      
      // Apply transformations
      let transformer = sharp(fileBuffer);
      
      // Apply resize if specified
      if (options.resize) {
        transformer = transformer.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: options.resize.fit || 'cover',
          position: options.resize.position || 'centre',
          withoutEnlargement: options.resize.withoutEnlargement !== false,
          background: options.background || { r: 255, g: 255, b: 255, alpha: 1 }
        });
      }
      
      // Set output format
      const outputFormat = options.format || this.getOutputFormat(mediaFile.mimeType);
      switch (outputFormat) {
        case 'jpeg':
          transformer = transformer.jpeg({ quality: options.quality || 85 });
          break;
        case 'png':
          transformer = transformer.png({ quality: options.quality || 90 });
          break;
        case 'webp':
          transformer = transformer.webp({ quality: options.quality || 85 });
          break;
        case 'avif':
          transformer = transformer.avif({ quality: options.quality || 80 });
          break;
      }
      
      // Preserve metadata if requested
      if (options.withMetadata) {
        transformer = transformer.withMetadata();
      }
      
      // Return processed buffer
      return transformer.toBuffer();
    } catch (error) {
      logger.error(`Error transforming image ${mediaId}`, { error });
      throw error;
    }
  }
}

// Create and export service instance
export const processingService = new MediaProcessingService();
