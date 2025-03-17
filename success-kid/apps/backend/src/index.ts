/**
 * Success Kid Community Platform Main Entry Point
 * 
 * Initializes and starts the backend server with all required plugins and services
 */
import Fastify from 'fastify';
import { config } from './config';
import { logger } from './lib/logger';
import { redis } from './lib/redis';
import { EnhancedEventBus } from './lib/enhanced-event-bus';
import enhancedWebsocketPlugin from './websockets/plugin';
import apiRoutes from './api';
import { getJwtService } from './auth/jwt';
import { getPresenceService } from './services/presence';
import { getDbClient } from './lib/db-client';

// Initialize event bus and services
const eventBus = new EnhancedEventBus(redis);

// Create an event handler for application shutdown
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await app.close();
    logger.info('Server stopped');
    
    // Close event bus
    await eventBus.shutdown();
    logger.info('Event bus closed');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

// Create Fastify instance
const app = Fastify({
  logger: config.logging.fastify ? logger : false,
  trustProxy: config.server.trustProxy,
  maxParamLength: 200,
  ignoreTrailingSlash: true,
  connectionTimeout: 60000, // 60s
});

// Register plugins and routes
const startServer = async () => {
  try {
    // Register global hooks
    app.addHook('onRequest', (request, reply, done) => {
      request.id = request.id || `req_${Date.now()}`;
      done();
    });
    
    // Register enhanced WebSocket plugin
    await app.register(enhancedWebsocketPlugin, {
      serviceId: `instance-${Math.random().toString(36).substring(2, 10)}`,
      enablePresence: true,
      serviceOptions: {
        maxPayload: 1048576, // 1MB
        pingInterval: 30000, // 30 seconds
        pingTimeout: 10000, // 10 seconds
        maxConnectionsPerUser: 5,
        path: '/ws'
      }
    });
    
    // Register API routes
    await app.register(apiRoutes, { prefix: '/api/v1' });
    
    // Define a health check route
    app.get('/health', async (request, reply) => {
      // Check connections to essential services
      const healthChecks = {
        database: true,
        redis: true,
        server: true
      };
      
      try {
        // Check database
        const db = getDbClient();
        await db.query('SELECT 1');
      } catch (error) {
        healthChecks.database = false;
        logger.error('Database health check failed', { error });
      }
      
      try {
        // Check Redis
        await redis.ping();
      } catch (error) {
        healthChecks.redis = false;
        logger.error('Redis health check failed', { error });
      }
      
      const isHealthy = Object.values(healthChecks).every(Boolean);
      
      return reply.code(isHealthy ? 200 : 503).send({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: healthChecks
      });
    });
    
    // Set up graceful shutdown
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    
    // Start the server
    await app.listen({
      port: config.server.port,
      host: config.server.host
    });
    
    logger.info(`Server started at http://${config.server.host}:${config.server.port}`);
    
    // Log server information
    const serverInfo = {
      environment: config.environment,
      nodeVersion: process.version,
      port: config.server.port,
      routes: app.printRoutes(),
      features: {
        websockets: true,
        redis: true,
        database: true
      }
    };
    
    logger.info('Server information', serverInfo);
  } catch (error) {
    logger.error('Error starting server', { error });
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

// Export for testing
export { app, startServer };
