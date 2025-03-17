/**
 * Health route schemas for API documentation
 */
import { FastifyInstance } from 'fastify';

/**
 * Register health route schemas
 */
export function healthRoutes(fastify: FastifyInstance): void {
  fastify.addSchema({
    $id: 'healthCheckResponse',
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['healthy', 'unhealthy', 'degraded'],
        description: 'Overall system health status',
      },
      checks: {
        type: 'object',
        properties: {
          database: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'unhealthy'],
              },
              details: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
          redis: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'unhealthy'],
              },
              details: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
          memory: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'unhealthy'],
              },
              details: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
          disk: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'unhealthy'],
              },
              details: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
          cpu: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'unhealthy'],
              },
              details: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'Health check timestamp',
      },
      version: {
        type: 'string',
        description: 'API version',
      },
      uptime: {
        type: 'number',
        description: 'Server uptime in seconds',
      },
    },
    required: ['status', 'checks', 'timestamp'],
  });
  
  // Basic health check
  fastify.addSchema({
    $id: 'basicHealthResponse',
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['healthy', 'degraded'],
        description: 'System health status',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'Check timestamp',
      },
      checks: {
        type: 'object',
        properties: {
          postgres: {
            type: 'string',
            enum: ['connected', 'disconnected'],
          },
          redis: {
            type: 'string',
            enum: ['connected', 'disconnected'],
          },
        },
      },
    },
    required: ['status', 'timestamp', 'checks'],
  });
}
