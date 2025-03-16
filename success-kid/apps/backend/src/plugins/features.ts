/**
 * Feature Flag Plugin
 * 
 * Registers the feature flag service and features as Fastify decorators
 */
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { RedisFeatureFlagService, FeatureFlagService } from '../features/service';
import { getRedisClient } from '../lib/db-client';
import { marketFeature } from '../features/market';

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
  
  // Register market data feature
  await fastify.register(marketFeature);
  
  // Log feature service initialization
  fastify.log.info('Feature flag service initialized');
});