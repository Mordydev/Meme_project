/**
 * Jobs API Routes
 * 
 * Provides endpoints for managing background jobs.
 */
import { FastifyInstance } from 'fastify';
import queueRoutes from './queues';
import schedulerRoutes from './scheduler';
import monitoringRoutes from './monitoring';
import dependencyRoutes from './dependencies';
import workerRoutes from './workers';
import priorityRoutes from './priority';
import historyRoutes from './history';
import resourceRoutes from './resources';

/**
 * Register job management routes
 * 
 * @param fastify Fastify instance
 */
export default async function jobRoutes(fastify: FastifyInstance): Promise<void> {
  // Register sub-routes
  fastify.register(queueRoutes, { prefix: '/queues' });
  fastify.register(schedulerRoutes, { prefix: '/scheduler' });
  fastify.register(monitoringRoutes, { prefix: '/monitoring' });
  fastify.register(dependencyRoutes, { prefix: '/dependencies' });
  fastify.register(workerRoutes, { prefix: '/workers' });
  fastify.register(priorityRoutes, { prefix: '/priority' });
  fastify.register(historyRoutes, { prefix: '/history' });
  fastify.register(resourceRoutes, { prefix: '/resources' });
}
