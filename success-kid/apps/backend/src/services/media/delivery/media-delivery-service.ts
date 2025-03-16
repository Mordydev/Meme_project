/**
 * Media Delivery Service
 * 
 * Handles media serving, optimization, and transformation for delivery
 */
import { FastifyReply } from 'fastify';
import path from 'path';
import mime from 'mime-types';
import { MediaRepository } from '../../../repositories/media/media-repository';
import { MediaAccessService } from '../access/media-access-service';
import { StorageService } from '../storage/storage-service';
import { MediaProcessingService } from '../processing/media-processing-service';
import { 
  Media,
  DeliveryOptions,
  MediaType 
} from '../../../models/media/media';
import { PermissionType } from '../../../models/media/media-permission';
import { getRedisClient } from '../../../lib/db-client';
import { logger } from '../../../lib/logger';
import { NotFoundError, ForbiddenError } from '../../../errors/api-errors';

// Type for range request handling
interface RangeInfo {
  start: number;
  end: number;
  length: number;
}

/**
 * Cache configuration by media type
 */
const CACHE_CONFIG = {
  [MediaType.IMAGE]: { maxAge: 86400, staleWhileRevalidate: 604800 }, // 1 day, 1 week SWR
  [MediaType.DOCUMENT]: { maxAge: 3600, staleWhileRevalidate: 86400 }, // 1 hour, 1 day SWR
  [MediaType.VIDEO]: { maxAge: 3600, staleWhileRevalidate: 86400 }, // 1 hour, 1 day SWR
  [MediaType.AUDIO]: { maxAge: 3600, staleWhileRevalidate: 86400 }, // 1 hour, 1 day SWR
  [MediaType.OTHER]: { maxAge: 3600, staleWhileRevalidate: 86400 }, // 1 hour, 1 day SWR
};

/**
 * Media Delivery Service
 */
export class MediaDeliveryService {
  constructor(
    private mediaRepository: MediaRepository,
    private accessService: MediaAccessService,
    private storageService: StorageService,
    private processingService: MediaProcessingService
  ) {}
  
  /**
   * Get media URL with optional transformations
   */
  async getMediaUrl(
    mediaId: string,
    userId: string | null,
    options: DeliveryOptions = {}
  ): Promise<string> {
    try {
      // Get media
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // If public, return direct URL
      if (media.publicUrl) {
        return this.buildTransformedUrl(media, options);
      }
      
      // Check permission if userId provided
      if (userId) {
        const hasPermission = await this.accessService.hasPermission(
          mediaId,
          userId,
          PermissionType.READ
        );
        
        if (!hasPermission) {
          throw new ForbiddenError('No permission to access media');
        }
        
        // Generate signed URL
        return this.buildTransformedUrl(media, options, userId);
      }
      
      // No userId and not public, can't access
      throw new ForbiddenError('Authentication required to access media');
    } catch (error) {
      logger.error('Error getting media URL', { error, mediaId, options });
      throw error;
    }
  }
  
  /**
   * Stream media to response
   */
  async streamMedia(
    mediaId: string,
    userId: string | null,
    reply: FastifyReply,
    options: DeliveryOptions = {}
  ): Promise<void> {
    try {
      // Get media
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Check permission unless public
      if (!media.publicUrl && userId) {
        const hasPermission = await this.accessService.hasPermission(
          mediaId,
          userId,
          PermissionType.READ
        );
        
        if (!hasPermission) {
          throw new ForbiddenError('No permission to access media');
        }
      } else if (!media.publicUrl && !userId) {
        throw new ForbiddenError('Authentication required to access media');
      }
      
      // Handle transformations for images
      if (media.type === MediaType.IMAGE && 
          (options.variant || options.resize || options.format || options.transformation)) {
        return this.streamTransformedImage(media, reply, options);
      }
      
      // Handle variant request
      if (options.variant && media.variants && media.variants[options.variant]) {
        const variant = media.variants[options.variant];
        
        // Set appropriate content type
        reply.header('Content-Type', variant.mimeType || 'application/octet-stream');
        
        // Set cache headers
        this.setCacheHeaders(reply, media.type);
        
        // Get and stream the file
        const fileBuffer = await this.storageService.getFile(variant.path);
        reply.send(fileBuffer);
        return;
      }
      
      // Set appropriate content type
      reply.header('Content-Type', media.mimeType || 'application/octet-stream');
      
      // Set content disposition for downloads
      if (options.download) {
        reply.header('Content-Disposition', `attachment; filename="${media.originalName}"`);
      } else {
        reply.header('Content-Disposition', 'inline');
      }
      
      // Set cache headers
      this.setCacheHeaders(reply, media.type);
      
      // Get and stream the file
      const fileBuffer = await this.storageService.getFile(media.path);
      reply.send(fileBuffer);
    } catch (error) {
      logger.error('Error streaming media', { error, mediaId, options });
      throw error;
    }
  }
  
  /**
   * Handle range requests for video streaming
   */
  async handleRangeRequest(
    mediaId: string,
    userId: string | null,
    range: string,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Get media
      const media = await this.mediaRepository.findById(mediaId);
      
      if (!media) {
        throw new NotFoundError('Media not found');
      }
      
      // Check permission unless public
      if (!media.publicUrl && userId) {
        const hasPermission = await this.accessService.hasPermission(
          mediaId,
          userId,
          PermissionType.READ
        );
        
        if (!hasPermission) {
          throw new ForbiddenError('No permission to access media');
        }
      } else if (!media.publicUrl && !userId) {
        throw new ForbiddenError('Authentication required to access media');
      }
      
      // Only videos should use range requests
      if (media.type !== MediaType.VIDEO && media.type !== MediaType.AUDIO) {
        // For non-video/audio, just serve normally
        return this.streamMedia(mediaId, userId, reply);
      }
      
      // Get the file size
      const fileSize = media.size;
      
      // Parse range
      // Example: bytes=0-1023
      const rangeInfo = this.parseRange(range, fileSize);
      
      if (!rangeInfo) {
        // Invalid range, serve full file with 200 status
        reply.header('Content-Type', media.mimeType);
        reply.header('Content-Length', fileSize.toString());
        reply.header('Accept-Ranges', 'bytes');
        
        const fileBuffer = await this.storageService.getFile(media.path);
        reply.send(fileBuffer);
        return;
      }
      
      // Calculate the chunk size
      const chunkSize = rangeInfo.end - rangeInfo.start + 1;
      
      // Set headers for partial content
      reply.status(206);
      reply.header('Content-Range', `bytes ${rangeInfo.start}-${rangeInfo.end}/${fileSize}`);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Content-Length', chunkSize.toString());
      reply.header('Content-Type', media.mimeType);
      
      // Retrieve the whole file for now
      // In a real-world implementation, you would use a stream to read only the required bytes
      const fileBuffer = await this.storageService.getFile(media.path);
      
      // Send only the requested range of bytes
      reply.send(fileBuffer.slice(rangeInfo.start, rangeInfo.end + 1));
    } catch (error) {
      logger.error('Error handling range request', { error, mediaId, range });
      throw error;
    }
  }
  
  /**
   * Optimize delivery based on client information
   */
  optimizeDelivery(
    media: Media,
    headers: Record<string, string | undefined>,
    options: DeliveryOptions = {}
  ): DeliveryOptions {
    // Clone to avoid modifying original options
    const optimizedOptions = { ...options };
    
    // Only optimize images
    if (media.type !== MediaType.IMAGE) {
      return optimizedOptions;
    }
    
    // Device detection from user agent
    const userAgent = headers['user-agent'] || '';
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
    
    // Get screen width from client hints if available
    let screenWidth: number | undefined;
    if (headers['sec-ch-viewport-width']) {
      screenWidth = parseInt(headers['sec-ch-viewport-width'], 10);
    } else if (headers['viewport-width']) {
      screenWidth = parseInt(headers['viewport-width'], 10);
    }
    
    // Select appropriate variant based on device and screen size
    if (!optimizedOptions.variant) {
      if (isMobile && (!screenWidth || screenWidth < 768)) {
        optimizedOptions.variant = 'small';
      } else if (!screenWidth || screenWidth < 1200) {
        optimizedOptions.variant = 'medium';
      } else {
        optimizedOptions.variant = 'large';
      }
    }
    
    // Format optimization based on Accept header
    if (!optimizedOptions.format) {
      const acceptHeader = headers['accept'] || '';
      
      if (acceptHeader.includes('image/avif')) {
        optimizedOptions.format = 'avif';
      } else if (acceptHeader.includes('image/webp')) {
        optimizedOptions.format = 'webp';
      }
    }
    
    return optimizedOptions;
  }
  
  /**
   * Stream transformed image
   */
  private async streamTransformedImage(
    media: Media,
    reply: FastifyReply,
    options: DeliveryOptions
  ): Promise<void> {
    try {
      // Check if we can use an existing variant
      if (options.variant && media.variants && media.variants[options.variant] && 
          !options.resize && !options.format && !options.transformation) {
        
        const variant = media.variants[options.variant];
        
        // Set appropriate headers
        reply.header('Content-Type', variant.mimeType);
        
        // Set cache headers
        this.setCacheHeaders(reply, media.type);
        
        // Get and stream the variant
        const fileBuffer = await this.storageService.getFile(variant.path);
        reply.send(fileBuffer);
        return;
      }
      
      // Need to transform on-the-fly
      const transformOptions = {
        resize: options.resize,
        format: options.format,
        quality: options.quality || 80
      };
      
      // Generate cache key for transformed images
      const cacheKey = this.generateCacheKey(media.id, options);
      
      // Try to get from cache first
      const cachedImage = await this.getCachedTransformation(cacheKey);
      
      if (cachedImage) {
        // Set appropriate headers
        reply.header('Content-Type', this.getContentType(options.format || path.extname(media.path)));
        reply.header('X-Cache', 'HIT');
        
        // Set cache headers
        this.setCacheHeaders(reply, media.type);
        
        // Send cached image
        reply.send(cachedImage);
        return;
      }
      
      // Not in cache, transform image
      const transformed = await this.processingService.transformImage(media.id, transformOptions);
      
      // Set appropriate headers
      reply.header('Content-Type', this.getContentType(options.format || path.extname(media.path)));
      reply.header('X-Cache', 'MISS');
      
      // Set cache headers
      this.setCacheHeaders(reply, media.type);
      
      // Cache for future requests
      this.cacheTransformation(cacheKey, transformed.buffer);
      
      // Send transformed image
      reply.send(transformed.buffer);
    } catch (error) {
      logger.error('Error streaming transformed image', { error, mediaId: media.id, options });
      throw error;
    }
  }
  
  /**
   * Set appropriate cache headers
   */
  setCacheHeaders(reply: FastifyReply, mediaType: MediaType): void {
    const config = CACHE_CONFIG[mediaType] || CACHE_CONFIG[MediaType.OTHER];
    
    reply.header(
      'Cache-Control',
      `public, max-age=${config.maxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`
    );
  }
  
  /**
   * Parse range header
   */
  private parseRange(range: string, fileSize: number): RangeInfo | null {
    // Default format: "bytes=start-end"
    const match = range.match(/bytes=(\d+)-(\d*)/);
    
    if (!match) {
      return null;
    }
    
    const start = parseInt(match[1], 10);
    
    // If end is not specified, use fileSize - 1
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
    
    // Validate range
    if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
      return null;
    }
    
    return {
      start,
      end,
      length: fileSize
    };
  }
  
  /**
   * Build transformed URL with query parameters
   */
  private buildTransformedUrl(
    media: Media, 
    options: DeliveryOptions,
    userId?: string
  ): string {
    // Start with base URL
    const baseUrl = media.publicUrl 
      ? media.publicUrl 
      : `/api/v1/media/${media.id}`;
    
    // Add query parameters for any options
    const params = new URLSearchParams();
    
    if (options.variant) {
      params.append('variant', options.variant);
    }
    
    if (options.resize) {
      if (options.resize.width) {
        params.append('width', options.resize.width.toString());
      }
      if (options.resize.height) {
        params.append('height', options.resize.height.toString());
      }
      if (options.resize.fit) {
        params.append('fit', options.resize.fit);
      }
    }
    
    if (options.format) {
      params.append('format', options.format);
    }
    
    if (options.quality) {
      params.append('quality', options.quality.toString());
    }
    
    if (options.download) {
      params.append('download', '1');
    }
    
    // For private files, add a signed URL if userId is provided
    const queryString = params.toString();
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    if (!media.publicUrl && userId) {
      // Add signature parameters
      const signedParams = this.accessService.generateSignedUrl(media.id, media.path);
      return url + (queryString ? '&' : '?') + signedParams.substring(1);
    }
    
    return url;
  }
  
  /**
   * Get content type from format or extension
   */
  private getContentType(formatOrExt: string): string {
    // Remove dot if present
    const format = formatOrExt.startsWith('.') 
      ? formatOrExt.substring(1) 
      : formatOrExt;
    
    // Common formats
    const formatMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'avif': 'image/avif',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    };
    
    // Return mapped content type or use mime-types library as fallback
    return formatMap[format.toLowerCase()] || 
      mime.lookup(format) || 
      'application/octet-stream';
  }
  
  /**
   * Generate cache key for transformed images
   */
  private generateCacheKey(mediaId: string, options: DeliveryOptions): string {
    // Create a string representation of options
    const optionsStr = JSON.stringify({
      variant: options.variant,
      resize: options.resize,
      format: options.format,
      quality: options.quality
    });
    
    // Create the key
    return `media:transform:${mediaId}:${optionsStr}`;
  }
  
  /**
   * Get cached transformation
   */
  private async getCachedTransformation(key: string): Promise<Buffer | null> {
    try {
      const redis = getRedisClient();
      
      // Get from cache
      const cached = await redis.getBuffer(key);
      
      if (!cached) {
        return null;
      }
      
      return cached;
    } catch (error) {
      logger.warn('Error getting cached transformation', { error, key });
      return null;
    }
  }
  
  /**
   * Cache transformation
   */
  private async cacheTransformation(key: string, buffer: Buffer): Promise<void> {
    try {
      const redis = getRedisClient();
      
      // Cache for 1 day (86400 seconds)
      await redis.set(key, buffer, 'EX', 86400);
    } catch (error) {
      logger.warn('Error caching transformation', { error, key });
    }
  }
}
