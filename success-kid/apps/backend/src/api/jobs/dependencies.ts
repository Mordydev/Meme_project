/**
 * Job Dependency Routes
 * 
 * API endpoints for managing job dependencies.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  addJobWithDependencies, 
  checkDependencies, 
  getDependencyGraph,
  getJobDependency
} from '../../jobs/dependencies';
import { 
  addJob, 
  getJob, 
  getJobStatus, 
  removeJob 
} from '../../jobs/utils/queue-utils';
import { logger } from '../../lib/logger';

/**
 * Register job dependency routes
 * 
 * @param fastify Fastify instance
 */
export default async function dependencyRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Add a job with dependencies
   */
  fastify.post('/', async (request: FastifyRequest<{
    Body: {
      queue: string,
      name: string,
      data: any,
      dependencies: string[],
      options?: {
        priority?: number,
        attempts?: number,
        backoff?: {
          type: 'exponential' | 'fixed',
          delay: number
        },
        timeout?: number,
        removeOnComplete?: boolean,
        removeOnFail?: boolean,
        delay?: number,
        ttl?: number
      }
    }
  }>, reply) => {
    const { queue, name, data, dependencies, options } = request.body;
    
    try {
      const job = await addJobWithDependencies(queue, name, data, dependencies, options);
      
      return reply.code(201).send({
        data: {
          id: job.id,
          name: job.name,
          queue,
          dependencies,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error adding job with dependencies', { 
        error, 
        queue, 
        name, 
        dependencies 
      });
      
      throw error;
    }
  });
  
  /**
   * Check job dependencies
   */
  fastify.get('/:jobId', async (request: FastifyRequest<{
    Params: { jobId: string }
  }>, reply) => {
    const { jobId } = request.params;
    
    try {
      const status = await checkDependencies(jobId);
      const dependency = await getJobDependency(jobId);
      
      if (!dependency) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'DEPENDENCY_NOT_FOUND',
              message: `No dependencies found for job ${jobId}`
            }
          ]
        });
      }
      
      return reply.send({
        data: {
          jobId,
          dependsOn: dependency.dependsOn,
          status: dependency.status,
          ready: status.ready,
          pending: status.pending,
          failed: status.failed,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error checking job dependencies', { error, jobId });
      throw error;
    }
  });
  
  /**
   * Get job dependency graph
   */
  fastify.get('/:jobId/graph', async (request: FastifyRequest<{
    Params: { jobId: string }
  }>, reply) => {
    const { jobId } = request.params;
    
    try {
      const graph = await getDependencyGraph(jobId);
      
      return reply.send({
        data: graph,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting job dependency graph', { error, jobId });
      throw error;
    }
  });
  
  /**
   * Manually run a job (even if dependencies not met)
   */
  fastify.post('/:jobId/run', async (request: FastifyRequest<{
    Params: { jobId: string },
    Querystring: { force?: string }
  }>, reply) => {
    const { jobId } = request.params;
    const force = request.query.force === 'true';
    
    try {
      // First check if there are dependencies and if they're ready
      const status = await checkDependencies(jobId);
      
      // If not ready and not forcing, return error
      if (!status.ready && !force) {
        return reply.code(409).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'DEPENDENCIES_NOT_MET',
              message: `Dependencies not met: ${status.pending} pending, ${status.failed} failed. Use force=true to override.`
            }
          ]
        });
      }
      
      // Now we need to find which queue this job is in
      // This is simplified and would need proper implementation in a real system
      const dependency = await getJobDependency(jobId);
      
      if (!dependency) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'JOB_NOT_FOUND',
              message: `Job ${jobId} not found`
            }
          ]
        });
      }
      
      // In a real implementation we would promote the job
      // For now, just acknowledge the request
      return reply.send({
        data: {
          jobId,
          forced: force,
          message: 'Job execution requested',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error running job', { error, jobId, force });
      throw error;
    }
  });
}
