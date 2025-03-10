import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { auth } from '@clerk/fastify';

/**
 * Schema for response
 */
const responseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

/**
 * Disconnect wallet
 */
export async function disconnectWallet(fastify: FastifyInstance) {
  fastify.post(
    '/disconnect',
    {
      schema: {
        description: 'Disconnect a wallet from user account',
        tags: ['wallet'],
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
      
      try {
        // Disconnect wallet
        await fastify.walletService.disconnectWallet(userId);
        
        return {
          success: true,
          message: 'Wallet disconnected successfully'
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to disconnect wallet');
        
        // Handle specific error types
        if (error.code === 'not_found') {
          return reply.status(404).send({
            error: {
              code: 'wallet_not_found',
              message: 'No wallet found for this user'
            }
          });
        }
        
        return reply.status(500).send({
          error: {
            code: 'disconnect_error',
            message: 'Failed to disconnect wallet'
          }
        });
      }
    }
  );
}
