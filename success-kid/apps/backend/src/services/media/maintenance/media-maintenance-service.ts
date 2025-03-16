/**
 * Media Maintenance Service
 * 
 * Handles media cleanup, optimization, and maintenance tasks
 */
import { Queue } from 'bull';
import { 
  MediaRepository, 
} from '../../../repositories/media/media-repository';
import { 
  Media, 
  MediaStatus, 
  MediaType 
} from '../../../models/media/media';
import { StorageService } from '../storage/storage-service';
import { logger } from '../../../lib/logger';

/**
 * Maintenance job results
 */
export interface CleanupResult {
  processed: number;
  deleted: number;
  errors: number;
  spaceReclaimed: number;
}

/**
 * Cleanup options
 */
export interface CleanupOptions {
  olderThan?: number; // Days
  dryRun?: boolean;
  userId?: string;
  batchSize?: number;
}

/**
 * Storage analysis result
 */
export interface StorageAnalysis {
  totalSize: number;
  totalFiles: number;
  byType: Record<MediaType, { count: number; size: number }>;
  byStatus: Record<MediaStatus, { count: number; size: number }>;
  topUsers: Array<{ userId: string; count: number; size: number }>;
}

/**
 * Optimization options
 */
export interface OptimizationOptions {
  compressionLevel?: number; // 0-9, higher is more compression
  videoQuality?: number; // 0-100
  deduplication?: boolean;
  lifecycle?: boolean;
}

/**
 * Batch size for operations
 */
const BATCH_SIZE = 100;

/**
 * Media Maintenance Service
 */
export class MediaMaintenanceService {
  private maintenanceQueue: Queue;
  
  constructor(
    private mediaRepository: MediaRepository,
    private storageService: StorageService,
    queueOptions: any = {}
  ) {
    // Create a maintenance queue
    this.maintenanceQueue = new Queue('media-maintenance', queueOptions);
    
    // Process jobs
    this.maintenanceQueue.process('cleanupOrphaned', this.cleanupOrphanedJob.bind(this));
    this.maintenanceQueue.process('cleanupTemporary', this.cleanupTemporaryJob.bind(this));
    this.maintenanceQueue.process('auditStorage', this.auditStorageJob.bind(this));
    this.maintenanceQueue.process('analyzeUsage', this.analyzeUsageJob.bind(this));
    
    // Handle failed jobs
    this.maintenanceQueue.on('failed', (job, err) => {
      logger.error('Media maintenance job failed', {
        jobId: job.id,
        jobName: job.name,
        error: err
      });
    });
  }
  
  /**
   * Schedule recurring maintenance tasks
   */
  async scheduleMaintenanceTasks(): Promise<void> {
    try {
      // Schedule orphaned media cleanup (daily at 3 AM)
      await this.maintenanceQueue.add(
        'cleanupOrphaned',
        { olderThan: 7 },
        {
          repeat: { cron: '0 3 * * *' },
          removeOnComplete: true
        }
      );
      
      // Schedule temporary media cleanup (every 6 hours)
      await this.maintenanceQueue.add(
        'cleanupTemporary',
        { olderThan: 1 },
        {
          repeat: { cron: '0 */6 * * *' },
          removeOnComplete: true
        }
      );
      
      // Schedule storage audit (weekly on Sunday at 4 AM)
      await this.maintenanceQueue.add(
        'auditStorage',
        {},
        {
          repeat: { cron: '0 4 * * 0' },
          removeOnComplete: true
        }
      );
      
      // Schedule usage analysis (daily at 5 AM)
      await this.maintenanceQueue.add(
        'analyzeUsage',
        {},
        {
          repeat: { cron: '0 5 * * *' },
          removeOnComplete: true
        }
      );
      
      logger.info('Media maintenance tasks scheduled');
    } catch (error) {
      logger.error('Error scheduling maintenance tasks', { error });
      throw error;
    }
  }
  
  /**
   * Clean up orphaned media files
   */
  async cleanupOrphanedMedia(options: CleanupOptions = {}): Promise<CleanupResult> {
    try {
      // Queue job and return job ID
      const job = await this.maintenanceQueue.add('cleanupOrphaned', options, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: true
      });
      
      // If dry run, wait for job to complete and return result
      if (options.dryRun) {
        return await job.finished();
      }
      
      // If not a dry run, just return a job reference
      return { 
        processed: 0, 
        deleted: 0, 
        errors: 0,
        spaceReclaimed: 0,
        jobId: job.id
      } as any;
    } catch (error) {
      logger.error('Error cleaning up orphaned media', { error, options });
      throw error;
    }
  }
  
  /**
   * Clean up temporary media files
   */
  async cleanupTemporaryMedia(options: CleanupOptions = {}): Promise<CleanupResult> {
    try {
      // Queue job and return job ID
      const job = await this.maintenanceQueue.add('cleanupTemporary', options, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: true
      });
      
      // If dry run, wait for job to complete and return result
      if (options.dryRun) {
        return await job.finished();
      }
      
      // If not a dry run, just return a job reference
      return { 
        processed: 0, 
        deleted: 0, 
        errors: 0,
        spaceReclaimed: 0,
        jobId: job.id
      } as any;
    } catch (error) {
      logger.error('Error cleaning up temporary media', { error, options });
      throw error;
    }
  }
  
  /**
   * Audit media storage
   */
  async auditMediaStorage(): Promise<any> {
    try {
      // Queue job and return job ID
      const job = await this.maintenanceQueue.add('auditStorage', {}, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: true
      });
      
      return { queued: true, jobId: job.id };
    } catch (error) {
      logger.error('Error auditing media storage', { error });
      throw error;
    }
  }
  
  /**
   * Analyze storage usage
   */
  async analyzeStorageUsage(): Promise<any> {
    try {
      // Queue job and return job ID
      const job = await this.maintenanceQueue.add('analyzeUsage', {}, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: true
      });
      
      return { queued: true, jobId: job.id };
    } catch (error) {
      logger.error('Error analyzing storage usage', { error });
      throw error;
    }
  }
  
  /**
   * Optimize storage
   */
  async optimizeStorage(options: OptimizationOptions = {}): Promise<any> {
    try {
      // Queue job and return job ID
      const job = await this.maintenanceQueue.add('optimizeStorage', options, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: true
      });
      
      return { queued: true, jobId: job.id };
    } catch (error) {
      logger.error('Error optimizing storage', { error, options });
      throw error;
    }
  }
  
  /**
   * Orphaned media cleanup job implementation
   */
  private async cleanupOrphanedJob(job: any): Promise<CleanupResult> {
    const options = job.data || {};
    const olderThan = options.olderThan || 7; // Default 7 days
    const dryRun = options.dryRun || false;
    const batchSize = options.batchSize || BATCH_SIZE;
    
    const results: CleanupResult = {
      processed: 0,
      deleted: 0,
      errors: 0,
      spaceReclaimed: 0
    };
    
    try {
      logger.info('Starting orphaned media cleanup', { olderThan, dryRun });
      
      // Find orphaned media
      const orphanedMedia = await this.mediaRepository.findOrphaned(olderThan);
      
      // Log count
      logger.info(`Found ${orphanedMedia.length} orphaned media items`);
      
      // If dry run, just return the stats
      if (dryRun) {
        return {
          ...results,
          processed: orphanedMedia.length,
          spaceReclaimed: orphanedMedia.reduce((total, media) => total + (media.size || 0), 0)
        };
      }
      
      // Process in batches
      for (let i = 0; i < orphanedMedia.length; i += batchSize) {
        const batch = orphanedMedia.slice(i, i + batchSize);
        
        // Process each item in the batch
        await Promise.all(batch.map(async (media) => {
          try {
            results.processed++;
            
            // Log detailed information
            logger.info('Deleting orphaned media', {
              mediaId: media.id,
              path: media.path,
              size: media.size,
              age: this.getDaysSince(media.createdAt)
            });
            
            // Delete from storage
            await this.storageService.deleteFile(media.path);
            
            // Delete variants if any
            if (media.variants) {
              await Promise.all(
                Object.values(media.variants).map(variant => 
                  this.storageService.deleteFile(variant.path)
                )
              );
            }
            
            // Track space reclaimed
            results.spaceReclaimed += media.size || 0;
            
            // Update media record status to deleted
            await this.mediaRepository.updateMedia(media.id, {
              status: MediaStatus.DELETED
            });
            
            results.deleted++;
          } catch (error) {
            logger.error('Error cleaning up orphaned media', {
              error,
              mediaId: media.id
            });
            results.errors++;
          }
        }));
        
        // Log progress
        if (i + batchSize < orphanedMedia.length) {
          logger.info(`Orphaned media cleanup progress: ${i + batchSize}/${orphanedMedia.length}`);
        }
      }
      
      // Log final results
      logger.info('Orphaned media cleanup completed', results);
      
      return results;
    } catch (error) {
      logger.error('Error in orphaned media cleanup job', { error });
      throw error;
    }
  }
  
  /**
   * Temporary media cleanup job implementation
   */
  private async cleanupTemporaryJob(job: any): Promise<CleanupResult> {
    const options = job.data || {};
    const olderThan = options.olderThan || 1; // Default 1 day
    const dryRun = options.dryRun || false;
    const batchSize = options.batchSize || BATCH_SIZE;
    
    const results: CleanupResult = {
      processed: 0,
      deleted: 0,
      errors: 0,
      spaceReclaimed: 0
    };
    
    try {
      logger.info('Starting temporary media cleanup', { olderThan, dryRun });
      
      // Find temporary media (uploading or processing status)
      // that are older than specified days
      const query = `
        SELECT * FROM media
        WHERE (status = $1 OR status = $2)
        AND created_at < NOW() - INTERVAL '${olderThan} days'
      `;
      
      const temporaryMedia = await this.mediaRepository.db.query<any>(
        query,
        [MediaStatus.UPLOADING, MediaStatus.PROCESSING]
      );
      
      // Map to Media objects
      const mediaItems: Media[] = temporaryMedia.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        originalName: row.original_name,
        mimeType: row.mime_type,
        size: row.size,
        type: row.type,
        path: row.path,
        publicUrl: row.public_url,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as Media));
      
      // Log count
      logger.info(`Found ${mediaItems.length} temporary media items`);
      
      // If dry run, just return the stats
      if (dryRun) {
        return {
          ...results,
          processed: mediaItems.length,
          spaceReclaimed: mediaItems.reduce((total, media) => total + (media.size || 0), 0)
        };
      }
      
      // Process in batches
      for (let i = 0; i < mediaItems.length; i += batchSize) {
        const batch = mediaItems.slice(i, i + batchSize);
        
        // Process each item in the batch
        await Promise.all(batch.map(async (media) => {
          try {
            results.processed++;
            
            // Log detailed information
            logger.info('Deleting temporary media', {
              mediaId: media.id,
              path: media.path,
              size: media.size,
              status: media.status,
              age: this.getDaysSince(media.createdAt)
            });
            
            // Delete from storage
            await this.storageService.deleteFile(media.path);
            
            // Track space reclaimed
            results.spaceReclaimed += media.size || 0;
            
            // Update media record status to deleted
            await this.mediaRepository.updateMedia(media.id, {
              status: MediaStatus.DELETED
            });
            
            results.deleted++;
          } catch (error) {
            logger.error('Error cleaning up temporary media', {
              error,
              mediaId: media.id
            });
            results.errors++;
          }
        }));
        
        // Log progress
        if (i + batchSize < mediaItems.length) {
          logger.info(`Temporary media cleanup progress: ${i + batchSize}/${mediaItems.length}`);
        }
      }
      
      // Log final results
      logger.info('Temporary media cleanup completed', results);
      
      return results;
    } catch (error) {
      logger.error('Error in temporary media cleanup job', { error });
      throw error;
    }
  }
  
  /**
   * Storage audit job implementation
   */
  private async auditStorageJob(job: any): Promise<any> {
    try {
      logger.info('Starting media storage audit');
      
      const results = {
        totalRecords: 0,
        totalSize: 0,
        mediaNotInStorage: 0,
        storageNotInDatabase: 0,
        inconsistentSize: 0,
        mediaTypes: {} as Record<string, number>,
        mediaStatuses: {} as Record<string, number>
      };
      
      // Step 1: Audit database records against storage
      const allMedia = await this.mediaRepository.findAll();
      
      results.totalRecords = allMedia.length;
      results.totalSize = allMedia.reduce((sum, media) => sum + (media.size || 0), 0);
      
      // Count by type and status
      allMedia.forEach(media => {
        // Count by type
        if (media.type) {
          results.mediaTypes[media.type] = (results.mediaTypes[media.type] || 0) + 1;
        }
        
        // Count by status
        if (media.status) {
          results.mediaStatuses[media.status] = (results.mediaStatuses[media.status] || 0) + 1;
        }
      });
      
      // Check a sample of records
      const sampleSize = Math.min(100, allMedia.length);
      const sample = this.getRandomSample(allMedia, sampleSize);
      
      for (const media of sample) {
        try {
          // Check if file exists in storage
          const exists = await this.storageService.fileExists(media.path);
          
          if (!exists) {
            results.mediaNotInStorage++;
            logger.warn('Media file not found in storage', {
              mediaId: media.id,
              path: media.path
            });
          } else {
            // Check file size (if available in storage provider)
            try {
              const metadata = await this.storageService.getFileMetadata(media.path);
              
              if (metadata.size && Math.abs(metadata.size - media.size) > 10) {
                results.inconsistentSize++;
                logger.warn('Media file size inconsistent', {
                  mediaId: media.id,
                  dbSize: media.size,
                  storageSize: metadata.size,
                  diff: metadata.size - media.size
                });
              }
            } catch (error) {
              // Ignore metadata errors
              logger.debug('Error getting file metadata', { error, mediaId: media.id });
            }
          }
        } catch (error) {
          logger.error('Error checking media in storage', { error, mediaId: media.id });
        }
      }
      
      // Step 2: Check variants
      let totalVariants = 0;
      
      for (const media of sample) {
        if (media.variants) {
          const variants = Object.values(media.variants);
          totalVariants += variants.length;
          
          for (const variant of variants) {
            try {
              const exists = await this.storageService.fileExists(variant.path);
              
              if (!exists) {
                logger.warn('Media variant not found in storage', {
                  mediaId: media.id,
                  variantName: variant.name,
                  path: variant.path
                });
              }
            } catch (error) {
              logger.error('Error checking variant in storage', { 
                error, 
                mediaId: media.id,
                variantName: variant.name 
              });
            }
          }
        }
      }
      
      // Log results
      logger.info('Media storage audit completed', {
        ...results,
        totalVariants,
        sampledRecords: sampleSize
      });
      
      return {
        ...results,
        totalVariants,
        sampledRecords: sampleSize,
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in media storage audit job', { error });
      throw error;
    }
  }
  
  /**
   * Storage usage analysis job implementation
   */
  private async analyzeUsageJob(job: any): Promise<StorageAnalysis> {
    try {
      logger.info('Starting media storage usage analysis');
      
      // Initialize results structure
      const analysis: StorageAnalysis = {
        totalSize: 0,
        totalFiles: 0,
        byType: {} as Record<MediaType, { count: number; size: number }>,
        byStatus: {} as Record<MediaStatus, { count: number; size: number }>,
        topUsers: []
      };
      
      // Initialize type and status counters
      for (const type of Object.values(MediaType)) {
        analysis.byType[type] = { count: 0, size: 0 };
      }
      
      for (const status of Object.values(MediaStatus)) {
        analysis.byStatus[status] = { count: 0, size: 0 };
      }
      
      // Get all media (consider pagination for large datasets)
      const allMedia = await this.mediaRepository.findAll();
      
      // Count totals
      analysis.totalFiles = allMedia.length;
      analysis.totalSize = allMedia.reduce((sum, media) => sum + (media.size || 0), 0);
      
      // Group by type and status
      for (const media of allMedia) {
        // By type
        if (media.type) {
          analysis.byType[media.type].count++;
          analysis.byType[media.type].size += media.size || 0;
        }
        
        // By status
        if (media.status) {
          analysis.byStatus[media.status].count++;
          analysis.byStatus[media.status].size += media.size || 0;
        }
      }
      
      // Group by user
      const userMedia = allMedia.reduce((acc, media) => {
        const userId = media.userId;
        
        if (!acc[userId]) {
          acc[userId] = { count: 0, size: 0 };
        }
        
        acc[userId].count++;
        acc[userId].size += media.size || 0;
        
        return acc;
      }, {} as Record<string, { count: number; size: number }>);
      
      // Get top users by size
      analysis.topUsers = Object.entries(userMedia)
        .map(([userId, stats]) => ({ userId, ...stats }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);
      
      // Log results
      logger.info('Media storage usage analysis completed', {
        totalFiles: analysis.totalFiles,
        totalSize: analysis.totalSize,
        topUser: analysis.topUsers[0]?.userId,
        topUserSize: analysis.topUsers[0]?.size
      });
      
      return analysis;
    } catch (error) {
      logger.error('Error in storage usage analysis job', { error });
      throw error;
    }
  }
  
  /**
   * Get days since a date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Get a random sample from an array
   */
  private getRandomSample<T>(array: T[], size: number): T[] {
    const sample = [...array];
    
    // Fisher-Yates shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sample[i], sample[j]] = [sample[j], sample[i]];
    }
    
    return sample.slice(0, size);
  }
}
