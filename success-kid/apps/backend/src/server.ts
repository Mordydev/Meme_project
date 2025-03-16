import { FastifyInstance } from 'fastify';
import { buildApp } from './app';
import { closeConnections } from './lib/db-client';
import { env } from './config';
import { logger } from './lib/logger';
import { startRedemptionProcessor } from './jobs';

// Redemption processor handle for stopping
let redemptionProcessor: { stop: () => void } | null = null;

export async function startServer(): Promise<FastifyInstance> {
  const app = await buildApp();
  
  const host = env.HOST;
  const port = env.PORT;

  try {
    await app.listen({ host, port });
    logger.info(`Server listening on http://${host}:${port}`);
    logger.info(`API Documentation available at http://${host}:${port}/documentation`);
    
    // Start background processors
    if (process.env.NODE_ENV !== 'test') {
      redemptionProcessor = startRedemptionProcessor(
        60000, // Process redemptions every minute
        10     // Process up to 10 redemptions per batch
      );
    }
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Stop background processors
    if (redemptionProcessor) {
      redemptionProcessor.stop();
      logger.info('Redemption processor stopped');
    }
    
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