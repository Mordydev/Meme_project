/**
 * Wallet Transactions Controller
 * 
 * Handles wallet transaction HTTP requests.
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { WalletTransactionService } from './service';
import { logger } from '../../lib/logger';
import { ValidationError } from '../../errors';
import { TransactionType, TransactionStatus } from '../../blockchain/types';

/**
 * Get wallet transactions request
 */
interface GetWalletTransactionsRequest {
  Params: {
    walletAddress: string;
  };
  Querystring: {
    limit?: string;
    offset?: string;
    type?: string;
    status?: string;
    token?: string;
    forceRefresh?: string;
  };
}

/**
 * Get transaction details request
 */
interface GetTransactionDetailsRequest {
  Params: {
    transactionHash: string;
  };
}

/**
 * Sync transactions request
 */
interface SyncTransactionsRequest {
  Params: {
    walletAddress: string;
  };
}

/**
 * Get user transactions request
 */
interface GetUserTransactionsRequest {
  Querystring: {
    limit?: string;
    offset?: string;
    forceRefresh?: string;
  };
}

/**
 * Wallet transactions controller
 */
export class WalletTransactionController {
  /**
   * Create wallet transactions controller
   * 
   * @param walletTransactionService Wallet transaction service
   */
  constructor(private readonly walletTransactionService: WalletTransactionService) {}

  /**
   * Get transactions for a wallet
   * 
   * @param request Get wallet transactions request
   * @param reply HTTP response
   */
  async getWalletTransactions(
    request: FastifyRequest<GetWalletTransactionsRequest>,
    reply: FastifyReply
  ) {
    try {
      const { walletAddress } = request.params;
      const {
        limit = '10',
        offset = '0',
        type,
        status,
        token,
        forceRefresh
      } = request.query;
      
      // Parse query parameters
      const options = {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        type: type as TransactionType | undefined,
        status: status as TransactionStatus | undefined,
        token
      };
      
      const transactions = await this.walletTransactionService.getWalletTransactions(
        walletAddress,
        options,
        forceRefresh === 'true'
      );
      
      return reply.code(200).send({
        data: transactions.data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        pagination: transactions.pagination
      });
    } catch (error) {
      logger.error('Error getting wallet transactions', {
        error: error instanceof Error ? error.message : String(error),
        requestId: request.id
      });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'Failed to get wallet transactions'
          }
        ]
      });
    }
  }

  /**
   * Get transaction details
   * 
   * @param request Get transaction details request
   * @param reply HTTP response
   */
  async getTransactionDetails(
    request: FastifyRequest<GetTransactionDetailsRequest>,
    reply: FastifyReply
  ) {
    try {
      const { transactionHash } = request.params;
      
      const transaction = await this.walletTransactionService.getTransaction(transactionHash);
      
      if (!transaction) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Transaction not found'
            }
          ]
        });
      }
      
      return reply.code(200).send({
        data: transaction,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting transaction details', {
        error: error instanceof Error ? error.message : String(error),
        requestId: request.id
      });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'Failed to get transaction details'
          }
        ]
      });
    }
  }

  /**
   * Sync transactions for a wallet
   * 
   * @param request Sync transactions request
   * @param reply HTTP response
   */
  async syncTransactions(
    request: FastifyRequest<SyncTransactionsRequest>,
    reply: FastifyReply
  ) {
    try {
      const { walletAddress } = request.params;
      
      const syncCount = await this.walletTransactionService.syncTransactions(walletAddress);
      
      return reply.code(200).send({
        data: {
          syncedTransactions: syncCount,
          walletAddress
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error syncing transactions', {
        error: error instanceof Error ? error.message : String(error),
        requestId: request.id
      });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'Failed to sync transactions'
          }
        ]
      });
    }
  }
}
