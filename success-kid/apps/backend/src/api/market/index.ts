/**
 * Market data API routes
 */
import { FastifyPluginAsync } from 'fastify';

// Import route modules
import priceRoutes from './price';
import marketCapRoutes from './marketcap';
import transactionsRoutes from './transactions';
import milestonesRoutes from './milestones';
import chartsRoutes from './charts';

/**
 * Market API plugin
 */
const marketRoutes: FastifyPluginAsync = async (fastify) => {
  // Register route handlers
  fastify.register(priceRoutes, { prefix: '/price' });
  fastify.register(marketCapRoutes, { prefix: '/cap' });
  fastify.register(transactionsRoutes, { prefix: '/transactions' });
  fastify.register(milestonesRoutes, { prefix: '/milestones' });
  fastify.register(chartsRoutes, { prefix: '/charts' });

  // Root market endpoint - returns basic market data
  fastify.get('/', async (request, reply) => {
    const symbol = request.query.symbol || 'SKC';
    
    // Get current price
    const price = await fastify.market.priceService.getCurrentPrice(symbol);
    
    // Get current market cap
    const marketCap = await fastify.market.marketCapService.getMarketCap(symbol);
    
    return {
      data: {
        symbol,
        price: {
          value: price.priceUsd,
          change24h: price.priceChange24h,
          change7d: price.priceChange7d,
          lastUpdated: price.lastUpdated,
          source: price.source
        },
        marketCap: {
          value: marketCap.marketCap,
          fullyDiluted: marketCap.fullyDilutedMarketCap,
          circulatingSupply: marketCap.circulatingSupply,
          totalSupply: marketCap.totalSupply
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  });
};

export default marketRoutes;
