import { FastifyInstance } from 'fastify';
import { loginHandler, registerHandler, refreshTokenHandler, logoutHandler } from './handlers';
import { authSchemas } from './schemas';

export default async function auth(fastify: FastifyInstance): Promise<void> {
  // Register JSON schemas
  for (const schema of authSchemas) {
    fastify.addSchema(schema);
  }

  // Register routes
  fastify.post('/login', { schema: { body: { $ref: 'loginRequestSchema' } } }, loginHandler);
  fastify.post('/register', registerHandler);
  fastify.post('/refresh', refreshTokenHandler);
  fastify.post('/logout', logoutHandler);
}