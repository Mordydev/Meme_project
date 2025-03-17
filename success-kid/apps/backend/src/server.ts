import { FastifyInstance } from 'fastify';
import { buildApp } from './app';
import { closeConnections } from './lib/db-client';
import { env } from './config';
import { logger } from './lib/logger';
import { bullJobController } from './jobs';

export async function startServer(): Promise<FastifyInstance> {
  const app = await buildApp();
  
  const host = env.HOST;
  const port = env.PORT;

  try {
    await app.listen({ host, port });
    logger.info(`Server listening on http://${host}:${port}`);
    logger.info(`API Documentation available at http://${host}:${port}/documentation`);
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Stop background jobs
    await bullJobController.stop();
    logger.info('Background jobs stopped');
    
    // Close database connections
    await closeConnections();
    logger.info('Database connections closed');
    
    // Close server
    await app.close();
    logger.info('Server shutdown complete');
    
    process.exit(0);
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    shutdown('uncaughtException').catch((err) => {
      logger.error('Error during shutdown after uncaught exception:', err);
      process.exit(1);
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  });

  return app;
}

export default startServer;