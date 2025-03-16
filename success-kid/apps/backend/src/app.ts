import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { logger } from './lib/logger';
import { handleApiError } from './errors';
import { env } from './config';
import { setupMonitoring } from './health/monitoring';
import { registerTransactionVerification } from './middleware/transaction-verification';
import swaggerPlugin from './plugins/swagger';
import marketPlugin from './plugins/market';
import achievementsPlugin from './plugins/achievements';
import websocketPlugin, { initializeWebSocketEvents } from './websockets';
import { getDatabase } from './database';
import { initializeWalletModule } from './wallet';

// API route imports
import healthRoutes from './api/health';
import featuresRoutes from './api/features';
import pointsRoutes from './api/points';
import contentRoutes from './api/content';
import mediaRoutes from './api/media';
import marketRoutes from './api/market';
import achievementRoutes from './api/achievements';
import registerAuth from './auth';

// Configuration for rate limiting
const rateLimitConfig = {
  max: 100, // Maximum 100 requests per windowMs
  timeWindow: '1 minute', // Window size
  allowList: ['127.0.0.1', 'localhost'], // IPs that bypass rate limiting
};

export async function buildApp(options = {}): Promise<FastifyInstance> {
  // Create Fastify instance with logging
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
        },
      } : undefined,
    },
    trustProxy: true, // Trust X-Forwarded-For header for client IP
    ...options,
  });

  // Register core plugins
  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });
  
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  });
  
  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET || 'this-should-be-a-secure-secret-in-production',
    parseOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      signed: true,
    }
  });
  
  await app.register(rateLimit, {
    max: rateLimitConfig.max,
    timeWindow: rateLimitConfig.timeWindow,
    allowList: rateLimitConfig.allowList,
  });

  // Register WebSocket support
  await app.register(websocketPlugin, {
    path: '/ws',
    auth: true, // Require authentication for WebSocket connections
  });

  // Register API documentation with Swagger
  await app.register(swaggerPlugin);

  // Register market plugin
  await app.register(marketPlugin);

  // Register achievements plugin
  await app.register(achievementsPlugin);

  // Register transaction verification middleware
  registerTransactionVerification(app);

  // Setup monitoring
  setupMonitoring(app);

  // Initialize wallet module
  const db = getDatabase().pool;
  initializeWalletModule({ db });

  // Register global error handler
  app.setErrorHandler((error, request, reply) => {
    return handleApiError(request, reply, error);
  });

  // Register API routes
  app.register(healthRoutes, { prefix: '/api/v1/health' });
  app.register(featuresRoutes, { prefix: '/api/v1/features' });
  app.register(pointsRoutes, { prefix: '/api/v1/points' });
  app.register(contentRoutes, { prefix: '/api/v1/content' });
  app.register(mediaRoutes, { prefix: '/api/v1/media' });
  app.register(marketRoutes, { prefix: '/api/v1/market' });
  app.register(achievementRoutes, { prefix: '/api/v1' });

  // Register authentication and user management
  await app.register(registerAuth);

  // Add a simple health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Add 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
      errors: [
        {
          code: 'RESOURCE_NOT_FOUND',
          message: `Route ${request.method}:${request.url} not found`,
        },
      ],
    });
  });

  // Initialize WebSocket event handlers for real-time notifications
  initializeWebSocketEvents();
  logger.info('WebSocket event handlers initialized');

  return app;
}

export default buildApp;
