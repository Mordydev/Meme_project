/**
 * Compliance Module
 * 
 * Provides regulatory compliance features for the platform
 */
import { FastifyInstance } from 'fastify';
import { gdprRoutes } from './gdpr';
import { reportingRoutes } from './reporting';

/**
 * Register compliance routes with Fastify
 * 
 * @param fastify Fastify instance
 */
export async function compliancePlugin(fastify: FastifyInstance): Promise<void> {
  // Register GDPR routes
  fastify.register(async (instance) => {
    await instance.register(gdprRoutes, { prefix: '/api/v1/gdpr' });
  });
  
  // Register reporting routes
  fastify.register(async (instance) => {
    await instance.register(reportingRoutes, { prefix: '/api/v1/compliance/reporting' });
  });
  
  fastify.log.info('Compliance plugin registered');
}

// Export GDPR functionality
export * from './gdpr';

// Export reporting functionality
export * from './reporting';

// Default export
export default compliancePlugin;
