import { FastifyInstance } from 'fastify';
import { buildApp } from './app';
import { closeConnections } from './lib/db-client';
import { env } from './config';

export async function startServer(): Promise<FastifyInstance> {
  const app = await buildApp();
  
  const host = env.HOST;
  const port = env.PORT;

  try {
    await app.listen({ host, port });
    app.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Starting graceful shutdown...');
    
    // Close database connections
    await closeConnections();
    app.log.info('Database connections closed');
    
    // Close server
    await app.close();
    app.log.info('Server shutdown complete');
    
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}