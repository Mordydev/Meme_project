/**
 * Queue Management Routes
 * 
 * API endpoints for managing job queues.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  addJob, 
  getJob, 
  getJobStatus, 
  removeJob, 
  getJobCounts, 
  getAllQueues,
  pauseQueue,
  resumeQueue,
  retryJob,
  promoteJob
} from '../../jobs/utils/queue-utils';

/**
 * Register queue management routes
 * 
 * @param fastify Fastify instance
 */
export default async function queueRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Get all queues
   */
  fastify.get('/', async (request, reply) => {
    const queues = getAllQueues();
    
    const result = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => {
        // Get queue metrics
        const counts = await queue.getJobCounts();
        
        return {
          name,
          counts,
          isPaused: await queue.isPaused(),
        };
      })
    );
    
    return reply.send({
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  });
  
  /**
   * Get queue details
   */
  fastify.get('/:queue', async (request: FastifyRequest<{
    Params: { queue: string }
  }>, reply) => {
    const { queue } = request.params;
    const queues = getAllQueues();
    
    if (!queues[queue]) {
      return reply.code(404).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'QUEUE_NOT_FOUND',
            message: `Queue "${queue}" not found`
          }
        ]
      });
    }
    
    const counts = await getJobCounts(queue);
    const isPaused = await queues[queue].isPaused();
    
    return reply.send({
      data: {
        name: queue,
        counts,
        isPaused
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  });
  
  /**
   * Add a job to a queue
   */
  fastify.post('/:queue/jobs', async (request: FastifyRequest<{
    Params: { queue: string },
    Body: {
      name: string,
      data: any,
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
    const { queue } = request.params;
    const { name, data, options } = request.body;
    
    try {
      const job = await addJob(queue, name, data, options);
      
      return reply.code(201).send({
        data: {
          id: job.id,
          name: job.name,
          queue,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'QUEUE_NOT_FOUND',
              message: `Queue "${queue}" not found`
            }
          ]
        });
      }
      
      throw error;
    }
  });
  
  /**
   * Get a job by ID
   */
  fastify.get('/:queue/jobs/:id', async (request: FastifyRequest<{
    Params: { queue: string, id: string }
  }>, reply) => {
    const { queue, id } = request.params;
    
    try {
      const job = await getJob(queue, id);
      
      if (!job) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'JOB_NOT_FOUND',
              message: `Job "${id}" not found in queue "${queue}"`
            }
          ]
        });
      }
      
      // Get job state and other details
      const state = await job.getState();
      
      return reply.send({
        data: {
          id: job.id,
          name: job.name,
          data: job.data,
          state,
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          timestamp: new Date().toISOString(),
          processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
          finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
          failedReason: job.failedReason,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'QUEUE_NOT_FOUND',
              message: `Queue "${queue}" not found`
            }
          ]
        });
      }
      
      throw error;
    }
  });
  
  /**
   * Get job status
   */
  fastify.get('/:queue/jobs/:id/status', async (request: FastifyRequest<{
    Params: { queue: string, id: string }
  }>, reply) => {
    const { queue, id } = request.params;
    
    try {
      const status = await getJobStatus(queue, id);
      
      return reply.send({
        data: {
          id,
          queue,
          status,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'QUEUE_NOT_FOUND',
              message: `Queue "${queue}" not found`
            }
          ]
        });
      }
      
      throw error;
    }
  });
  
  /**
   * Remove a job
   */
  fastify.delete('/:queue/jobs/:id', async (request: FastifyRequest<{
    Params: { queue: string, id: string }
  }>, reply) => {
    const { queue, id } = request.params;
    
    try {
      await removeJob(queue, id);
      
      return reply.code(200).send({
        data: {
          id,
          queue,
          message: 'Job removed successfully',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'QUEUE_NOT_FOUND',
              message: `Queue "${queue}" not found`
            }
          ]
        });
      }
      
      throw error;
    }
  });
  
  /**
   * Retry a failed job
   */
  fastify.post('/:queue/jobs/:id/retry', async (request: FastifyRequest<{
    Params: { queue: string, id: string }
  }>, reply) => {
    const { queue, id } = request.params;
    
    try {
      const job = await retryJob(queue, id);
      
      if (!job) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'JOB_NOT_FOUND',
              message: `Job "${id}" not found in queue "${queue}"`
            }
          ]
        });
      }
      
      return reply.send({
        data: {
          id,
          queue,
          message: 'Job scheduled for retry',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'QUEUE_NOT_FOUND',
              message: `Queue "${queue}" not found`
            }
          ]
        });
      }
      
      throw error;
    }
  });
  
  /**
   * Promote a delayed job to be executed immediately
   */
  fastify.post('/:queue/jobs/:id/promote', async (request: FastifyRequest<{
    Params: { queue: string, id: string }
  }>, reply) => {
    const { queue, id } = request.params;
    
    try {
      const job = await promoteJob(queue, id);
      
      if (!job) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'JOB_NOT_FOUND',
              message: `Job "${id}" not found in queue "${queue}"`
            }
          ]
        });
      }
      
      return reply.send({
        data: {
          id,
          queue,
          message: 'Job promoted to immediate execution',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'QUEUE_NOT_FOUND',
              message: `Queue "${queue}" not found`
            }
          ]
        });
      }
      
      throw error;
    }
  });
  
  /**
   * Pause a queue
   */
  fastify.post('/:queue/pause', async (request: FastifyRequest<{
    Params: { queue: string },
    Querystring: { local?: string }
  }>, reply) => {
    const { queue } = request.params;
    const isLocal = request.query.local !== 'false'; // Default to true
    
    try {
      await pauseQueue(queue, isLocal);
      
      return reply.send({
        data: {
          queue,
          isPaused: true,
          local: isLocal,
          message: `Queue "${queue}" paused ${isLocal ? 'locally' : 'globally'}`,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'QUEUE_NOT_FOUND',
              message: `Queue "${queue}" not found`
            }
          ]
        });
      }
      
      throw error;
    }
  });
  
  /**
   * Resume a queue
   */
  fastify.post('/:queue/resume', async (request: FastifyRequest<{
    Params: { queue: string },
    Querystring: { local?: string }
  }>, reply) => {
    const { queue } = request.params;
    const isLocal = request.query.local !== 'false'; // Default to true
    
    try {
      await resumeQueue(queue, isLocal);
      
      return reply.send({
        data: {
          queue,
          isPaused: false,
          local: isLocal,
          message: `Queue "${queue}" resumed ${isLocal ? 'locally' : 'globally'}`,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'QUEUE_NOT_FOUND',
              message: `Queue "${queue}" not found`
            }
          ]
        });
      }
      
      throw error;
    }
  });
}
