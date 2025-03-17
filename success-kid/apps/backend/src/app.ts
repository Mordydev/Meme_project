import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import securityPlugin from './security';
import compliancePlugin from './compliance';
import { createErrorHandler, createNotFoundHandler } from './errors/handlers';
import { runAllChecks, getVersionInfo } from './health';
import transactionVerification from './middleware/transaction-verification';
import repositoriesPlugin from './plugins/repositories';
import servicesPlugin from './plugins/services';
import jobsPlugin from './plugins/jobs';
import websocketsPlugin from './websockets';
import notificationServicesPlugin from './plugins/notification-services';
import apiPlugin from './api';
import { registerReferralAttributionHook } from './services/referrals/attribution-hook';
import { docsPlugin } from './docs';
import { monitoringPlugin } from './monitoring';
import { metricsMiddleware } from './monitoring/middleware';

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
  app.addHook('preHandler', metricsMiddleware);

  // Register API documentation
  await app.register(docsPlugin);

  // Register monitoring
  await app.register(monitoringPlugin);

  // Register repositories plugin - must come before services
  await app.register(repositoriesPlugin);

  // Register WebSockets (if not testing)
  if (process.env.NODE_ENV !== 'test') {
    await app.register(websocketsPlugin);
  }

  // Register services plugin
  await app.register(servicesPlugin);

  // Register jobs plugin
  if (process.env.NODE_ENV !== 'test') {
    await app.register(jobsPlugin);
  }

  // Register notification services plugin
  if (process.env.NODE_ENV !== 'test') {
    await app.register(notificationServicesPlugin);
  }

  // Register security plugin
  await app.register(securityPlugin);

  // Register compliance plugin
  await app.register(compliancePlugin);

  // Register all API routes
  await app.register(apiPlugin);
  
  // Register referral attribution hook
  registerReferralAttributionHook(app);

  return app;
}

export default buildApp;