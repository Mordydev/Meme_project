import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../lib/logger';
import { MarketDataService } from '../../../services/market/market-data-service';

// Initialize market data service
const marketDataService = new MarketDataService();

/**
 * Get market overview with price, volume, and other key metrics
 * 
 * @route GET /api/v1/market/overview
 */
export async function getMarketOverview(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get market data
    const marketData = await marketDataService.getMarketData();

    return reply.code(200).send({
      data: {
        price: marketData.price,
        priceChangePercent24h: marketData.priceChangePercent24h,
        volume24h: marketData.volume24h,
        volume7d: marketData.volume7d,
        marketCap: marketData.marketCap,
        liquidity: marketData.liquidity,
        holders: marketData.holders,
        trades24h: marketData.trades24h,
        allTimeHigh: marketData.allTimeHigh,
        timestamp: marketData.timestamp
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Failed to get market overview', { error });

    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred while fetching market overview.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
