/**
 * Wallet Balance Controller
 * 
 * Handles wallet balance HTTP requests.
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { WalletBalanceService } from './service';
import { logger } from '../../lib/logger';
import { ValidationError } from '../../errors';

/**
 * Get wallet balance request
 */
interface GetWalletBalanceRequest {
  Params: {
    walletAddress: string;
  };
  Querystring: {
    forceRefresh?: string;
  };
}

/**
 * Get user wallets balance request
 */
interface GetUserWalletsBalanceRequest {
  Querystring: {
    forceRefresh?: string;
  };
}

/**
 * Wallet balance controller
 */
export class WalletBalanceController {
  /**
   * Create wallet balance controller
   * 
   * @param walletBalanceService Wallet balance service
   */
  constructor(private readonly walletBalanceService: WalletBalanceService) {}

  /**
   * Get balance for a specific wallet
   * 
   * @param request Get wallet balance request
   * @param reply HTTP response
   */
  async getWalletBalance(
    request: FastifyRequest<GetWalletBalanceRequest>,
    reply: FastifyReply
  ) {
    try {
      const { walletAddress } = request.params;
      const forceRefresh = request.query.forceRefresh === 'true';
      
      const balance = await this.walletBalanceService.getWalletBalance(
        walletAddress,
        forceRefresh
      );
      
      return reply.code(200).send({
        data: balance,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting wallet balance', {
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
            message: 'Failed to get wallet balance'
          }
        ]
      });
    }
  }

  /**
   * Get balances for all of user's wallets
   * 
   * @param request Get user wallets balance request
   * @param reply HTTP response
   */
  async getUserWalletsBalance(
    request: FastifyRequest<GetUserWalletsBalanceRequest>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      const forceRefresh = request.query.forceRefresh === 'true';
      
      const balances = await this.walletBalanceService.getUserWalletBalances(
        userId,
        forceRefresh
      );
      
      return reply.code(200).send({
        data: balances,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting user wallets balance', {
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
            message: 'Failed to get user wallets balance'
          }
        ]
      });
    }
  }

  /**
   * Get balance for user's primary wallet
   * 
   * @param request HTTP request
   * @param reply HTTP response
   */
  async getPrimaryWalletBalance(
    request: FastifyRequest<GetUserWalletsBalanceRequest>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      const forceRefresh = request.query.forceRefresh === 'true';
      
      const balance = await this.walletBalanceService.getUserPrimaryWalletBalance(
        userId,
        forceRefresh
      );
      
      if (!balance) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'RESOURCE_NOT_FOUND',
              message: 'No primary wallet found for user'
            }
          ]
        });
      }
      
      return reply.code(200).send({
        data: balance,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting primary wallet balance', {
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
            message: 'Failed to get primary wallet balance'
          }
        ]
      });
    }
  }
}
