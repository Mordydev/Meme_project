/**
 * Jobs Plugin
 * 
 * Registers job processing services with the application
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { 
  bullJobController, 
  jobService, 
  retryService,
  jobHistoryService,
  priorityService,
  dependencyService,
  resourceService
} from '../jobs';
import { metricsService, alertService, dashboardService } from '../jobs/monitoring';

export default fp(async function (fastify: FastifyInstance) {
  // Initialize the job controller
  await bullJobController.initialize(fastify);
  
  // Register routes for job API
  bullJobController.registerRoutes(fastify);
  
  // Register job services in the dependency injection container
  fastify.decorate('jobService', jobService);
  fastify.decorate('retryService', retryService);
  fastify.decorate('jobHistoryService', jobHistoryService);
  fastify.decorate('metricsService', metricsService);
  fastify.decorate('alertService', alertService);
  fastify.decorate('dashboardService', dashboardService);
  fastify.decorate('priorityService', priorityService);
  fastify.decorate('dependencyService', dependencyService);
  fastify.decorate('resourceService', resourceService);
  fastify.decorate('jobController', bullJobController);
  
  // Add services to the DI container
  if (fastify.diContainer) {
    fastify.diContainer.register('jobService', jobService);
    fastify.diContainer.register('retryService', retryService);
    fastify.diContainer.register('jobHistoryService', jobHistoryService);
    fastify.diContainer.register('metricsService', metricsService);
    fastify.diContainer.register('alertService', alertService);
    fastify.diContainer.register('dashboardService', dashboardService);
    fastify.diContainer.register('priorityService', priorityService);
    fastify.diContainer.register('dependencyService', dependencyService);
    fastify.diContainer.register('resourceService', resourceService);
    fastify.diContainer.register('jobController', bullJobController);
  }
  
  // Handle server shutdown
  fastify.addHook('onClose', async () => {
    await bullJobController.stop();
  });
});
