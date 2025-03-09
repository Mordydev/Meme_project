import Fastify, { FastifyInstance, FastifyServerOptions, FastifyRequest } from 'fastify';
import { Server } from 'http';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { registerPlugins } from './plugins';
import { createServices } from './services/core/service-provider';
import registerRoutes from './api';
import { errorHandler } from './lib/errors';

/**
 * Build the Fastify app
 */
export async function build(opts: FastifyServerOptions = {}): Promise<{
  app: FastifyInstance;
  server: Server;
}> {
  const app = Fastify(opts);

  // Register plugins
  await app.register(cors, {
    origin: config.corsOrigins || ['http://localhost:3000'],
    credentials: true,
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.headers['x-forwarded-for'] || request.ip || 'unknown';
    },
    errorResponseBuilder: (request, context) => ({
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
    })
  });
  
  // Register application plugins (auth, database, etc.)
  await registerPlugins(app);

  // Set error handler
  app.setErrorHandler(errorHandler);

  // Initialize services
  const services = createServices(app);
  
  // Decorating fastify instance with services for route handlers to access
  app.decorate('services', services);
  
  // Add common services as direct decorators for easy access in routes
  app.decorate('walletService', services.walletService);
  app.decorate('blockchainService', services.blockchainService);
  app.decorate('tokenService', services.tokenService);
  app.decorate('walletRepository', services.repositories.walletRepository);
  
  // Add authenticate helper function
  app.decorate('authenticate', async (request: FastifyRequest) => {
    const { userId } = await app.auth.getAuth(request);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }
    return { userId };
  });
  
  // Define basic routes
  app.get('/', async () => {
    return { message: 'Wild \'n Out Meme Coin Platform API' };
  });

  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes
  await registerRoutes(app);
  
  // Create HTTP server from Fastify
  const server = app.server;
  
  return { app, server };
}
