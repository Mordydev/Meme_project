/**
 * Resource Management Routes
 * 
 * API endpoints for managing resource-intensive jobs.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  setJobResourceRequirements,
  getJobResourceRequirements,
  scheduleResourceIntensiveJob,
  getResourceAvailability,
  ResourceRequirements
} from '../../jobs/resources';
import { logger } from '../../lib/logger';

/**
 * Register resource management routes
 * 
 * @param fastify Fastify instance
 */
export default async function resourceRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Get resource availability
   */
  fastify.get('/availability', async (request, reply) => {
    try {
      const availability = await getResourceAvailability();
      
      return reply.send({
        data: availability,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting resource availability', { error });
      throw error;
    }
  });
  
  /**
   * Set job resource requirements
   */
  fastify.post('/requirements', async (request: FastifyRequest<{
    Body: {
      queue: string;
      jobName: string;
      requirements: ResourceRequirements;
    }
  }>, reply) => {
    const { queue, jobName, requirements } = request.body;
    
    try {
      await setJobResourceRequirements(queue, jobName, requirements);
      
      return reply.code(201).send({
        data: {
          queue,
          jobName,
          requirements,
          message: 'Resource requirements set successfully',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error setting job resource requirements', { 
        error, 
        queue, 
        jobName 
      });
      throw error;
    }
  });
  
  /**
   * Get job resource requirements
   */
  fastify.get('/requirements/:queue/:jobName', async (request: FastifyRequest<{
    Params: {
      queue: string;
      jobName: string;
    }
  }>, reply) => {
    const { queue, jobName } = request.params;
    
    try {
      const requirements = getJobResourceRequirements(queue, jobName);
      
      if (!requirements) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'REQUIREMENTS_NOT_FOUND',
              message: `No resource requirements found for ${queue}:${jobName}`
            }
          ]
        });
      }
      
      return reply.send({
        data: {
          queue,
          jobName,
          requirements,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting job resource requirements', { 
        error, 
        queue, 
        jobName 
      });
      throw error;
    }
  });
  
  /**
   * Schedule a resource-intensive job
   */
  fastify.post('/jobs', async (request: FastifyRequest<{
    Body: {
      queue: string;
      jobName: string;
      data: any;
      options?: any;
    }
  }>, reply) => {
    const { queue, jobName, data, options } = request.body;
    
    try {
      const job = await scheduleResourceIntensiveJob(queue, jobName, data, options);
      
      return reply.code(201).send({
        data: {
          id: job.id,
          queue,
          name: jobName,
          message: 'Job scheduled successfully',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error scheduling resource-intensive job', { 
        error, 
        queue, 
        jobName 
      });
      throw error;
    }
  });
  
  /**
   * Get resource thresholds
   */
  fastify.get('/thresholds', async (request, reply) => {
    try {
      // This is a simplified endpoint - in a real system, we would
      // dynamically fetch these thresholds from the resource service
      // For now, return the static thresholds
      const thresholds = {
        MAX_CONCURRENT_JOBS: 100,
        MEMORY_INTENSIVE_THRESHOLD: 500, // MB
        MAX_MEMORY_INTENSIVE_JOBS: 10,
        CPU_INTENSIVE_THRESHOLD: 30, // Percentage
        MAX_CPU_INTENSIVE_JOBS: 5,
        MAX_GPU_JOBS: 2
      };
      
      return reply.send({
        data: thresholds,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting resource thresholds', { error });
      throw error;
    }
  });
}
