/**
 * Feature Flags API Module Entry Point
 *
 * Registers the feature flag routes.
 */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import featureFlagRoutes from './routes';

const featuresApiPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register routes with a suitable prefix, e.g., '/features'
  // Assuming admin checks are handled within the routes or via a global hook
  await fastify.register(featureFlagRoutes, { prefix: '/features' });
  fastify.log.info('Feature Flag API routes registered');
};

export default fp(featuresApiPlugin);
