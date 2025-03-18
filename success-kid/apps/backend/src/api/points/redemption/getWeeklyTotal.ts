import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../errors/app-error';
import { ErrorCode } from '../../../errors/error-codes';

/**
 * Get user's weekly redemption total
 * 
 * @route GET /api/v1/points/redemption/weekly-total
 */
export async function getWeeklyTotal(
  request: FastifyRequest,
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
            message: 'You must be logged in to view weekly redemption total.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }

    // Calculate date range for current week (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Query redemption sum for the past week
    const redemptions = await request.server.db.redemptions.aggregate({
      where: {
        userId: request.user.id,
        createdAt: { gte: oneWeekAgo },
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] }
      },
      _sum: { pointsAmount: true }
    });

    const weeklyTotal = redemptions._sum.pointsAmount || 0;

    return reply.code(200).send({
      data: {
        weeklyTotal,
        period: {
          start: oneWeekAgo.toISOString(),
          end: new Date().toISOString()
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Failed to get weekly redemption total', { error });

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
          message: 'An unexpected error occurred while fetching weekly redemption total.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
