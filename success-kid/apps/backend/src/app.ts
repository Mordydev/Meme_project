import Fastify, { FastifyInstance } from 'fastify';
import fastifyCompress from '@fastify/compress';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { logger } from './lib/logger';
import { handleApiError } from './errors';
import { env } from './config';
import { setupMonitoring } from './health/monitoring';
import { securityService } from './security/framework/service';
import { registerTransactionVerification } from './middleware/transaction-verification';
import { registerResponseFormatter } from './middleware/response-formatter';
import { registerErrorHandler } from './middleware/error-handler';
import { registerOpenApi } from './docs/openapi';
import enhancedSwaggerPlugin from './plugins/enhanced-swagger';
import marketPlugin from './plugins/market';
import achievementsPlugin from './plugins/achievements';
import jobsPlugin from './plugins/jobs';
import forumPlugin from './plugins/forum';
import websocketPlugin, { initializeWebSocketEvents } from './websockets';
import { getDatabase, schedulePerformanceMonitoring } from './database';
import { initializeWalletModule } from './wallet';
import { 
  createCacheMiddleware, 
  createContentCacheMiddleware, 
  createProfileCacheMiddleware,
  createLeaderboardCacheMiddleware,
  createMarketDataCacheMiddleware,
  warmCache 
} from './services/cache';

// API route imports
import healthRoutes from './api/health';
import featuresRoutes from './api/features';
import pointsRoutes from './api/points';
import contentRoutes from './api/content';
import mediaRoutes from './api/media';
import marketRoutes from './api/market';
import achievementRoutes from './api/achievements';
import securityRoutes from './api/security';
import complianceRoutes from './api/compliance';
import notificationRoutes from './api/notifications';
import activityRoutes from './api/activity';
import presenceRoutes from './api/presence';
import forumRoutes from './api/forum';
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
    // Performance optimizations
    disableRequestLogging: env.NODE_ENV === 'production', // Reduce overhead in production
    connectionTimeout: 30000, // 30s connection timeout
    keepAliveTimeout: 5000, // 5s keep-alive
    maxParamLength: 100, // Limit param length for security
    bodyLimit: 1048576, // 1MB body size limit
    ...options,
  });

  // Register compression for all responses - PERFORMANCE OPTIMIZATION
  await app.register(fastifyCompress, {
    encodings: ['gzip', 'deflate'],
    threshold: 1024, // Only compress responses > 1KB
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

  // Register API documentation
  await registerOpenApi(app);
  
  // For backward compatibility, still register the enhanced swagger plugin
  // but prefer the new registerOpenApi implementation
  await app.register(enhancedSwaggerPlugin);

  // Register market plugin
  await app.register(marketPlugin);

  // Register achievements plugin
  await app.register(achievementsPlugin);

  // Register jobs plugin
  await app.register(jobsPlugin);

  // Register forum plugin
  await app.register(forumPlugin);

  // Register standardized middleware
  registerResponseFormatter(app, {
    wrapAll: false, // Only wrap responses that aren't already in the standard format
    metaGenerator: (request) => ({
      // Add any additional metadata here
      path: request.url,
    })
  });
  
  registerTransactionVerification(app, {
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    expiry: 300, // 5 minutes
    headerName: 'X-Transaction-Id',
    excludeRoutes: ['/api/v1/health', '/docs', '/swagger'],
    namespace: 'transaction',
    debug: env.NODE_ENV !== 'production' // Enable debug logs in development
  });
  
  registerErrorHandler(app);

  // Setup monitoring
  setupMonitoring(app);

  // Initialize database monitoring
  const db = getDatabase().pool;
  // Schedule database performance monitoring every 5 minutes
  schedulePerformanceMonitoring(db, 300000);

  // Initialize wallet module
  initializeWalletModule({ db });

  // Initialize security service
  await securityService.initialize(app);

  // Add global response duration tracking - PERFORMANCE MONITORING
  app.addHook('onRequest', (request, reply, done) => {
    request.locals = { startTime: process.hrtime() };
    done();
  });

  app.addHook('onResponse', (request, reply, done) => {
    if (request.locals?.startTime) {
      const [seconds, nanoseconds] = process.hrtime(request.locals.startTime);
      const responseTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
      
      // Log slow responses (>200ms)
      if (responseTimeMs > 200) {
        logger.warn(`Slow response detected`, {
          method: request.method,
          url: request.url,
          responseTime: responseTimeMs,
          statusCode: reply.statusCode
        });
      } else {
        logger.debug(`Response time`, {
          method: request.method,
          url: request.url,
          responseTime: responseTimeMs,
          statusCode: reply.statusCode
        });
      }
      
      // Send response time as header if not in production
      if (env.NODE_ENV !== 'production') {
        reply.header('X-Response-Time', `${responseTimeMs.toFixed(2)}ms`);
      }
    }
    done();
  });

  // Register API routes with appropriate caching middleware
  app.register(healthRoutes, { prefix: '/api/v1/health' });
  
  app.register(featuresRoutes, { 
    prefix: '/api/v1/features',
    preHandler: createCacheMiddleware({ ttl: 3600 }) // 1 hour cache for features
  });
  
  app.register(pointsRoutes, { 
    prefix: '/api/v1/points'
    // No cache for points routes as they're frequently updated
  });
  
  app.register(contentRoutes, { 
    prefix: '/api/v1/content',
    preHandler: createContentCacheMiddleware(60) // 1 minute cache for content
  });
  
  app.register(mediaRoutes, { 
    prefix: '/api/v1/media',
    preHandler: createCacheMiddleware({ ttl: 86400 }) // 24 hours cache for media
  });
  
  app.register(marketRoutes, { 
    prefix: '/api/v1/market',
    preHandler: createMarketDataCacheMiddleware(30) // 30 seconds cache for market data
  });
  
  app.register(achievementRoutes, { 
    prefix: '/api/v1'
    // No cache for achievements as they're user-specific
  });
  
  app.register(notificationRoutes, { 
    prefix: '/api/v1/notifications'
    // No cache for notifications as they're user-specific and time-sensitive
  });
  
  app.register(activityRoutes, { 
    prefix: '/api/v1/activity',
    preHandler: createCacheMiddleware({ ttl: 60 }) // 1 minute cache for activity
  });
  
  app.register(presenceRoutes, { 
    prefix: '/api/v1/presence'
    // No cache for presence as it's real-time
  });
  
  app.register(securityRoutes, { 
    prefix: '/api/v1/security'
    // No cache for security routes
  });
  
  app.register(complianceRoutes, { 
    prefix: '/api/v1/compliance'
    // No cache for compliance routes
  });
  
  app.register(forumRoutes, { 
    prefix: '/api/v1/forum',
    preHandler: createCacheMiddleware({ ttl: 120 }) // 2 minutes cache for forum
  });

  // Register authentication and user management
  await app.register(registerAuth);

  // Add enhanced health check endpoint with performance metrics
  app.get('/health', async (request) => {
    const dbHealth = await getDatabase().checkHealth();
    
    return { 
      status: dbHealth.isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth.isHealthy ? 'ok' : 'error',
          connections: dbHealth.connections,
          responseTime: dbHealth.responseTime
        },
        api: {
          status: 'ok',
          uptime: process.uptime()
        }
      }
    };
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

  // Warm cache on startup - PERFORMANCE OPTIMIZATION
  app.addHook('onReady', async () => {
    try {
      await warmCache();
      logger.info('Cache warming completed');
    } catch (error) {
      logger.error('Failed to warm cache', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return app;
}

export default buildApp;
