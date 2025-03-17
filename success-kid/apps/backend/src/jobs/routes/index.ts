/**
 * Job Routes Index
 * 
 * Registers all job-related routes
 */
import { FastifyPluginAsync } from 'fastify';
import jobsRoutes from './jobs';
import schedulerRoutes from './scheduler';
import monitoringRoutes from './monitoring';
import historyRoutes from './history';

// Jobs API Routes
const jobsApiRoutes: FastifyPluginAsync = async (fastify) => {
  // Register jobs routes (jobs management)
  fastify.register(jobsRoutes, { prefix: '/api/v1' });
  
  // Register scheduler routes (scheduled jobs)
  fastify.register(schedulerRoutes, { prefix: '/api/v1' });
  
  // Register monitoring routes (job monitoring and alerts)
  fastify.register(monitoringRoutes, { prefix: '/api/v1' });
  
  // Register history routes (job history and analytics)
  fastify.register(historyRoutes, { prefix: '/api/v1' });
};

export default jobsApiRoutes;
