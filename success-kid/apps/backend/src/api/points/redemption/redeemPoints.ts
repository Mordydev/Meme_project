import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../errors/app-error';
import { ErrorCode } from '../../../errors/error-codes';
import { RedemptionService } from '../../../services/points/redemption/redemption-service';

// Initialize redemption service
const redemptionService = new RedemptionService();

interface RedeemPointsRequest {
  data: {
    pointsAmount: number;
  };
}

/**
 * Redeem points for tokens
 * 
 * @route POST /api/v1/points/redemption
 */
export async function redeemPoints(
  request: FastifyRequest<{ Body: RedeemPointsRequest }>,
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
            message: 'You must be logged in to redeem points.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }

    const { pointsAmount } = request.body.data;

    // Validate input
    if (!pointsAmount || pointsAmount <= 0) {
      throw new AppError(
        'Points amount must be a positive number',
        ErrorCode.INVALID_INPUT,
        { field: 'pointsAmount' },
        400
      );
    }

    // Request redemption
    const redemption = await redemptionService.requestRedemption({
      userId: request.user.id,
      pointsAmount
    });

    logger.info('Points redemption request created', {
      userId: request.user.id,
      redemptionId: redemption.id,
      pointsAmount,
      tokenAmount: redemption.tokenAmount
    });

    return reply.code(200).send({
      data: {
        id: redemption.id,
        pointsAmount: redemption.pointsAmount,
        tokenAmount: redemption.tokenAmount,
        status: redemption.status,
        createdAt: redemption.createdAt.toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Failed to redeem points', { error });

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        data: null,
        errors: [
          {
            code: error.code,
            message: error.message,
            details: error.details
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }

    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred while processing redemption.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
