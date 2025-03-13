import { FastifyRequest, FastifyReply } from 'fastify';

interface TransactionQueryParams {
  Querystring: {
    limit?: string;
    offset?: string;
  }
}

/**
 * Get wallet transactions for the authenticated user
 * 
 * @route GET /api/v1/wallet/transactions
 */
export async function getTransactions(
  request: FastifyRequest<TransactionQueryParams>,
  reply: FastifyReply
) {
  try {
    // Ensure user is authenticated
    if (!request.user) {
      return reply.code(401).send({
        data: null,
        errors: [
          {
            code: 'UNAUTHENTICATED',
            message: 'You must be logged in to access transaction data.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Get wallet address from user data
    const user = await request.server.db.users.findUnique({
      where: { id: request.user.id },
      select: {
        walletAddress: true,
        walletVerified: true
      }
    });
    
    if (!user.walletAddress || !user.walletVerified) {
      return reply.code(404).send({
        data: null,
        errors: [
          {
            code: 'WALLET_NOT_CONNECTED',
            message: 'No wallet is connected to your account.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Process pagination parameters
    const limit = parseInt(request.query.limit || '10', 10);
    const offset = parseInt(request.query.offset || '0', 10);
    
    // In a real implementation, we would fetch transactions from blockchain API
    // For now, use mock data
    const mockTransactions = [
      {
        hash: '3xR7vKpC4WjXKDBSEedrGQNaqzQXfZJnRGpSKQLxmLPGbpQ4AZ8QJTkVMBQpnqoK1bHUGEWjvYKGNMoFRZtPrw5d',
        type: 'in',
        amount: 250.5,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fromAddress: 'marketplace.solana',
        status: 'confirmed'
      },
      {
        hash: '4qL9pWzD6RbJKFGvTfQnAZ5uXr3vNP5BnmKRwxJVdYtP8DgSJs2ZARXLKJe1RYqHnVhymgrD76iucN2N6xFUymAP',
        type: 'out',
        amount: 100,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        toAddress: 'DEXaddr.solana',
        status: 'confirmed'
      },
      {
        hash: '5uZPWjx8QdMnrHYs9kGVtRzKEfB2jLoTYnM7v3CwJa1XmDbp6K4FgN2SvEpDLqRyX7TzA8HbV9uUxC5K1NvWnP8C',
        type: 'in',
        amount: 500,
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        fromAddress: 'rewards.program',
        status: 'confirmed'
      }
    ];
    
    // Apply pagination
    const paginatedTransactions = mockTransactions.slice(offset, offset + limit);
    
    return reply.code(200).send({
      data: {
        transactions: paginatedTransactions,
        pagination: {
          total: mockTransactions.length,
          limit,
          offset
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error fetching wallet transactions:', error);
    
    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'Could not fetch wallet transactions. Please try again.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
