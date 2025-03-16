/**
 * Application Server Entry Point
 * 
 * Initializes and starts the Fastify server with graceful shutdown handling.
 */
import { FastifyInstance } from 'fastify';
import { buildApp } from './app';
import { env } from './config';
import { logger } from './lib/logger';
import { startScheduledJobs } from './jobs';

/**
 * Start the application server
 * 
 * @returns Fastify server instance
 */
export async function startServer(): Promise<FastifyInstance> {
  const app = await buildApp();
  
  const host = env.HOST;
  const port = env.PORT;

  try {
    // Listen on specified host and port
    await app.listen({ host, port });
    
    // Log server start
    const addr = app.server.address();
    const serverPort = typeof addr === 'string' ? addr : addr?.port;
    
    logger.info(`Server listening on http://${host}:${serverPort}`);
    logger.info(`API Documentation available at http://${host}:${serverPort}/documentation`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    
    // Start scheduled jobs
    startScheduledJobs();
    logger.info('Scheduled jobs started');
    
    // Setup graceful shutdown
    setupGracefulShutdown(app);
    
    return app;
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 * 
 * @param app Fastify server instance
 */
function setupGracefulShutdown(app: FastifyInstance): void {
  // Function to handle graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Close Fastify server - this triggers onClose hooks
      await app.close();
      logger.info('Server shutdown completed successfully');
      
      // Exit process with success code
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  };
  
  // Register signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (err) => {
    logger.fatal('Uncaught exception:', err);
    // Attempt to close gracefully, but force exit after 3 seconds
    setTimeout(() => {
      logger.fatal('Forcing exit due to uncaught exception');
      process.exit(1);
    }, 3000);
    
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal('Unhandled rejection at:', { promise, reason });
    // Log but don't exit for unhandled rejections
  });
}
