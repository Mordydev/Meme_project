import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { createErrorHandler, createNotFoundHandler } from './errors/handlers';
import { runAllChecks, getVersionInfo } from './health';
import transactionVerification from './middleware/transaction-verification';
import swaggerPlugin from './plugins/swagger';
import featuresPlugin from './plugins/features';
import repositoriesPlugin from './plugins/repositories';
import servicesPlugin from './plugins/services';
import websocketsPlugin from './websockets';
import pointsRoutes from './api/points';
import contentRoutes from './api/content';
import mediaRoutes from './api/media';
import marketRoutes from './api/market';

export async function buildApp(options = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
        },
      },
    },
    trustProxy: true,
    ...options,
  });

  // Register core plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Register security headers
  await app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
  });

  // Register rate limiter
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    // Skip rate limiting for trusted IPs (e.g. internal services)
    skip: (request) => {
      const trustedProxies = (process.env.TRUSTED_PROXIES || '').split(',');
      return trustedProxies.includes(request.ip);
    },
  });

  // Register error handler
  app.setErrorHandler(createErrorHandler());
  app.setNotFoundHandler(createNotFoundHandler());

  // Register global hooks
  app.addHook('preHandler', transactionVerification);

  // Register Swagger
  await app.register(swaggerPlugin);

  // Register repositories plugin - must come before services
  await app.register(repositoriesPlugin);

  // Register features plugin
  await app.register(featuresPlugin);

  // Register services plugin
  await app.register(servicesPlugin);

  // Register WebSockets (if not testing)
  if (process.env.NODE_ENV !== 'test') {
    await app.register(websocketsPlugin);
  }

  // Health check routes
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.get('/health/detailed', async (request, reply) => {
    const checks = await runAllChecks();
    
    const status = Object.values(checks).every(
      check => check.status === 'healthy'
    ) ? 'healthy' : 'unhealthy';
    
    const statusCode = status === 'healthy' ? 200 : 503;
    
    const versionInfo = getVersionInfo();
    
    return reply.code(statusCode).send({
      status,
      checks,
      timestamp: new Date().toISOString(),
      version: versionInfo.version,
      environment: versionInfo.environment,
      uptime: process.uptime()
    });
  });

  // Register routes
  app.register(pointsRoutes, { prefix: '/api/v1' });
  app.register(contentRoutes, { prefix: '/api/v1/content' });
  app.register(mediaRoutes, { prefix: '/api/v1/media' });
  app.register(marketRoutes, { prefix: '/api/v1/market' });

  return app;
}

export default buildApp;