import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../errors/app-error';
import { ErrorCode } from '../../../errors/error-codes';
import { RedemptionService } from '../../../services/points/redemption/redemption-service';

// Initialize redemption service
const redemptionService = new RedemptionService();

interface GetRedemptionHistoryQuery {
  limit?: string;
}

/**
 * Get user's redemption history
 * 
 * @route GET /api/v1/points/redemption/history
 */
export async function getRedemptionHistory(
  request: FastifyRequest<{ Querystring: GetRedemptionHistoryQuery }>,
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
            message: 'You must be logged in to view redemption history.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }

    // Parse limit
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

    // Get redemption history
    const redemptions = await redemptionService.getUserRedemptions(request.user.id, limit);

    // Format for response
    const formattedRedemptions = redemptions.map(redemption => ({
      id: redemption.id,
      pointsAmount: redemption.pointsAmount,
      tokenAmount: redemption.tokenAmount,
      transactionHash: redemption.transactionHash,
      status: redemption.status,
      createdAt: redemption.createdAt.toISOString(),
      processedAt: redemption.processedAt ? redemption.processedAt.toISOString() : undefined,
      failureReason: redemption.failureReason
    }));

    return reply.code(200).send({
      data: formattedRedemptions,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Failed to get redemption history', { error });

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
          message: 'An unexpected error occurred while fetching redemption history.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
