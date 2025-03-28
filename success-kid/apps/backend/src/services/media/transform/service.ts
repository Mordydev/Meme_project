/**
 * Media Transform Service
 * 
 * Handles on-demand transformations of media files.
 */
import sharp from 'sharp';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { storage } from '../storage';
import { mediaCacheService } from '../cache/service';
import { processingService } from '../processing/service';
import { mediaRepository } from '../../../repositories/media-repository';
import { MediaFile, MediaVariant } from '../../../models/entities/media';
import { logger } from '../../../lib/logger';

/**
 * Transform options for resizing
 */
export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string | number;
  background?: string;
  withoutEnlargement?: boolean;
}

/**
 * Transform options for output format
 */
export interface FormatOptions {
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  progressive?: boolean;
}

/**
 * Transform options for watermarking
 */
export interface WatermarkOptions {
  text: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  fontSize?: number;
  color?: string;
  opacity?: number;
}

/**
 * Composite transform options
 */
export interface TransformOptions {
  resize?: ResizeOptions;
  format?: FormatOptions;
  watermark?: WatermarkOptions;
  rotation?: number;
  flip?: boolean;
  flop?: boolean;
  sharpen?: boolean;
  blur?: number;
  grayscale?: boolean;
}

/**
 * Result of a transformation operation
 */
export interface TransformResult {
  buffer: Buffer;
  mimeType: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Request for batch transformation
 */
export interface TransformRequest {
  mediaId: string;
  options: TransformOptions;
  outputId?: string;
}

/**
 * Batch transformation result
 */
export interface BatchTransformResult {
  results: {
    mediaId: string;
    outputId: string;
    success: boolean;
    error?: string;
  }[];
}

/**
 * Media Transform Service
 */
export class MediaTransformService {
  /**
   * Transform an image with the specified options
   * @param mediaId Media file ID
   * @param options Transform options
   * @returns Transform result
   */
  async transformImage(mediaId: string, options: TransformOptions): Promise<TransformResult> {
    try {
      // Get media file
      const mediaFile = await mediaRepository.findById(mediaId);
      if (!mediaFile) {
        throw new Error(`Media file with ID ${mediaId} not found`);
      }
      
      // Verify it's an image
      if (!mediaFile.mimeType.startsWith('image/')) {
        throw new Error(`Media file with ID ${mediaId} is not an image`);
      }
      
      // Generate a hash for cache lookup
      const transformHash = mediaCacheService.generateTransformHash(options);
      
      // Check cache first
      const cachedResult = await mediaCacheService.getCachedMedia(
        mediaId,
        { transform: transformHash }
      );
      
      if (cachedResult) {
        // Get format info
        const format = options.format?.format || 
          this.getFormatFromMimeType(mediaFile.mimeType);
          
        // Return cached result
        return {
          buffer: cachedResult,
          mimeType: `image/${format}`,
          metadata: {
            // Use approximate metadata since we don't have actual dimensions
            // This could be improved by storing metadata in cache
            width: options.resize?.width || 0,
            height: options.resize?.height || 0,
            format,
            size: cachedResult.length
          }
        };
      }
      
      // Get original file
      const originalBuffer = await storage.getFile(mediaFile.path);
      
      // Initialize transformer
      let transformer = sharp(originalBuffer);
      
      // Apply resize if specified
      if (options.resize) {
        transformer = transformer.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: options.resize.fit || 'cover',
          position: options.resize.position || 'center',
          background: options.resize.background 
            ? { r: 255, g: 255, b: 255, alpha: 1 } 
            : undefined,
          withoutEnlargement: options.resize.withoutEnlargement !== false
        });
      }
      
      // Apply rotation if specified
      if (options.rotation) {
        transformer = transformer.rotate(options.rotation);
      }
      
      // Apply flip/flop if specified
      if (options.flip) {
        transformer = transformer.flip();
      }
      
      if (options.flop) {
        transformer = transformer.flop();
      }
      
      // Apply grayscale if specified
      if (options.grayscale) {
        transformer = transformer.grayscale();
      }
      
      // Apply sharpen if specified
      if (options.sharpen) {
        transformer = transformer.sharpen();
      }
      
      // Apply blur if specified
      if (options.blur) {
        transformer = transformer.blur(options.blur);
      }
      
      // TODO: Apply watermark if specified (would require additional implementation)
      
      // Apply output format
      const outputFormat = options.format?.format || 
        this.getFormatFromMimeType(mediaFile.mimeType);
      
      switch (outputFormat) {
        case 'jpeg':
          transformer = transformer.jpeg({
            quality: options.format?.quality || 85,
            progressive: options.format?.progressive
          });
          break;
        case 'png':
          transformer = transformer.png({
            quality: options.format?.quality || 90,
            progressive: options.format?.progressive
          });
          break;
        case 'webp':
          transformer = transformer.webp({
            quality: options.format?.quality || 85
          });
          break;
        case 'avif':
          transformer = transformer.avif({
            quality: options.format?.quality || 80
          });
          break;
      }
      
      // Process image
      const { data, info } = await transformer.toBuffer({ resolveWithObject: true });
      
      // Cache the result
      await mediaCacheService.cacheMedia(
        mediaId,
        data,
        { transform: transformHash }
      );
      
      // Return result
      return {
        buffer: data,
        mimeType: `image/${outputFormat}`,
        metadata: {
          width: info.width,
          height: info.height,
          format: info.format,
          size: data.length
        }
      };
    } catch (error) {
      logger.error(`Error transforming image ${mediaId}`, { error, options });
      throw error;
    }
  }
  
  /**
   * Create and save a transformation as a new variant
   * @param mediaId Media file ID
   * @param options Transform options
   * @returns ID of saved transformation
   */
  async createTransformation(
    mediaId: string,
    options: TransformOptions
  ): Promise<string> {
    try {
      // Transform the image
      const result = await this.transformImage(mediaId, options);
      
      // Get media file
      const mediaFile = await mediaRepository.findById(mediaId);
      if (!mediaFile) {
        throw new Error(`Media file with ID ${mediaId} not found`);
      }
      
      // Generate a unique name for this transformation
      const transformHash = mediaCacheService.generateTransformHash(options);
      const transformName = `transform-${transformHash.substring(0, 8)}`;
      
      // Generate path for transformed file
      const format = options.format?.format || 
        this.getFormatFromMimeType(mediaFile.mimeType);
      
      const transformPath = this.generateTransformPath(
        mediaFile.path,
        transformName,
        format
      );
      
      // Store transformed file
      const storageResult = await storage.storeFile(
        result.buffer,
        transformPath,
        {
          contentType: result.mimeType,
          metadata: {
            userId: mediaFile.user_id,
            originalId: mediaFile.id,
            transformHash
          }
        }
      );
      
      // Create variant in media file
      const variant: MediaVariant = {
        name: transformName,
        path: storageResult.path,
        size: result.buffer.length,
        dimensions: {
          width: result.metadata.width,
          height: result.metadata.height
        },
        mimeType: result.mimeType as any
      };
      
      // Update media file with new variant
      await mediaRepository.update(mediaId, {
        variants: {
          ...mediaFile.variants,
          [transformName]: variant
        }
      });
      
      return transformName;
    } catch (error) {
      logger.error(`Error creating transformation for ${mediaId}`, { error, options });
      throw error;
    }
  }
  
  /**
   * Get a specific transformation
   * @param mediaId Media file ID
   * @param transformName Transform name
   * @returns Transform result or null if not found
   */
  async getTransformation(
    mediaId: string,
    transformName: string
  ): Promise<TransformResult | null> {
    try {
      // Get media file
      const mediaFile = await mediaRepository.findById(mediaId);
      if (!mediaFile) {
        throw new Error(`Media file with ID ${mediaId} not found`);
      }
      
      // Check if transform exists
      if (!mediaFile.variants || !mediaFile.variants[transformName]) {
        return null;
      }
      
      // Get variant
      const variant = mediaFile.variants[transformName];
      
      // Get file from storage
      const buffer = await storage.getFile(variant.path);
      
      // Return result
      return {
        buffer,
        mimeType: variant.mimeType,
        metadata: {
          width: variant.dimensions?.width || 0,
          height: variant.dimensions?.height || 0,
          format: variant.mimeType.split('/')[1],
          size: variant.size
        }
      };
    } catch (error) {
      logger.error(`Error getting transformation ${transformName} for ${mediaId}`, { error });
      throw error;
    }
  }
  
  /**
   * Process multiple transformations in batch
   * @param requests Transformation requests
   * @returns Batch result
   */
  async batchTransform(requests: TransformRequest[]): Promise<BatchTransformResult> {
    const results: BatchTransformResult['results'] = [];
    
    // Process each request
    for (const request of requests) {
      try {
        const outputId = request.outputId || uuidv4();
        
        // Transform the image
        await this.createTransformation(request.mediaId, request.options);
        
        // Add to results
        results.push({
          mediaId: request.mediaId,
          outputId,
          success: true
        });
      } catch (error) {
        // Log error
        logger.error(`Error in batch transform for ${request.mediaId}`, { error });
        
        // Add failed result
        results.push({
          mediaId: request.mediaId,
          outputId: request.outputId || uuidv4(),
          success: false,
          error: error.message
        });
      }
    }
    
    return { results };
  }
  
  /**
   * Generate path for transformed file
   * @param originalPath Original file path
   * @param transformName Transform name
   * @param format Output format
   * @returns Transform path
   */
  private generateTransformPath(
    originalPath: string,
    transformName: string,
    format: string
  ): string {
    const parsedPath = path.parse(originalPath);
    return `${parsedPath.dir}/${parsedPath.name}-${transformName}.${format}`;
  }
  
  /**
   * Get format from MIME type
   * @param mimeType MIME type
   * @returns Format string
   */
  private getFormatFromMimeType(mimeType: string): 'jpeg' | 'png' | 'webp' | 'avif' {
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
        return 'jpeg'; // Default fallback
    }
  }
}

// Create and export service instance
export const transformService = new MediaTransformService();
