/**
 * Market Plugin
 * 
 * This plugin registers market services with Fastify.
 */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { initializeMarketServices } from '../market/init';
import { priceService } from '../market/price/service';
import { marketCapService } from '../market/marketcap/service';
import { transactionFeedService } from '../market/transactions/service';
import { milestoneService } from '../market/milestones/service';
import { visualizationService } from '../market/visualization/service';
import { marketDataCache } from '../market/common/cache-service';

/**
 * Market plugin implementation
 */
const marketPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register services in DI container
  fastify.decorate('priceService', priceService);
  fastify.decorate('marketCapService', marketCapService);
  fastify.decorate('transactionFeedService', transactionFeedService);
  fastify.decorate('milestoneService', milestoneService);
  fastify.decorate('visualizationService', visualizationService);
  fastify.decorate('marketDataCache', marketDataCache);
  
  // Initialize services
  await initializeMarketServices();
  
  // Add close hook to cleanup resources
  fastify.addHook('onClose', async (instance) => {
    // Stop automatic updates
    priceService.stopPriceUpdates('SKC');
    milestoneService.stopMilestoneChecking('SKC');
    transactionFeedService.stopTransactionUpdates('SKC');
  });
};

export default fp(marketPlugin, {
  name: 'market',
  dependencies: ['redis', 'config']
});
