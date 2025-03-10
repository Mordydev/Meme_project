import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { auth } from '@clerk/fastify';

/**
 * Schema for wallet status response
 */
const responseSchema = z.object({
  connected: z.boolean(),
  verified: z.boolean().optional(),
  walletAddress: z.string().optional(),
  displayAddress: z.string().optional(),
  holdings: z.object({
    tokenAmount: z.number().optional(),
    tier: z.string().optional(),
    lastCheckedAt: z.string().datetime().optional()
  }).optional(),
  benefits: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.enum(['active', 'inactive'])
  })).optional()
});

/**
 * Get wallet status
 */
export async function getWalletStatus(fastify: FastifyInstance) {
  fastify.get(
    '/status',
    {
      schema: {
        description: 'Get wallet connection status and token holdings',
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
        // Get wallet status
        const wallet = await fastify.walletService.getUserWallet(userId);
        
        if (!wallet) {
          return {
            connected: false
          };
        }
        
        // Get benefits if wallet is verified
        let benefits = null;
        if (wallet.verified) {
          const userBenefits = await fastify.tokenService.getUserBenefits(userId);
          benefits = userBenefits?.benefits || [];
        }
        
        // Get token holdings
        const holdings = await fastify.walletRepository.getUserTokenHoldings(userId);
        
        // Format wallet address for display
        const displayAddress = wallet.address
          ? `${wallet.address.substring(0, 4)}...${wallet.address.substring(wallet.address.length - 4)}`
          : null;
        
        return {
          connected: true,
          verified: wallet.verified,
          walletAddress: wallet.address,
          displayAddress,
          holdings: holdings ? {
            tokenAmount: holdings.tokenAmount,
            tier: holdings.tier,
            lastCheckedAt: holdings.lastCheckedAt.toISOString()
          } : undefined,
          benefits
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get wallet status');
        
        return reply.status(500).send({
          error: {
            code: 'status_error',
            message: 'Failed to get wallet status'
          }
        });
      }
    }
  );
}
