/**
 * Worker Registry
 * 
 * Registers job processors for each queue
 */
import { Queue } from 'bull';
import { logger } from '../../lib/logger';
import { QueueName } from '../queues';
import * as pointsWorkers from './points';
import * as contentWorkers from './content';
import * as mediaWorkers from './media';

/**
 * Register job processors for each queue
 * 
 * @param queues The queue registry
 */
export function registerWorkers(queues: Record<string, Queue>): void {
  // Register points processors
  queues[QueueName.POINTS].process('redemption', pointsWorkers.processRedemption);
  queues[QueueName.POINTS].process('award', pointsWorkers.processPointsAward);
  queues[QueueName.POINTS].process('transfer', pointsWorkers.processPointsTransfer);
  
  // Register content processors
  queues[QueueName.CONTENT].process('moderation', contentWorkers.processContentModeration);
  queues[QueueName.CONTENT].process('indexing', contentWorkers.processContentIndexing);
  
  // Register media processors
  queues[QueueName.MEDIA].process('optimization', mediaWorkers.processImageOptimization);
  queues[QueueName.MEDIA].process('transcoding', mediaWorkers.processVideoTranscoding);
  
  // Register notification processors (placeholder for future implementation)
  // queues[QueueName.NOTIFICATIONS].process('email', emailWorker);
  // queues[QueueName.NOTIFICATIONS].process('push', pushWorker);
  // queues[QueueName.NOTIFICATIONS].process('inApp', inAppWorker);
  
  logger.info('Job workers registered', {
    queues: Object.keys(queues),
    pointsProcessors: ['redemption', 'award', 'transfer'],
    contentProcessors: ['moderation', 'indexing'],
    mediaProcessors: ['optimization', 'transcoding']
  });
}

/**
 * Stop all queue processors
 * 
 * @param queues The queue registry
 */
export async function stopWorkers(queues: Record<string, Queue>): Promise<void> {
  for (const [name, queue] of Object.entries(queues)) {
    await queue.pause();
    await queue.close();
    logger.info(`Closed queue: ${name}`);
  }
  
  logger.info('All queue workers stopped');
}
