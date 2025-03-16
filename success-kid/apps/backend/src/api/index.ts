import { FastifyInstance } from 'fastify';

export default async function api(fastify: FastifyInstance): Promise<void> {
  // Register route modules
  fastify.register(import('./auth'), { prefix: '/auth' });
  fastify.register(import('./content'), { prefix: '/content' });
  fastify.register(import('./events'), { prefix: '/events' });
  fastify.register(import('./health'), { prefix: '/health' });
  fastify.register(import('./market'), { prefix: '/market' });
  fastify.register(import('./points'), { prefix: '/points' });
  fastify.register(import('./users'), { prefix: '/users' });
  fastify.register(import('./wallet'), { prefix: '/wallet' });
  
  // Register root routes
  fastify.get('/', async () => {
    return { message: 'Success Kid Community API v1' };
  });
}