import { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import authPlugin from './auth';
import { config } from '../config';
import { logger } from '../lib/logger';
import { errorHandler } from '../lib/errors';

/**
 * Setup all plugins for Fastify
 */
export async function setupPlugins(fastify: FastifyInstance) {
  // Add request ID to each request
  fastify.addHook('onRequest', (request, reply, done) => {
    request.id = request.id || crypto.randomUUID();
    done();
  });
  
  // Setup CORS
  await fastify.register(fastifyCors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });
  
  // Setup Helmet for security headers
  await fastify.register(fastifyHelmet, {
    // Allow inline scripts for development
    contentSecurityPolicy: config.isDevelopment ? false : undefined,
  });
  
  // Setup rate limiting
  await fastify.register(fastifyRateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    // Generate keys based on IP or user if authenticated
    keyGenerator: (request) => {
      return request.headers['x-forwarded-for'] || 
             request.ip || 
             'unknown';
    },
    // Custom error response
    errorResponseBuilder: (request, context) => {
      return {
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many requests, please try again later',
          details: {
            limit: context.max,
            remaining: context.remaining,
            reset: new Date(Date.now() + context.ttl).toISOString()
          }
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString()
        }
      };
    }
  });
  
  // Setup API documentation with Swagger
  if (config.isDevelopment) {
    await fastify.register(fastifySwagger, {
      swagger: {
        info: {
          title: 'Wild \'n Out Meme Coin API',
          description: 'API for the Wild \'n Out Meme Coin Platform',
          version: '0.1.0'
        },
        host: `localhost:${config.port}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'battles', description: 'Battle management endpoints' },
          { name: 'content', description: 'Content management endpoints' },
          { name: 'users', description: 'User management endpoints' },
          { name: 'token', description: 'Token related endpoints' }
        ],
      }
    });
    
    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true
      }
    });
  }
  
  // Setup auth plugin
  await fastify.register(authPlugin);

  // Setup error handler
  fastify.setErrorHandler(errorHandler);
  
  // Log successful plugin setup
  logger.info('Plugins setup complete');
}
