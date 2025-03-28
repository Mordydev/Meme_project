/**
 * Redemption Controller
 * 
 * Handles HTTP requests for redemption operations.
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { RedemptionService } from '../services/redemption-service';
import { logger } from '../../lib/logger';
import { 
  ValidationError, 
  NotFoundError, 
  InsufficientPointsError, 
  RateLimitExceededError 
} from '../../errors';
import { 
  RedemptionStatus, 
  RedemptionFilterOptions
} from '../../models/entities/redemption.model';

/**
 * Interface for redemption request body
 */
interface RedemptionRequest {
  Body: {
    pointsAmount: number;
    walletAddress: string;
    referenceId?: string;
  };
}

/**
 * Interface for redemption cancellation request
 */
interface CancelRedemptionRequest {
  Params: {
    id: string;
  };
}

/**
 * Interface for get redemption request
 */
interface GetRedemptionRequest {
  Params: {
    id: string;
  };
}

/**
 * Interface for user redemptions request
 */
interface GetUserRedemptionsRequest {
  Querystring: {
    page?: number;
    limit?: number;
  };
}

/**
 * Handler for redemption API endpoints
 */
export class RedemptionController {
  /**
   * Create a new RedemptionController
   * 
   * @param redemptionService Redemption service
   */
  constructor(private readonly redemptionService: RedemptionService) {}

  /**
   * Create a redemption request
   * 
   * @param request HTTP request
   * @param reply HTTP response
   */
  async createRedemption(
    request: FastifyRequest<RedemptionRequest>,
    reply: FastifyReply
  ) {
    try {
      const { pointsAmount, walletAddress, referenceId } = request.body;
      const userId = request.user.id;
      
      // Validate request
      if (!pointsAmount || !walletAddress) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: 'Points amount and wallet address are required'
            }
          ]
        });
      }
      
      // Create redemption
      const result = await this.redemptionService.createRedemption({
        user_id: userId,
        points_amount: pointsAmount,
        wallet_address: walletAddress,
        reference_id: referenceId
      });
      
      logger.info('Redemption created', {
        userId,
        redemptionId: result.redemption.id,
        pointsAmount,
        tokenAmount: result.redemption.token_amount
      });
      
      return reply.code(201).send({
        data: {
          id: result.redemption.id,
          pointsAmount: result.redemption.points_amount,
          tokenAmount: result.redemption.token_amount,
          walletAddress: result.redemption.wallet_address,
          status: result.redemption.status,
          createdAt: result.redemption.created_at
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error creating redemption', {
        userId: request.user.id,
        body: request.body,
        error
      });
      
      if (error instanceof ValidationError) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: error.message
            }
          ]
        });
      }
      
      if (error instanceof InsufficientPointsError) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'INSUFFICIENT_POINTS',
              message: error.message
            }
          ]
        });
      }
      
      if (error instanceof RateLimitExceededError) {
        return reply.code(429).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'RATE_LIMIT_EXCEEDED',
              message: error.message
            }
          ]
        });
      }
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'An error occurred while processing the redemption request'
          }
        ]
      });
    }
  }

  /**
   * Get redemption eligibility
   * 
   * @param request HTTP request
   * @param reply HTTP response
   */
  async getEligibility(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      
      const eligibility = await this.redemptionService.checkEligibility(userId);
      
      return reply.code(200).send({
        data: eligibility,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error checking eligibility', {
        userId: request.user.id,
        error
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
            message: 'An error occurred while checking eligibility'
          }
        ]
      });
    }
  }

  /**
   * Get redemption by ID
   * 
   * @param request HTTP request
   * @param reply HTTP response
   */
  async getRedemption(
    request: FastifyRequest<GetRedemptionRequest>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      
      const redemption = await this.redemptionService.getRedemptionById(id);
      
      // Check ownership
      if (redemption.user_id !== userId) {
        return reply.code(403).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'FORBIDDEN',
              message: 'You do not have permission to view this redemption'
            }
          ]
        });
      }
      
      return reply.code(200).send({
        data: {
          id: redemption.id,
          pointsAmount: redemption.points_amount,
          tokenAmount: redemption.token_amount,
          walletAddress: redemption.wallet_address,
          status: redemption.status,
          transactionHash: redemption.transaction_hash,
          createdAt: redemption.created_at,
          processedAt: redemption.processed_at,
          completedAt: redemption.completed_at,
          error: redemption.error
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting redemption', {
        redemptionId: request.params.id,
        userId: request.user.id,
        error
      });
      
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Redemption not found'
            }
          ]
        });
      }
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'An error occurred while retrieving the redemption'
          }
        ]
      });
    }
  }

  /**
   * Get user redemptions
   * 
   * @param request HTTP request
   * @param reply HTTP response
   */
  async getUserRedemptions(
    request: FastifyRequest<GetUserRedemptionsRequest>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      const { page = 1, limit = 20 } = request.query;
      
      const result = await this.redemptionService.getUserRedemptions(
        userId,
        page,
        limit
      );
      
      return reply.code(200).send({
        data: result.data.map(redemption => ({
          id: redemption.id,
          pointsAmount: redemption.points_amount,
          tokenAmount: redemption.token_amount,
          walletAddress: redemption.wallet_address,
          status: redemption.status,
          transactionHash: redemption.transaction_hash,
          createdAt: redemption.created_at,
          processedAt: redemption.processed_at,
          completedAt: redemption.completed_at,
          error: redemption.error
        })),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error getting user redemptions', {
        userId: request.user.id,
        error
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
            message: 'An error occurred while retrieving redemptions'
          }
        ]
      });
    }
  }

  /**
   * Cancel redemption
   * 
   * @param request HTTP request
   * @param reply HTTP response
   */
  async cancelRedemption(
    request: FastifyRequest<CancelRedemptionRequest>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      
      const result = await this.redemptionService.cancelRedemption(id, userId);
      
      logger.info('Redemption cancelled', {
        redemptionId: id,
        userId
      });
      
      return reply.code(200).send({
        data: {
          id: result.redemption.id,
          status: result.redemption.status,
          message: result.message || 'Redemption cancelled successfully'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error cancelling redemption', {
        redemptionId: request.params.id,
        userId: request.user.id,
        error
      });
      
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Redemption not found'
            }
          ]
        });
      }
      
      if (error instanceof ValidationError) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: error.message
            }
          ]
        });
      }
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'An error occurred while cancelling the redemption'
          }
        ]
      });
    }
  }

  /**
   * Get conversion rate
   * 
   * @param request HTTP request
   * @param reply HTTP response
   */
  async getConversionRate(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const rate = this.redemptionService.getConversionRate();
      const limits = this.redemptionService.getRedemptionLimits();
      
      return reply.code(200).send({
        data: {
          conversionRate: rate,
          pointsToToken: `${rate} SP = 1 SKC`,
          limits: {
            minimum: limits.minimum,
            weekly: limits.weekly
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting conversion rate', { error });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'An error occurred while retrieving conversion rate'
          }
        ]
      });
    }
  }
}
