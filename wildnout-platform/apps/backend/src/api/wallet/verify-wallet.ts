import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { auth } from '@clerk/fastify';

/**
 * Schema for verification request
 */
const requestSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  signature: z.string().min(32)
});

/**
 * Schema for response
 */
const responseSchema = z.object({
  userId: z.string(),
  walletAddress: z.string(),
  verified: z.boolean(),
  verifiedAt: z.string().datetime()
});

/**
 * Verify wallet ownership
 */
export async function verifyWallet(fastify: FastifyInstance) {
  fastify.post(
    '/verify',
    {
      schema: {
        description: 'Verify wallet ownership using signature',
        tags: ['wallet'],
        body: requestSchema.shape,
        response: {
          200: responseSchema.shape
        }
      },
      onRequest: [auth()]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Get authenticated user
      const { userId } = request.auth;
      
      if (!userId) {
        return reply.status(401).send({
          error: {
            code: 'unauthorized',
            message: 'Authentication required'
          }
        });
      }
      
      // Validate request body
      try {
        requestSchema.parse(request.body);
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: 'validation_error',
            message: 'Invalid request parameters',
            details: error
          }
        });
      }
      
      try {
        const { walletAddress, signature } = request.body as z.infer<typeof requestSchema>;
        
        // Verify wallet ownership
        const result = await fastify.walletService.verifyWallet(
          userId,
          walletAddress,
          signature
        );
        
        return {
          userId: result.userId,
          walletAddress: result.walletAddress,
          verified: result.verified,
          verifiedAt: result.verifiedAt.toISOString()
        };
      } catch (error) {
        request.log.error({ error }, 'Wallet verification failed');
        
        // Handle specific error types
        if (error.code === 'validation_error') {
          return reply.status(400).send({
            error: {
              code: error.code,
              message: error.message
            }
          });
        }
        
        return reply.status(500).send({
          error: {
            code: 'verification_failed',
            message: 'Wallet verification failed'
          }
        });
      }
    }
  );
}
