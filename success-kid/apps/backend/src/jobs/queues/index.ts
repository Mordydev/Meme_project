/**
 * Job Queues Registry
 * 
 * This module exports the queue registry and configuration for the application.
 */
import Bull, { Queue, QueueOptions } from 'bull';
import { redisConfig } from '../../config/redis';
import { logger } from '../../lib/logger';

// Queue registry type
export type QueueRegistry = {
  [key: string]: Queue;
};

// Default job options
export const defaultJobOptions: QueueOptions = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  },
  settings: {
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 3,     // Mark job as failed after 3 stall checks
  }
};

// Queue names
export enum QueueName {
  POINTS = 'points-processing',
  CONTENT = 'content-processing',
  MEDIA = 'media-processing',
  NOTIFICATIONS = 'notifications'
}

// Job name type mapping
export type JobTypeMap = {
  [QueueName.POINTS]: 'redemption' | 'award' | 'transfer';
  [QueueName.CONTENT]: 'moderation' | 'indexing';
  [QueueName.MEDIA]: 'optimization' | 'transcoding';
  [QueueName.NOTIFICATIONS]: 'email' | 'push' | 'inApp';
};

// Queue registry instance
const queues: QueueRegistry = {};

/**
 * Initialize job queues
 * @returns Object containing all registered queues
 */
export function initializeQueues(): QueueRegistry {
  // Points processing queue
  queues[QueueName.POINTS] = new Bull(QueueName.POINTS, {
    redis: {
      host: redisConfig.url.split(':')[0], 
      port: parseInt(redisConfig.url.split(':')[1], 10),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: `${redisConfig.keyPrefix}bull:`
    },
    ...defaultJobOptions
  });
  
  // Content processing queue
  queues[QueueName.CONTENT] = new Bull(QueueName.CONTENT, {
    redis: {
      host: redisConfig.url.split(':')[0], 
      port: parseInt(redisConfig.url.split(':')[1], 10),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: `${redisConfig.keyPrefix}bull:`
    },
    ...defaultJobOptions
  });
  
  // Media processing queue
  queues[QueueName.MEDIA] = new Bull(QueueName.MEDIA, {
    redis: {
      host: redisConfig.url.split(':')[0], 
      port: parseInt(redisConfig.url.split(':')[1], 10),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: `${redisConfig.keyPrefix}bull:`
    },
    ...defaultJobOptions
  });
  
  // Notifications queue
  queues[QueueName.NOTIFICATIONS] = new Bull(QueueName.NOTIFICATIONS, {
    redis: {
      host: redisConfig.url.split(':')[0], 
      port: parseInt(redisConfig.url.split(':')[1], 10),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: `${redisConfig.keyPrefix}bull:`
    },
    ...defaultJobOptions
  });
  
  // Set up global event handlers for all queues
  Object.values(queues).forEach(queue => {
    queue.on('error', error => {
      logger.error(`Queue ${queue.name} error:`, error);
    });
    
    queue.on('failed', (job, error) => {
      logger.error(`Job ${job.id} in queue ${queue.name} failed:`, {
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        error: error.message,
        stack: error.stack
      });
    });
    
    queue.on('stalled', job => {
      logger.warn(`Job ${job.id} in queue ${queue.name} stalled`, {
        jobName: job.name,
        attemptsMade: job.attemptsMade
      });
    });
  });
  
  logger.info('Job queues initialized', {
    queueCount: Object.keys(queues).length,
    queueNames: Object.keys(queues)
  });
  
  return queues;
}

/**
 * Get a specific queue by name
 * @param name Queue name to retrieve
 * @returns Bull Queue instance
 */
export function getQueue<T extends QueueName>(name: T): Queue {
  if (!queues[name]) {
    throw new Error(`Queue ${name} has not been initialized`);
  }
  
  return queues[name];
}

// Export configured queues
export default queues;