/**
 * Feature Flag Plugin
 * 
 * Registers the feature flag service as a Fastify decorator
 */
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { RedisFeatureFlagService, FeatureFlagService } from '../features/service';
import { getRedisClient } from '../lib/db-client';

declare module 'fastify' {
  interface FastifyInstance {
    features: FeatureFlagService;
  }
}

export default fp(async function featuresPlugin(fastify: FastifyInstance) {
  // Get Redis client
  const redis = getRedisClient();
  
  // Create feature flag service
  const featureService = new RedisFeatureFlagService(redis);
  
  // Register feature service as decorator
  fastify.decorate('features', featureService);
  
  // Log feature service initialization
  fastify.log.info('Feature flag service initialized');
});