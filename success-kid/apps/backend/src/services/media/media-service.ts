/**
 * Media Service
 * 
 * Main entry point for media operations, coordinates all media-related services
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  StorageService, 
  StorageProviderType, 
  StorageServiceConfig 
} from './storage/storage-service';
import { UploadService } from './upload/upload-service';
import { MediaProcessingService } from './processing/media-processing-service';
import { MediaAccessService } from './access/media-access-service';
import { MediaDeliveryService } from './delivery/media-delivery-service';
import { MediaMaintenanceService } from './maintenance/media-maintenance-service';
import { 
  MediaRepository 
} from '../../repositories/media/media-repository';
import { 
  MediaPermissionRepository 
} from '../../repositories/media/media-permission-repository';

export interface MediaServiceConfig {
  storage: StorageServiceConfig;
  queueOptions: {
    redis: {
      host: string;
      port: number;
      password?: string;
    };
    prefix?: string;
  };
  uploadLimits?: {
    maxSizeBytes: number;
    fileSizeLimits?: Record<string, number>;
  };
}

/**
 * Media Service - main entry point for media operations
 */
export class MediaService {
  public upload: UploadService;
  public processing: MediaProcessingService;
  public access: MediaAccessService;
  public delivery: MediaDeliveryService;
  public maintenance: MediaMaintenanceService;
  private storageService: StorageService;
  
  constructor(
    private mediaRepository: MediaRepository,
    private mediaPermissionRepository: MediaPermissionRepository,
    private config: MediaServiceConfig
  ) {
    // Initialize storage service
    this.storageService = new StorageService(config.storage);
    
    // Initialize processing service
    this.processing = new MediaProcessingService(
      mediaRepository,
      this.storageService,
      config.queueOptions
    );
    
    // Initialize access service
    this.access = new MediaAccessService(
      mediaRepository,
      mediaPermissionRepository
    );
    
    // Initialize upload service
    this.upload = new UploadService(
      this.storageService, 
      mediaRepository,
      this.processing
    );
    
    // Initialize delivery service
    this.delivery = new MediaDeliveryService(
      mediaRepository,
      this.access,
      this.storageService,
      this.processing
    );
    
    // Initialize maintenance service
    this.maintenance = new MediaMaintenanceService(
      mediaRepository,
      this.storageService,
      config.queueOptions
    );
  }
  
  /**
   * Initialize scheduled maintenance tasks
   */
  async initializeScheduledTasks(): Promise<void> {
    await this.maintenance.scheduleMaintenanceTasks();
  }
  
  /**
   * Handle file upload from request
   */
  async handleUploadRequest(
    request: FastifyRequest<{
      Body: {
        file: {
          data: Buffer;
          filename: string;
          encoding: string;
          mimetype: string;
        };
        folder?: string;
        generateVariants?: boolean;
        visibility?: 'public' | 'private';
      };
    }>,
    userId: string
  ) {
    const { file, folder, generateVariants = true, visibility = 'private' } = request.body;
    
    return this.upload.handleUpload(
      file.data,
      {
        filename: file.filename,
        mimeType: file.mimetype,
        userId,
        folder,
        generateVariants,
        visibility
      }
    );
  }
  
  /**
   * Handle media delivery request
   */
  async handleMediaDelivery(
    mediaId: string,
    userId: string | null,
    reply: FastifyReply,
    options: {
      variant?: string;
      width?: number;
      height?: number;
      format?: string;
      quality?: number;
      download?: boolean;
    },
    headers: Record<string, string | undefined>
  ): Promise<void> {
    // Get media
    const media = await this.mediaRepository.findById(mediaId);
    
    if (!media) {
      reply.status(404).send({ error: 'Media not found' });
      return;
    }
    
    // Build delivery options
    const deliveryOptions = {
      variant: options.variant,
      resize: (options.width || options.height) ? {
        width: options.width,
        height: options.height
      } : undefined,
      format: options.format,
      quality: options.quality,
      download: options.download
    };
    
    // Optimize delivery based on client info
    const optimizedOptions = this.delivery.optimizeDelivery(
      media,
      headers,
      deliveryOptions
    );
    
    // Stream media
    await this.delivery.streamMedia(mediaId, userId, reply, optimizedOptions);
  }
  
  /**
   * Handle range request for video streaming
   */
  async handleRangeRequest(
    mediaId: string,
    userId: string | null,
    range: string,
    reply: FastifyReply
  ): Promise<void> {
    await this.delivery.handleRangeRequest(mediaId, userId, range, reply);
  }
}
