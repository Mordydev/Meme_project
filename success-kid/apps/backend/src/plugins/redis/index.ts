/**
 * Redis Plugin for Fastify
 * 
 * Registers Redis connection with Fastify and provides
 * lifecycle management for Redis connections.
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import { redisConfig } from '../../config';
import { logger } from '../../lib/logger';

/**
 * Plugin to register Redis connection with Fastify
 */
export default fp(async function(fastify: FastifyInstance) {
  // Create Redis client
  const redis = new Redis(redisConfig.url, {
    ...redisConfig.options,
    keyPrefix: redisConfig.keyPrefix,
  });

  // Create separate pub/sub client for real-time communication
  const pubSub = redis.duplicate();

  // Handle connection events
  redis.on('connect', () => {
    fastify.log.info('Redis client connected');
  });

  pubSub.on('connect', () => {
    fastify.log.info('Redis PubSub client connected');
  });

  redis.on('error', (err) => {
    fastify.log.error('Redis client error', err);
  });

  pubSub.on('error', (err) => {
    fastify.log.error('Redis PubSub client error', err);
  });

  // Test Redis connection
  try {
    await redis.ping();
    fastify.log.info('Redis connection confirmed');
  } catch (err) {
    fastify.log.error('Failed to connect to Redis', err);
    throw err;
  }

  // Decorate Fastify instance with Redis clients
  fastify.decorate('redis', redis);
  fastify.decorate('pubSub', pubSub);

  // Add hook to close Redis connections on shutdown
  fastify.addHook('onClose', async (instance) => {
    fastify.log.info('Closing Redis connections');
    
    const closePromises = [
      instance.redis.quit().catch(err => {
        fastify.log.error('Error closing Redis connection', err);
      }),
      instance.pubSub.quit().catch(err => {
        fastify.log.error('Error closing Redis PubSub connection', err);
      }),
    ];
    
    await Promise.all(closePromises);
    fastify.log.info('Redis connections closed');
  });
}, {
  name: 'fastify-redis',
  dependencies: [],
});
