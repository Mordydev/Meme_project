import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import { Logger } from 'pino';
import { JobType, JobPriority, JobOptions } from './job-types';
import { MetricsService } from '../metrics-service';
import { config } from '../../../config';

/**
 * Processes for different job types
 */
interface JobProcessors {
  [key: string]: (job: Job) => Promise<any>;
}

/**
 * Service for managing background job queues
 */
export class JobQueueService {
  private readonly queues: Map<string, Queue> = new Map();
  private readonly workers: Map<string, Worker> = new Map();
  private readonly schedulers: Map<string, QueueScheduler> = new Map();
  private readonly processors: JobProcessors = {};
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly metricsService: MetricsService;
  private readonly connection: { host: string; port: number };
  private initialized = false;
  
  /**
   * Create a new job queue service
   */
  constructor(fastify: FastifyInstance) {
    this.redis = fastify.redis;
    this.logger = fastify.log.child({ service: 'job-queue' });
    this.metricsService = fastify.metrics;
    
    // Parse Redis connection settings
    const redisUrl = fastify.config.redis.url || 'redis://localhost:6379';
    const match = redisUrl.match(/redis:\/\/(?:.*@)?([^:]+):(\d+)/);
    
    if (match) {
      this.connection = {
        host: match[1],
        port: parseInt(match[2], 10)
      };
    } else {
      this.connection = {
        host: 'localhost',
        port: 6379
      };
    }
  }
  
  /**
   * Initialize queues and workers
   */
  async initialize(processors: JobProcessors): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    this.processors = processors;
    
    // Initialize queues for each priority level
    await this.initializePriorityQueues();
    
    // Initialize workers for each queue
    await this.initializeWorkers();
    
    this.initialized = true;
    this.logger.info('Job queue service initialized');
  }
  
  /**
   * Initialize priority queues
   */
  private async initializePriorityQueues(): Promise<void> {
    // Create a queue for each priority level
    const queueNames = [
      'critical', // For time-sensitive operations (auth, payments)
      'high',     // For user-facing operations (content processing)
      'normal',   // For standard background tasks
      'low',      // For non-urgent tasks
      'maintenance' // For system maintenance tasks
    ];
    
    for (const name of queueNames) {
      // Create queue
      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          removeOnComplete: true,
          removeOnFail: 100 // Keep last 100 failed jobs
        }
      });
      
      // Create scheduler
      const scheduler = new QueueScheduler(name, {
        connection: this.connection
      });
      
      this.queues.set(name, queue);
      this.schedulers.set(name, scheduler);
      
      this.logger.info(`Initialized queue: ${name}`);
    }
  }
  
  /**
   * Initialize workers
   */
  private async initializeWorkers(): Promise<void> {
    // Create workers for each queue with appropriate concurrency
    const workerConfigs = [
      { name: 'critical', concurrency: 10 },
      { name: 'high', concurrency: 5 },
      { name: 'normal', concurrency: 3 },
      { name: 'low', concurrency: 1 },
      { name: 'maintenance', concurrency: 1 }
    ];
    
    for (const config of workerConfigs) {
      const worker = new Worker(
        config.name,
        this.processJob.bind(this),
        {
          connection: this.connection,
          concurrency: config.concurrency,
          autorun: true
        }
      );
      
      // Handle worker events
      this.setupWorkerEvents(worker, config.name);
      
      this.workers.set(config.name, worker);
      this.logger.info(`Initialized worker: ${config.name} with concurrency ${config.concurrency}`);
    }
  }
  
  /**
   * Setup worker events
   */
  private setupWorkerEvents(worker: Worker, name: string): void {
    worker.on('completed', (job) => {
      this.logger.debug({ jobId: job.id, type: job.name }, 'Job completed successfully');
      this.metricsService.increment(`jobs.${name}.completed`, 1);
      this.metricsService.timing(`jobs.${name}.duration`, job.processedOn ? Date.now() - job.processedOn : 0);
    });
    
    worker.on('failed', (job, error) => {
      const attempts = job?.attemptsMade || 0;
      const maxAttempts = job?.opts?.attempts || 0;
      
      // Log differently based on retry status
      if (attempts < maxAttempts) {
        this.logger.warn(
          { jobId: job?.id, type: job?.name, error: error.message, attempt: attempts, maxAttempts },
          'Job failed, will retry'
        );
      } else {
        this.logger.error(
          { jobId: job?.id, type: job?.name, error: error.message, attempt: attempts },
          'Job failed permanently'
        );
        
        // Increment metrics
        this.metricsService.increment(`jobs.${name}.failed`, 1);
        this.metricsService.increment(`jobs.${job?.name || 'unknown'}.failed`, 1);
        
        // Alert on critical job failures
        if (name === 'critical') {
          this.alertOnJobFailure(job, error);
        }
      }
    });
    
    worker.on('error', (error) => {
      this.logger.error({ error }, `Worker error in queue ${name}`);
      this.metricsService.increment(`jobs.${name}.worker_error`, 1);
    });
    
    worker.on('stalled', (jobId) => {
      this.logger.warn({ jobId }, `Job stalled in queue ${name}`);
      this.metricsService.increment(`jobs.${name}.stalled`, 1);
    });
  }
  
  /**
   * Alert on job failure
   */
  private async alertOnJobFailure(job: Job | undefined, error: Error): Promise<void> {
    try {
      // Log critical failure
      this.logger.error(
        { 
          jobId: job?.id, 
          type: job?.name, 
          error: error.message,
          data: job?.data,
          opts: job?.opts
        },
        'Critical job failure'
      );
      
      // Increment alert metric
      this.metricsService.increment('jobs.critical_failure', 1);
      
      // In a real implementation, you might:
      // 1. Send alerts to monitoring system
      // 2. Trigger incident response
      // 3. Send notifications to team
    } catch (alertError) {
      this.logger.error({ error: alertError }, 'Failed to send alert for job failure');
    }
  }
  
  /**
   * Get the appropriate queue for a job priority
   */
  private getQueueForPriority(priority: JobPriority | string): string {
    if (typeof priority === 'string') {
      return priority.toLowerCase();
    }
    
    switch (priority) {
      case JobPriority.CRITICAL:
        return 'critical';
      case JobPriority.HIGH:
        return 'high';
      case JobPriority.LOW:
        return 'low';
      case JobPriority.MAINTENANCE:
        return 'maintenance';
      case JobPriority.NORMAL:
      default:
        return 'normal';
    }
  }
  
  /**
   * Get the numerical priority value
   */
  private getPriorityValue(priority?: JobPriority | string): number {
    if (!priority) return 0;
    
    if (typeof priority === 'number') {
      return priority;
    }
    
    switch (priority.toLowerCase()) {
      case 'critical':
        return 1;
      case 'high':
        return 2;
      case 'normal':
        return 3;
      case 'low':
        return 4;
      case 'maintenance':
        return 5;
      default:
        return 3;
    }
  }
  
  /**
   * Add a job to the queue
   */
  async addJob<T = any>(
    type: JobType,
    data: T,
    options: JobOptions = {}
  ): Promise<Job<T>> {
    // Ensure the service is initialized
    if (!this.initialized) {
      throw new Error('JobQueueService not initialized');
    }
    
    // Determine appropriate queue based on priority
    const queueName = this.getQueueForPriority(options.priority || JobPriority.NORMAL);
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Unknown queue: ${queueName}`);
    }
    
    const timer = this.metricsService.startTimer();
    
    try {
      // Add job to queue with options
      const job = await queue.add(type, data, {
        priority: this.getPriorityValue(options.priority),
        delay: options.delay || 0,
        attempts: options.attempts || 3,
        backoff: options.backoff || {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: false,
        jobId: options.jobId,
        parentJobId: options.parentJobId
      });
      
      const duration = timer();
      this.metricsService.timing('jobs.enqueue.time', duration);
      this.metricsService.increment(`jobs.${queueName}.queued`, 1);
      this.metricsService.increment(`jobs.${type}.queued`, 1);
      
      this.logger.debug({ jobId: job.id, type, queue: queueName }, 'Job added to queue');
      
      return job;
    } catch (error) {
      this.metricsService.increment(`jobs.${queueName}.enqueue_error`, 1);
      this.metricsService.increment(`jobs.${type}.enqueue_error`, 1);
      
      this.logger.error({ error, type, data }, 'Failed to add job to queue');
      throw error;
    }
  }
  
  /**
   * Process job from any queue
   */
  private async processJob(job: Job): Promise<any> {
    const { id, name, data } = job;
    const jobType = name as JobType;
    
    const timer = this.metricsService.startTimer();
    
    try {
      this.logger.debug({ jobId: id, type: jobType }, 'Processing job');
      this.metricsService.increment(`jobs.${jobType}.processing`, 1);
      
      // Find the appropriate processor
      const processor = this.processors[jobType];
      
      if (!processor) {
        throw new Error(`No processor registered for job type: ${jobType}`);
      }
      
      // Process the job
      const result = await processor(job);
      
      // Track success metrics
      const duration = timer();
      this.metricsService.timing(`jobs.${jobType}.processing_time`, duration);
      this.metricsService.increment(`jobs.${jobType}.success`, 1);
      
      return result;
    } catch (error) {
      // Track failure metrics
      const duration = timer();
      this.metricsService.timing(`jobs.${jobType}.failure_time`, duration);
      this.metricsService.increment(`jobs.${jobType}.processing_error`, 1);
      
      // Log error with context
      this.logger.error(
        { error, jobId: id, type: jobType, attemptsMade: job.attemptsMade },
        'Job processing failed'
      );
      
      // Rethrow to trigger retry mechanism
      throw error;
    }
  }
  
  /**
   * Get job counts
   */
  async getJobCounts(): Promise<{ [queue: string]: { waiting: number; active: number; completed: number; failed: number } }> {
    const result: { [queue: string]: any } = {};
    
    for (const [name, queue] of this.queues.entries()) {
      result[name] = await queue.getJobCounts('waiting', 'active', 'completed', 'failed');
    }
    
    return result;
  }
  
  /**
   * Get job status
   */
  async getJobStatus(jobId: string, queueName?: string): Promise<Job | null> {
    // If queue name is provided, check only that queue
    if (queueName) {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Unknown queue: ${queueName}`);
      }
      
      return await queue.getJob(jobId);
    }
    
    // Otherwise, check all queues
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId);
      if (job) {
        return job;
      }
    }
    
    return null;
  }
  
  /**
   * Pause processing
   */
  async pause(queueName?: string): Promise<void> {
    if (queueName) {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Unknown queue: ${queueName}`);
      }
      
      await queue.pause();
      this.logger.info(`Paused queue: ${queueName}`);
    } else {
      await Promise.all(Array.from(this.queues.values()).map(queue => queue.pause()));
      this.logger.info('Paused all queues');
    }
  }
  
  /**
   * Resume processing
   */
  async resume(queueName?: string): Promise<void> {
    if (queueName) {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Unknown queue: ${queueName}`);
      }
      
      await queue.resume();
      this.logger.info(`Resumed queue: ${queueName}`);
    } else {
      await Promise.all(Array.from(this.queues.values()).map(queue => queue.resume()));
      this.logger.info('Resumed all queues');
    }
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down job queue service');
    
    // Close all workers
    await Promise.all(Array.from(this.workers.values()).map(worker => worker.close()));
    
    // Close all schedulers
    await Promise.all(Array.from(this.schedulers.values()).map(scheduler => scheduler.close()));
    
    // Close all queues
    await Promise.all(Array.from(this.queues.values()).map(queue => queue.close()));
    
    this.logger.info('Job queue service shutdown complete');
  }
}
