/**
 * Jobs module
 * 
 * Centralizes and exports all scheduled and background jobs
 */
import { startJobScheduler } from './scheduler';
import { startQueueProcessors } from './queues';
import { logger } from '../lib/logger';
import { initializeDependencySystem } from './dependencies';
import { initializeWorkerSystem } from './distributed';
import { initializePrioritySystem } from './priority';
import { startJobMonitoring } from './monitoring';
import { getJobHistoryService } from './history/index';

// Re-export old jobs for backward compatibility
export * from './redemption-processor';

/**
 * Initializes and starts all job-related systems
 * 
 * @returns {Promise<void>}
 */
export async function initializeJobSystem(): Promise<void> {
  try {
    // Start Bull queue processors
    await startQueueProcessors();
    logger.info('Background job processors started');
    
    // Start scheduled jobs
    startJobScheduler();
    logger.info('Job scheduler started');
    
    // Initialize job dependency system
    await initializeDependencySystem();
    logger.info('Job dependency system initialized');
    
    // Initialize worker system
    await initializeWorkerSystem();
    logger.info('Distributed worker system initialized');
    
    // Initialize priority system
    await initializePrioritySystem();
    logger.info('Job priority system initialized');
    
    // Start job monitoring
    startJobMonitoring();
    logger.info('Job monitoring system started');
    
    // Initialize job history service
    const historyService = getJobHistoryService();
    await historyService.initialize();
    logger.info('Job history service initialized');
  } catch (error) {
    logger.error('Failed to initialize job system', { error });
    throw error;
  }
}

/**
 * Start all scheduled jobs (legacy function for backward compatibility)
 */
export function startScheduledJobs(): void {
  initializeJobSystem().catch((error) => {
    logger.error('Error starting scheduled jobs:', error);
  });
}

// Export queue-related functions and types
export * from './queues';
export * from './scheduler';
export * from './utils/queue-utils';
export * from './monitoring';
export * from './retry';
export * from './priority';
export * from './history';
export * from './distributed';
export * from './dependencies';
export * from './resources';
