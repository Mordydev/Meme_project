import Fastify, { FastifyInstance } from 'fastify';
import fastifyCompress from '@fastify/compress';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { logger } from './lib/logging/logger';
import { handleApiError, setupGlobalErrorHandlers } from './errors/handlers';
import { env } from './config';
import { monitoringService } from './monitoring/service';
import { setupMetrics } from './monitoring/metrics';
import { setupAlerts, defaultAlertRules } from './monitoring/alerts';
import { setupHealthChecks, createDatabaseHealthCheck, createRedisHealthCheck } from './monitoring/health';
import { setupErrorTracking } from './monitoring/error-tracking';
import { registerLoggingMiddleware } from './middleware/logging-middleware';
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
import { getRedisClient } from './lib/redis-client';
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
  // Set up global error handlers for uncaught exceptions and unhandled rejections
  setupGlobalErrorHandlers();
  
  // Create Fastify instance with logging
  const app = Fastify({
    logger: false, // Disable default Fastify logger, we'll use our own
    trustProxy: true, // Trust X-Forwarded-For header for client IP
    // Performance optimizations
    disableRequestLogging: true, // We'll use our own request logging middleware
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
    onRateLimit: (request, reply) => {
      // Log rate limit exceeded events
      logger.warn('Rate limit exceeded', {
        ip: request.ip,
        method: request.method,
        url: request.url,
      });
      
      monitoringService.recordMetric('ratelimit.exceeded', 1, {
        method: request.method,
        path: request.routerPath || 'unknown',
      });
    },
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

  // Register logging middleware (must come before other middleware)
  registerLoggingMiddleware(app);

  // Set up monitoring and observability
  const db = getDatabase().pool;
  const redis = getRedisClient();
  
  // Set up Prometheus metrics
  setupMetrics(app, {
    defaultLabels: {
      app: 'success-kid-api',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
    },
    enableDefaultMetrics: true,
  });
  
  // Set up health checks
  setupHealthChecks(app, {
    checks: [
      createDatabaseHealthCheck(db),
      createRedisHealthCheck(redis),
      // Other health checks can be added here
    ],
  });
  
  // Set up alerting
  setupAlerts(app, monitoringService, {
    initialRules: defaultAlertRules,
    checkIntervalMs: 15000, // Check alerts every 15 seconds
  });
  
  // Set up error tracking
  setupErrorTracking(app, {
    endpoint: '/admin/errors' // Admin-only endpoint for error tracking
  });

  // Register standardized middleware
  registerResponseFormatter(app, {
    wrapAll: false, // Only wrap responses that aren't already in the standard format
    metaGenerator: (request) => ({
      // Add any additional metadata here
      path: request.url,
      requestId: request.id,
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

  // Initialize database monitoring
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
      
      // Record metrics
      monitoringService.recordMetric('http.response_time', responseTimeMs, {
        method: request.method,
        route: request.routerPath || request.url,
        status: reply.statusCode.toString(),
      });
      
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
    hooks: {
      onRequest: [createCacheMiddleware({ ttl: 3600 })] // 1 hour cache for features
    }
  });
  
  app.register(pointsRoutes, { 
    prefix: '/api/v1/points'
    // No cache for points routes as they're frequently updated
  });
  
  app.register(contentRoutes, { 
    prefix: '/api/v1/content',
    hooks: {
      onRequest: [createContentCacheMiddleware(60)] // 1 minute cache for content
    }
  });
  
  app.register(mediaRoutes, { 
    prefix: '/api/v1/media',
    hooks: {
      onRequest: [createCacheMiddleware({ ttl: 86400 })] // 24 hours cache for media
    }
  });
  
  app.register(marketRoutes, { 
    prefix: '/api/v1/market',
    hooks: {
      onRequest: [createMarketDataCacheMiddleware(30)] // 30 seconds cache for market data
    }
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
    hooks: {
      onRequest: [createCacheMiddleware({ ttl: 60 })] // 1 minute cache for activity
    }
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
    hooks: {
      onRequest: [createCacheMiddleware({ ttl: 120 })] // 2 minutes cache for forum
    }
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
          responseTime: dbHealth.responseTimeMs
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
    // Record metric for 404 errors
    monitoringService.recordMetric('http.not_found', 1, {
      method: request.method,
      path: request.url,
    });
    
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
      
      // Record application start metric
      monitoringService.recordMetric('app.start', 1, { 
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      logger.error('Failed to warm cache', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return app;
}

export default buildApp;