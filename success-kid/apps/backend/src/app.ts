import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import pointsRoutes from './api/points';
import swaggerPlugin from './plugins/swagger';

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
    ...options,
  });

  // Register plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Register Swagger
  await app.register(swaggerPlugin);

  // Register routes
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.register(pointsRoutes, { prefix: '/api/v1/points' });

  return app;
}

export default buildApp;
