import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { HealthService } from '../services/core/health-service';

/**
 * Plugin that registers the health monitoring service
 */
const healthPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Create health service
  const healthService = new HealthService(fastify);
  
  // Start monitoring (1 minute interval)
  healthService.startMonitoring(60000);
  
  // Register service with Fastify
  fastify.decorate('health', healthService);
  
  // Add shutdown hook
  fastify.addHook('onClose', async () => {
    healthService.stopMonitoring();
  });
  
  // Register health check endpoint
  fastify.get('/api/v1/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            details: {
              type: 'object',
              properties: {
                cpu: {
                  type: 'object',
                  properties: {
                    usage: { type: 'number' },
                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] }
                  }
                },
                memory: {
                  type: 'object',
                  properties: {
                    usage: { type: 'number' },
                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] }
                  }
                },
                services: {
                  type: 'object',
                  additionalProperties: true
                }
              }
            }
          }
        }
      }
    }
  }, async () => {
    return healthService.getSystemHealth();
  });
  
  // Register load factor endpoint (for internal use)
  fastify.get('/api/v1/health/load', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            load: { type: 'number' }
          }
        }
      }
    }
  }, async () => {
    const load = await healthService.getSystemLoad();
    return { load };
  });
  
  fastify.log.info('Health monitoring plugin registered');
};

export default fp(healthPlugin, {
  name: 'health-plugin',
  dependencies: ['metrics']
});
