import { FastifyInstance } from 'fastify';
import { 
  loginHandler,
  registerHandler,
  refreshTokenHandler as refreshSessionHandler,
  logoutHandler
} from './handlers';
// Import verification handlers from appropriate modules when implemented
// For now, using placeholders for verification-related handlers
const sendEmailVerificationHandler = async (request, reply) => reply.send({ success: true });
const verifyEmailHandler = async (request, reply) => reply.send({ success: true });
const sendPasswordResetHandler = async (request, reply) => reply.send({ success: true });
const resetPasswordHandler = async (request, reply) => reply.send({ success: true });
const sendAccountRecoveryHandler = async (request, reply) => reply.send({ success: true });
const generateRecoveryCodesHandler = async (request, reply) => reply.send({ success: true });
const verifyRecoveryCodeHandler = async (request, reply) => reply.send({ success: true });

// Define additional handlers needed
const validateTokenHandler = async (request, reply) => reply.send({ success: true });
const getSessionsHandler = async (request, reply) => reply.send({ data: [] });
const revokeSessionHandler = async (request, reply) => reply.send({ success: true });
const revokeAllSessionsHandler = async (request, reply) => reply.send({ success: true });
import { authMiddleware, requiresAdmin, requiresUser } from '../../middleware/clerk-auth-middleware';
import { rateLimit } from '../../middleware/rate-limit';
import { authSchemas } from './schema';

// Auth route registration
export default async function routes(fastify: FastifyInstance): Promise<void> {
  // Register schemas
  for (const schema of authSchemas) {
    fastify.addSchema(schema);
  }
  
  // Set up strict rate limiting for sensitive endpoints
  const authRateLimit = rateLimit({
    max: 10,
    timeWindow: '1 minute',
    errorMessage: 'Too many authentication attempts, please try again later'
  });
  
  const verificationRateLimit = rateLimit({
    max: 5,
    timeWindow: '1 minute',
    errorMessage: 'Too many verification attempts, please try again later'
  });
  
  // Authentication routes
  fastify.post(
    '/login',
    {
      schema: {
        body: { $ref: 'loginSchema' },
        response: {
          200: { $ref: 'loginResponseSchema' }
        }
      },
      preHandler: [authRateLimit]
    },
    loginHandler
  );
  
  fastify.post(
    '/token',
    {
      schema: {
        body: { $ref: 'tokenSchema' },
        response: {
          200: { $ref: 'tokenResponseSchema' }
        }
      },
      preHandler: [authRateLimit]
    },
    validateTokenHandler
  );
  
  fastify.post(
    '/logout',
    {
      preHandler: [authMiddleware()]
    },
    logoutHandler
  );
  
  fastify.post(
    '/refresh',
    {
      preHandler: [authMiddleware()]
    },
    refreshSessionHandler
  );
  
  // Session management routes
  fastify.get(
    '/sessions',
    {
      preHandler: [authMiddleware()],
      schema: {
        response: {
          200: { $ref: 'sessionsResponseSchema' }
        }
      }
    },
    getSessionsHandler
  );
  
  fastify.delete(
    '/sessions/:sessionId',
    {
      preHandler: [authMiddleware()],
      schema: {
        params: { $ref: 'sessionIdParamSchema' }
      }
    },
    revokeSessionHandler
  );
  
  fastify.delete(
    '/sessions',
    {
      preHandler: [authMiddleware()]
    },
    revokeAllSessionsHandler
  );
  
  // Verification routes
  fastify.post(
    '/verify-email/send',
    {
      preHandler: [authMiddleware(), verificationRateLimit],
      schema: {
        body: { $ref: 'emailSchema' }
      }
    },
    sendEmailVerificationHandler
  );
  
  fastify.get(
    '/verify-email/:token',
    {
      schema: {
        params: { $ref: 'tokenParamSchema' }
      }
    },
    verifyEmailHandler
  );
  
  fastify.post(
    '/password-reset/request',
    {
      preHandler: [verificationRateLimit],
      schema: {
        body: { $ref: 'emailSchema' }
      }
    },
    sendPasswordResetHandler
  );
  
  fastify.post(
    '/password-reset',
    {
      preHandler: [verificationRateLimit],
      schema: {
        body: { $ref: 'passwordResetSchema' }
      }
    },
    resetPasswordHandler
  );
  
  fastify.post(
    '/account-recovery',
    {
      preHandler: [verificationRateLimit],
      schema: {
        body: { $ref: 'emailSchema' }
      }
    },
    sendAccountRecoveryHandler
  );
  
  // Recovery codes
  fastify.post(
    '/recovery-codes/generate',
    {
      preHandler: [authMiddleware()],
      schema: {
        response: {
          200: { $ref: 'recoveryCodesResponseSchema' }
        }
      }
    },
    generateRecoveryCodesHandler
  );
  
  fastify.post(
    '/recovery-codes/verify',
    {
      preHandler: [verificationRateLimit],
      schema: {
        body: { $ref: 'recoveryCodeSchema' }
      }
    },
    verifyRecoveryCodeHandler
  );
  
  // Admin-only routes
  fastify.get(
    '/admin/users',
    {
      preHandler: [requiresAdmin]
    },
    async (request, reply) => {
      return { data: { message: 'Admin access only' } };
    }
  );
}
