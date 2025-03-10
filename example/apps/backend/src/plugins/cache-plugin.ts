import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { CacheService } from '../services/core/cache-service';

/**
 * Plugin that registers the enhanced cache service
 */
const cachePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Create cache service
  const cacheService = new CacheService(fastify, 'cache:');
  
  // Register service with Fastify
  fastify.decorate('cache', cacheService);
  
  // Register cache control routes
  fastify.delete('/api/v1/cache/tag/:tag', {
    schema: {
      params: {
        type: 'object',
        properties: {
          tag: { type: 'string' }
        },
        required: ['tag']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            keysInvalidated: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { tag } = request.params as { tag: string };
    const keysInvalidated = await cacheService.invalidateByTag(tag);
    
    return {
      success: true,
      keysInvalidated
    };
  });
  
  fastify.log.info('Enhanced cache plugin registered');
};

export default fp(cachePlugin, {
  name: 'cache-plugin',
  dependencies: ['redis', 'metrics']
});
