import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../lib/logger';
import { TransactionService } from '../../../services/market/transaction-service';

// Initialize transaction service
const transactionService = new TransactionService();

interface GetTransactionsQuery {
  limit?: string;
}

/**
 * Get recent market transactions
 * 
 * @route GET /api/v1/market/transactions
 */
export async function getTransactions(
  request: FastifyRequest<{ Querystring: GetTransactionsQuery }>,
  reply: FastifyReply
) {
  try {
    // Parse limit
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;

    // Get recent transactions
    const transactions = await transactionService.getRecentTransactions(limit);

    // Format for response
    const formattedTransactions = transactions.map(tx => ({
      hash: tx.hash,
      type: tx.type,
      amount: tx.amount,
      timestamp: tx.timestamp,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      status: tx.status,
      usdValue: tx.usdValue
    }));

    return reply.code(200).send({
      data: formattedTransactions,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Failed to get transactions', { error });

    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred while fetching transactions.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
