/**
 * Jobs Plugin
 * 
 * Initializes and manages the background job system.
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { initializeJobSystem, shutdownQueues } from '../jobs';
import { startJobMonitoring, stopJobMonitoring } from '../jobs/monitoring';
import { logger } from '../lib/logger';

/**
 * Job system plugin for Fastify
 */
export default fp(async function jobsPlugin(fastify: FastifyInstance) {
  // Initialize job system
  await initializeJobSystem();
  logger.info('Job system initialized');
  
  // Start job monitoring
  startJobMonitoring();
  logger.info('Job monitoring started');
  
  // Register shutdown hook
  fastify.addHook('onClose', async () => {
    logger.info('Shutting down job system...');
    
    // Stop monitoring
    stopJobMonitoring();
    
    // Shutdown queues
    await shutdownQueues();
    
    logger.info('Job system shutdown complete');
  });
});
