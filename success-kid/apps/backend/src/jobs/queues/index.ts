/**
 * Job Queue Registry
 * 
 * Manages all Bull queues for the application.
 */
import Bull from 'bull';
import { logger } from '../../lib/logger';
import { redisConfig } from '../../config/redis';
import { initializePointsQueue } from './points';
import { initializeMediaQueue } from './media';
import { initializeRedemptionQueue } from './redemption';
import { getQueueProcessors } from '../workers';

// Registry of all queues used in the application
export const queues: Record<string, Bull.Queue> = {};

/**
 * Get a queue by name
 * @param name Queue name
 * @returns Queue instance or undefined if not found
 */
export function getQueue(name: string): Bull.Queue | undefined {
  return queues[name];
}

/**
 * Start all queue processors
 */
export async function startQueueProcessors(): Promise<void> {
  logger.info('Starting queue processors...');

  try {
    // Initialize queue processors and assign them to the registry
    const pointsQueue = await initializePointsQueue(getRedisConfig());
    queues['points'] = pointsQueue;
    
    const mediaQueue = await initializeMediaQueue(getRedisConfig());
    queues['media'] = mediaQueue;
    
    const redemptionQueue = await initializeRedemptionQueue(getRedisConfig());
    queues['redemption'] = redemptionQueue;
    
    // Register worker processors for each queue
    await registerQueueProcessors();
    
    logger.info('Queue processors started successfully', { 
      queues: Object.keys(queues) 
    });
  } catch (error) {
    logger.error('Failed to start queue processors', { error });
    throw error;
  }
}

/**
 * Register worker processors for all queues
 */
async function registerQueueProcessors(): Promise<void> {
  // Get all worker processors
  const processors = getQueueProcessors();
  
  // Register each processor with its queue
  for (const [queueName, jobProcessors] of Object.entries(processors)) {
    const queue = queues[queueName];
    
    if (!queue) {
      logger.warn(`Queue "${queueName}" not found for processors`);
      continue;
    }
    
    for (const [jobName, processor] of Object.entries(jobProcessors)) {
      // Register processor with proper concurrency
      const concurrency = processor.concurrency || 1;
      queue.process(jobName, concurrency, processor.handler);
      
      logger.debug(`Registered processor for ${queueName}:${jobName} with concurrency ${concurrency}`);
    }
  }
}

/**
 * Get Redis configuration for Bull queues
 */
function getRedisConfig(): Bull.QueueOptions {
  return {
    redis: {
      host: redisConfig.options.host || 'localhost',
      port: redisConfig.options.port || 6379,
      password: redisConfig.options.password,
      tls: redisConfig.options.tls,
      db: redisConfig.options.db || 0,
    },
    prefix: `${redisConfig.keyPrefix}bull:`,
  };
}

/**
 * Clean all queues (remove completed and failed jobs)
 */
export async function cleanAllQueues(): Promise<void> {
  for (const [name, queue] of Object.entries(queues)) {
    try {
      // Clean completed jobs older than 1 day
      await queue.clean(24 * 60 * 60 * 1000, 'completed');
      
      // Clean failed jobs older than 7 days
      await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
      
      logger.info(`Cleaned queue "${name}"`);
    } catch (error) {
      logger.error(`Failed to clean queue "${name}"`, { error });
    }
  }
}

/**
 * Gracefully shut down all queues
 */
export async function shutdownQueues(): Promise<void> {
  logger.info('Shutting down job queues...');
  
  const shutdownPromises = Object.entries(queues).map(async ([name, queue]) => {
    try {
      await queue.close();
      logger.info(`Queue "${name}" closed`);
    } catch (error) {
      logger.error(`Failed to close queue "${name}"`, { error });
    }
  });
  
  await Promise.all(shutdownPromises);
  logger.info('All queues shut down');
}
