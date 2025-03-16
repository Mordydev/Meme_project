import { FastifyInstance } from 'fastify';
import { 
  loginHandler, 
  registerHandler, 
  refreshTokenHandler, 
  logoutHandler,
  getCurrentUserHandler 
} from './handlers';
import { authMiddleware } from '../../middleware/auth';
import { authSchemas } from './schemas';

export default async function auth(fastify: FastifyInstance): Promise<void> {
  // Register JSON schemas
  for (const schema of authSchemas) {
    fastify.addSchema(schema);
  }

  // Register routes
  fastify.post('/login', { schema: { body: { $ref: 'loginRequestSchema' } } }, loginHandler);
  fastify.post('/register', { schema: { body: { $ref: 'registerRequestSchema' } } }, registerHandler);
  fastify.post('/refresh', refreshTokenHandler);
  fastify.post('/logout', logoutHandler);
  
  // Protected routes
  fastify.get('/me', { preHandler: authMiddleware }, getCurrentUserHandler);
}