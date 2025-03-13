import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { errorHandler } from './middleware/error-handler';
import { getPgPool, getRedisClient, checkDatabaseHealth } from './lib/db-client';
import { env } from './config';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  });

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Register plugins
  await app.register(cors, {
    origin: env.CORS_ORIGIN || true,
    credentials: true,
  });

  // Register Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Success Kid Community API',
        description: 'API for the Success Kid Community Platform',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });
  
  await app.register(swaggerUi, {
    routePrefix: '/documentation',
  });

  // Initialize database connections
  app.addHook('onReady', async () => {
    // Initialize database connections on startup
    try {
      getPgPool();
      getRedisClient();
      app.log.info('Database connections initialized');
    } catch (error) {
      app.log.error('Failed to initialize database connections', error);
    }
  });

  // Register API routes
  await app.register(import('./api'), { prefix: '/api/v1' });

  // Register WebSocket plugin
  await app.register(import('./websockets'));

  // Enhanced health check route
  app.get('/health', async () => {
    const dbHealth = await checkDatabaseHealth();
    
    const status = dbHealth.postgres && dbHealth.redis ? 'healthy' : 'degraded';
    
    return { 
      status,
      timestamp: new Date().toISOString(),
      checks: {
        postgres: dbHealth.postgres ? 'connected' : 'disconnected',
        redis: dbHealth.redis ? 'connected' : 'disconnected'
      }
    };
  });

  return app;
}