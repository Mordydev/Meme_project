/**
 * Market data feature plugin for Fastify
 */
import { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';

// Import services
import { CacheService } from './caching/cache-service';
import { ProviderManager } from './providers/provider-manager';
import { DexScreenerProvider } from './providers/dexscreener';
import { SolscanProvider } from './providers/solscan';
import { BirdeyeProvider } from './providers/birdeye';
import { PriceService } from './price/price-service';
import { MarketCapService } from './marketcap/marketcap-service';
import { TransactionService } from './transactions/transaction-service';
import { MilestoneService } from './milestones/milestone-service';
import { HistoricalDataService } from './historical/historical-service';
import { VisualizationService } from './visualization/visualization-service';

// Update Fastify type declarations
declare module 'fastify' {
  interface FastifyInstance {
    market: {
      cacheService: CacheService;
      providerManager: ProviderManager;
      priceService: PriceService;
      marketCapService: MarketCapService;
      transactionService: TransactionService;
      milestoneService: MilestoneService;
      historicalDataService: HistoricalDataService;
      visualizationService: VisualizationService;
    };
  }
}

/**
 * Market data plugin
 */
const marketFeature: FastifyPluginAsync = async (fastify) => {
  logger.info('Initializing market data feature');
  
  // Initialize cache service
  const cacheService = new CacheService(redis);
  
  // Initialize provider manager
  const providerManager = new ProviderManager(redis);
  
  // Initialize and register providers
  
  // DexScreener provider
  const dexScreenerProvider = new DexScreenerProvider({
    tokenAddress: {
      'SKC': process.env.SKC_TOKEN_ADDRESS || ''
    }
  });
  
  providerManager.registerProvider('price', dexScreenerProvider, {
    name: 'DexScreener',
    priority: 1, // Highest priority
    capabilities: ['currentPrice', 'priceChange', 'volume'],
    rateLimit: {
      requests: 60,
      period: 60 // 60 requests per minute
    },
    timeout: 5000 // 5 seconds
  });
  
  // Solscan provider
  const solscanProvider = new SolscanProvider({
    apiKey: process.env.SOLSCAN_API_KEY,
    tokenAddress: {
      'SKC': process.env.SKC_TOKEN_ADDRESS || ''
    }
  });
  
  providerManager.registerProvider('price', solscanProvider, {
    name: 'Solscan',
    priority: 2,
    capabilities: ['currentPrice', 'historicalPrices', 'transactions', 'tokenInfo'],
    rateLimit: {
      requests: 60,
      period: 60
    },
    timeout: 5000
  });
  
  providerManager.registerProvider('transaction', solscanProvider, {
    name: 'Solscan',
    priority: 1,
    capabilities: ['transactions', 'tokenInfo'],
    rateLimit: {
      requests: 60,
      period: 60
    },
    timeout: 5000
  });
  
  // Birdeye provider
  const birdeyeProvider = new BirdeyeProvider({
    apiKey: process.env.BIRDEYE_API_KEY,
    tokenAddress: {
      'SKC': process.env.SKC_TOKEN_ADDRESS || ''
    }
  });
  
  providerManager.registerProvider('price', birdeyeProvider, {
    name: 'Birdeye',
    priority: 3,
    capabilities: ['currentPrice', 'historicalPrices', 'transactions', 'tokenInfo', 'priceChange'],
    rateLimit: {
      requests: 60,
      period: 60
    },
    timeout: 5000
  });
  
  providerManager.registerProvider('transaction', birdeyeProvider, {
    name: 'Birdeye',
    priority: 2,
    capabilities: ['transactions', 'tokenInfo'],
    rateLimit: {
      requests: 60,
      period: 60
    },
    timeout: 5000
  });
  
  // Initialize services
  const priceService = new PriceService(providerManager, cacheService);
  
  const marketCapService = new MarketCapService(priceService, cacheService);
  
  const milestoneService = new MilestoneService(marketCapService, cacheService);
  
  const transactionService = new TransactionService(
    providerManager,
    cacheService,
    priceService
  );
  
  const historicalDataService = new HistoricalDataService(
    fastify.db.pool,
    cacheService,
    priceService,
    marketCapService
  );
  
  const visualizationService = new VisualizationService(
    priceService,
    marketCapService,
    milestoneService,
    transactionService,
    cacheService
  );
  
  // Create market container
  const market = {
    cacheService,
    providerManager,
    priceService,
    marketCapService,
    transactionService,
    milestoneService,
    historicalDataService,
    visualizationService
  };
  
  // Register market feature
  fastify.decorate('market', market);
  
  // Register health check
  fastify.get('/health/market', async (request, reply) => {
    try {
      // Check price service
      const price = await priceService.getCurrentPrice('SKC');
      
      // Check provider health
      const providerStats = providerManager.getProviderStats();
      
      return {
        status: 'healthy',
        price: price.priceUsd,
        providers: providerStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      request.log.error('Market health check failed', { error });
      
      return reply.code(503).send({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  logger.info('Market data feature initialized');
};

export default fastifyPlugin(marketFeature);
