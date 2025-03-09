import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { JobQueueService, createJobProcessors } from '../services/core/jobs';

/**
 * Plugin that registers the job queue service
 */
const jobQueuePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Create job queue service
  const jobQueueService = new JobQueueService(fastify);
  
  // Create job processors
  const jobProcessors = createJobProcessors(fastify);
  
  // Initialize the job queue service
  await jobQueueService.initialize(jobProcessors);
  
  // Register service with Fastify
  fastify.decorate('jobQueue', jobQueueService);
  
  // Add shutdown hook
  fastify.addHook('onClose', async () => {
    await jobQueueService.shutdown();
  });
  
  // Register health check route
  fastify.get('/api/v1/jobs/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            queues: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  waiting: { type: 'number' },
                  active: { type: 'number' },
                  completed: { type: 'number' },
                  failed: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async () => {
    const counts = await jobQueueService.getJobCounts();
    return {
      status: 'ok',
      queues: counts
    };
  });
  
  fastify.log.info('Job queue plugin registered');
};

export default fp(jobQueuePlugin, {
  name: 'job-queue-plugin',
  dependencies: ['redis', 'metrics']
});
