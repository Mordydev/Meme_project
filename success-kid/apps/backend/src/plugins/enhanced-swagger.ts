/**
 * Enhanced Swagger Documentation Plugin
 * 
 * Provides OpenAPI documentation with advanced features and configuration options.
 */
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { initializeDocumentation } from '../docs';
import registerDocsRoutes from '../docs/routes/docs';

/**
 * Enhanced Swagger plugin
 * 
 * @param fastify Fastify instance
 */
export default fp(async function enhancedSwaggerPlugin(fastify: FastifyInstance) {
  // Initialize API documentation
  await initializeDocumentation(fastify);
  
  // Register documentation-related routes
  await fastify.register(registerDocsRoutes);
  
  // Add redirection for convenience
  fastify.get('/docs', (_, reply) => {
    reply.redirect('/documentation');
  });
});
