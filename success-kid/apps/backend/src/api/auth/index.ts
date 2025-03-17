import { FastifyInstance } from 'fastify';
import { 
  loginHandler, 
  registerHandler, 
  refreshTokenHandler, 
  logoutHandler,
  getCurrentUserHandler,
  sendVerificationEmailHandler,
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordHandler
} from './handlers';
import {
  walletAuthHandler,
  getSigningMessageHandler
} from './wallet-auth';
import { getAuthStatusHandler } from './status-handler';
import { authMiddleware } from '../../middleware/auth';
import { authSchemas } from './schemas';

export default async function auth(fastify: FastifyInstance): Promise<void> {
  // Register JSON schemas
  for (const schema of authSchemas) {
    fastify.addSchema(schema);
  }

  // Standard auth routes
  fastify.post('/login', { schema: { body: { $ref: 'loginRequestSchema' } } }, loginHandler);
  fastify.post('/register', { schema: { body: { $ref: 'registerRequestSchema' } } }, registerHandler);
  fastify.post('/refresh', refreshTokenHandler);
  fastify.post('/logout', logoutHandler);
  
  // Wallet authentication routes
  fastify.post('/wallet', walletAuthHandler);
  fastify.get('/wallet/message', getSigningMessageHandler);
  
  // Email verification and password reset
  fastify.post('/verify-email', { preHandler: authMiddleware }, sendVerificationEmailHandler);
  fastify.get('/verify-email/:token', verifyEmailHandler);
  fastify.post('/forgot-password', forgotPasswordHandler);
  fastify.post('/reset-password', resetPasswordHandler);
  
  // Authentication status - does not require auth
  fastify.get('/status', getAuthStatusHandler);
  
  // Protected user info route
  fastify.get('/me', { preHandler: authMiddleware }, getCurrentUserHandler);
}