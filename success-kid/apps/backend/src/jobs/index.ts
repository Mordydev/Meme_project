/**
 * Background Processing System
 * 
 * Provides job queues, scheduling, monitoring, and management functionality
 */
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { getDbClient } from '../lib/db-client';
import { logger } from '../lib/logger';
import { RedemptionService } from '../services/points/redemption-service';
import { QueueName, initializeQueues } from './queues';
import { registerWorkers, stopWorkers } from './workers';
import * as pointsWorkers from './workers/points';
import { ScheduleRepository, SchedulerService, createSchedulerService } from './scheduler';
import { metricsService } from './monitoring/metrics';
import { alertService } from './monitoring/alerts';
import { dashboardService } from './monitoring/dashboard';
import { jobService } from './service';
import { retryService } from './retry';
import { jobHistoryService } from './history';
import { priorityService } from './priority';
import { dependencyService } from './dependencies';
import { resourceService } from './resources';
import jobsApiRoutes from './routes';

/**
 * A more advanced job controller with Bull implementation
 */
export class BullJobController {
  private queues: Record<string, any> = {};
  private scheduler: SchedulerService;
  private metricsInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(private db: Pool) {
    // Create the schedule repository
    const scheduleRepository = new ScheduleRepository(db);
    
    // Create the scheduler service
    this.scheduler = createSchedulerService(scheduleRepository);
  }
  
  /**
   * Initialize the job processing system
   */
  async initialize(app: FastifyInstance): Promise<void> {
    logger.info('Initializing background processing system');
    
    try {
      // Initialize Bull queues
      this.queues = initializeQueues();
      
      // Register job processors
      registerWorkers(this.queues);
      
      // Set up job completion handlers
      this.setupJobCompletionHandlers();
      
      // Initialize services needed for processing (like redemption service)
      if (app) {
        // Get services from dependency injection container
        const redemptionService = app.diContainer.resolve<RedemptionService>('redemptionService');
        
        // Set the redemption service for the points worker
        if (redemptionService) {
          pointsWorkers.setRedemptionService(redemptionService);
        }
      }
      
      // Initialize scheduler
      await this.scheduler.initialize();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      // Start cleanup job
      this.startCleanupJob();
      
      logger.info('Background processing system initialized successfully', {
        queues: Object.keys(this.queues),
      });
    } catch (error) {
      logger.error('Failed to initialize background processing system', { error });
      throw error;
    }
  }
  
  /**
   * Set up handlers for job completion and failure
   */
  private setupJobCompletionHandlers(): void {
    // Set up handlers for each queue
    for (const [queueName, queue] of Object.entries(this.queues)) {
      // On job completion
      queue.on('completed', async (job, result) => {
        try {
          // Record job completion in history
          await jobHistoryService.recordJobCompletion(job, result);
          
          // Handle dependency resolution
          await dependencyService.handleJobCompletion(job.id, true);
          
          // If job was retried before succeeding, record success after retry
          if (job.attemptsMade > 1) {
            await retryService.recordSuccessAfterRetry(
              queueName as QueueName,
              job.name
            );
          }
        } catch (error) {
          logger.error('Error in job completion handler', {
            jobId: job.id,
            queue: queueName,
            error
          });
        }
      });
      
      // On job failure
      queue.on('failed', async (job, error) => {
        try {
          // Record job failure in history
          await jobHistoryService.recordJobFailure(job, error);
          
          // Handle dependency failures
          if (job.attemptsMade >= job.opts.attempts) {
            // Only handle as permanent failure if max attempts reached
            await dependencyService.handleJobCompletion(job.id, false);
          }
        } catch (handlerError) {
          logger.error('Error in job failure handler', {
            jobId: job.id,
            queue: queueName,
            error: error.message,
            handlerError
          });
        }
      });
    }
  }
  
  /**
   * Register routes for job API
   * 
   * @param app Fastify instance
   */
  registerRoutes(app: FastifyInstance): void {
    app.register(jobsApiRoutes);
    logger.info('Registered job API routes');
  }
  
  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    // Run metrics collection every minute
    this.metricsInterval = setInterval(async () => {
      try {
        logger.debug('Collecting job metrics');
        
        // Collect metrics for each queue
        for (const [name, queue] of Object.entries(this.queues)) {
          const metrics = await metricsService.collectQueueMetrics(queue);
          
          // Check for alerts
          await alertService.checkMetricsForAlerts(metrics);
        }
      } catch (error) {
        logger.error('Error collecting job metrics', { error });
      }
    }, 60 * 1000); // Every minute
  }
  
  /**
   * Start periodic cleanup job
   */
  private startCleanupJob(): void {
    // Run cleanup job every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        logger.info('Running job system cleanup');
        
        // Clean up old metrics data
        await metricsService.cleanUpOldMetrics();
        
        // Clean up old alerts
        await alertService.cleanUpOldAlerts();
        
        // Clean up old job history (keep last 30 days)
        await jobHistoryService.purgeOldRecords(30 * 24 * 60 * 60 * 1000);
        
        // Clean up completed jobs older than 1 day
        for (const queueName of Object.values(QueueName)) {
          await jobService.cleanCompletedJobs(queueName, 24 * 60 * 60 * 1000);
        }
        
        // Clean up old dependencies
        await dependencyService.cleanupOldDependencies();
        
        logger.info('Job system cleanup completed');
      } catch (error) {
        logger.error('Error in job system cleanup', { error });
      }
    }, 60 * 60 * 1000); // Every hour
  }
  
  /**
   * Enqueue a job for processing
   * 
   * @param queue Queue name
   * @param jobName Job type
   * @param data Job data
   * @param options Job options
   * @returns Job ID
   */
  async addJob(
    queue: QueueName,
    jobName: string,
    data: any,
    options: any = {}
  ): Promise<string> {
    return jobService.addJob(queue, jobName as any, data, options);
  }
  
  /**
   * Create a scheduled job
   * 
   * @param name Schedule name
   * @param queue Queue name
   * @param jobName Job type
   * @param data Job data
   * @param pattern Cron pattern
   * @param timezone Timezone
   * @param enabled Whether the schedule is enabled
   * @returns The created schedule
   */
  async createSchedule(
    name: string,
    queue: QueueName,
    jobName: string,
    data: any,
    pattern: string,
    timezone?: string,
    enabled: boolean = true
  ): Promise<any> {
    return this.scheduler.createSchedule({
      name,
      queue,
      jobName,
      data,
      pattern,
      timezone,
      enabled
    });
  }
  
  /**
   * Stop all background processing
   */
  async stop(): Promise<void> {
    logger.info('Stopping background processing system');
    
    // Stop metrics collection
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    // Stop cleanup job
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Stop scheduler
    this.scheduler.stop();
    
    // Stop workers and close queues
    await stopWorkers(this.queues);
    
    logger.info('Background processing system stopped');
  }
}

// Export services for use by other modules
export { jobService } from './service';
export { retryService } from './retry';
export { metricsService, alertService, dashboardService } from './monitoring';
export { jobHistoryService } from './history';
export { priorityService } from './priority';
export { dependencyService } from './dependencies';
export { resourceService } from './resources';
export { QueueName } from './queues';

// Create a singleton instance
const db = getDbClient();
export const bullJobController = new BullJobController(db);
