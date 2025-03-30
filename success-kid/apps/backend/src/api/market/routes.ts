import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { 
    getMarketStatsHandler, 
    getMarketPriceHistoryHandler, 
    getMarketMilestonesHandler, 
    getMarketTransactionsHandler 
} from './handler';
import { 
    MarketHistoryQuerySchema, 
    MarketTransactionsQuerySchema,
    GetMarketStatsResponseSchema,
    GetMarketPriceHistoryResponseSchema,
    GetMarketMilestonesResponseSchema,
    GetMarketTransactionsResponseSchema
} from './schema';
import { MarketHistoryQuery, MarketTransactionsQuery } from './types';
// Import auth middleware if needed for specific routes
// import { authMiddleware, authOptionalMiddleware } from '../../middleware/auth';

export default async function marketApiRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {

  // --- Market Overview ---
  fastify.get('/stats', {
    schema: {
      tags: ['Market'],
      description: 'Get current market statistics (price, change, market cap, etc.).',
      response: { 200: GetMarketStatsResponseSchema }
    }
    // No auth typically needed for public market stats
  }, getMarketStatsHandler);

  // Separate endpoint for price history might be useful for caching/scaling
  fastify.get<{ Querystring: MarketHistoryQuery }>('/price', {
    schema: {
      tags: ['Market'],
      description: 'Get historical price data for charts.',
      querystring: MarketHistoryQuerySchema,
      response: { 200: GetMarketPriceHistoryResponseSchema }
    }
    // No auth typically needed
  }, getMarketPriceHistoryHandler);

  // --- Milestones ---
  fastify.get('/milestones', {
    schema: {
      tags: ['Market'],
      description: 'Get market cap milestone progress.',
      response: { 200: GetMarketMilestonesResponseSchema }
    }
    // No auth typically needed
  }, getMarketMilestonesHandler);

  // --- Transaction Feed ---
  fastify.get<{ Querystring: MarketTransactionsQuery }>('/transactions', {
    schema: {
      tags: ['Market'],
      description: 'Get recent on-chain market transactions.',
      querystring: MarketTransactionsQuerySchema,
      response: { 200: GetMarketTransactionsResponseSchema }
    }
    // No auth typically needed
  }, getMarketTransactionsHandler);

}
