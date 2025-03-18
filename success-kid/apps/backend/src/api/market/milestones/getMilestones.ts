import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../lib/logger';
import { MarketDataService } from '../../../services/market/market-data-service';

// Initialize market data service
const marketDataService = new MarketDataService();

/**
 * Get market cap milestones with current status
 * 
 * @route GET /api/v1/market/milestones
 */
export async function getMilestones(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get milestone data
    const milestoneData = await marketDataService.getMilestoneData();

    return reply.code(200).send({
      data: milestoneData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Failed to get milestone data', { error });

    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred while fetching milestone data.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
