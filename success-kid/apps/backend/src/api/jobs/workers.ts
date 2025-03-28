/**
 * Worker Management Routes
 * 
 * API endpoints for managing distributed workers.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  getActiveWorkers, 
  registerWorker, 
  deregisterWorker, 
  rebalanceWorkers, 
  getWorkerStats, 
  WorkerConfig 
} from '../../jobs/distributed';
import { logger } from '../../lib/logger';

/**
 * Register worker management routes
 * 
 * @param fastify Fastify instance
 */
export default async function workerRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Get all active workers
   */
  fastify.get('/', async (request, reply) => {
    try {
      const workers = await getActiveWorkers();
      
      return reply.send({
        data: workers,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting active workers', { error });
      throw error;
    }
  });
  
  /**
   * Register a new worker
   */
  fastify.post('/', async (request: FastifyRequest<{
    Body: WorkerConfig
  }>, reply) => {
    const config = request.body;
    
    try {
      const worker = await registerWorker(config);
      
      return reply.code(201).send({
        data: worker,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error registering worker', { error, config });
      throw error;
    }
  });
  
  /**
   * Get worker details
   */
  fastify.get('/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    const { id } = request.params;
    
    try {
      // Get all workers
      const workers = await getActiveWorkers();
      
      // Find the requested worker
      const worker = workers.find(w => w.id === id);
      
      if (!worker) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'WORKER_NOT_FOUND',
              message: `Worker "${id}" not found`
            }
          ]
        });
      }
      
      return reply.send({
        data: worker,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting worker details', { error, id });
      throw error;
    }
  });
  
  /**
   * Deregister a worker
   */
  fastify.delete('/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    const { id } = request.params;
    
    try {
      const result = await deregisterWorker(id);
      
      if (!result) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'WORKER_NOT_FOUND',
              message: `Worker "${id}" not found`
            }
          ]
        });
      }
      
      return reply.send({
        data: {
          id,
          message: 'Worker successfully deregistered',
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error deregistering worker', { error, id });
      throw error;
    }
  });
  
  /**
   * Get worker statistics
   */
  fastify.get('/:id/stats', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    const { id } = request.params;
    
    try {
      const stats = await getWorkerStats(id);
      
      if (!stats) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'WORKER_NOT_FOUND',
              message: `Worker "${id}" not found`
            }
          ]
        });
      }
      
      return reply.send({
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting worker stats', { error, id });
      throw error;
    }
  });
  
  /**
   * Rebalance workers
   */
  fastify.post('/rebalance', async (request, reply) => {
    try {
      const result = await rebalanceWorkers();
      
      return reply.send({
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error rebalancing workers', { error });
      throw error;
    }
  });
}
