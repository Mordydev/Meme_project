/**
 * Redemption Module
 * 
 * Main entry point for redemption functionality.
 */
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import { RedemptionService } from './services/redemption-service';
import { RedemptionEligibilityService } from './validation/eligibility-service';
import { TransactionService } from './transactions/transaction-service';
import { IdempotencyService } from './transactions/idempotency-service';
import { RedemptionProcessor } from './jobs/redemption-processor';
import { RedemptionController } from './controllers/redemption-controller';
import { RedemptionRepository } from '../repositories/redemption-repository';
import { WalletRepository } from '../repositories/wallet-repository';
import { PointsService } from '../services/points/points-service';
import { EventBus } from '../lib/event-bus';
import { logger } from '../lib/logger';
import { registerRedemptionRoutes } from './routes';

// Module singleton
let redemptionModule: RedemptionModule | null = null;

/**
 * Redemption module that manages all redemption-related services
 */
export class RedemptionModule {
  readonly redemptionService: RedemptionService;
  readonly eligibilityService: RedemptionEligibilityService;
  readonly transactionService: TransactionService;
  readonly idempotencyService: IdempotencyService;
  readonly redemptionProcessor: RedemptionProcessor;
  readonly redemptionController: RedemptionController;

  /**
   * Create a new RedemptionModule
   * 
   * @param redemptionRepository Repository for redemption data
   * @param walletRepository Repository for wallet data
   * @param pointsService Service for managing points
   * @param eventBus Event bus for publishing events
   * @param redis Redis client for caching and messaging
   */
  constructor(
    redemptionRepository: RedemptionRepository,
    walletRepository: WalletRepository,
    pointsService: PointsService,
    eventBus: EventBus,
    redis: Redis
  ) {
    // Initialize services
    this.idempotencyService = new IdempotencyService(redis);
    
    this.eligibilityService = new RedemptionEligibilityService(
      walletRepository,
      pointsService,
      redemptionRepository
    );
    
    this.transactionService = new TransactionService(
      redemptionRepository,
      eventBus,
      this.idempotencyService
    );
    
    this.redemptionService = new RedemptionService(
      redemptionRepository,
      pointsService,
      this.eligibilityService,
      this.transactionService,
      eventBus
    );
    
    // Initialize controller
    this.redemptionController = new RedemptionController(
      this.redemptionService
    );
    
    // Initialize processor if Redis is available
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redemptionProcessor = new RedemptionProcessor(
      this.transactionService,
      redemptionRepository,
      redisUrl
    );
    
    logger.info('Redemption module initialized');
  }

  /**
   * Register redemption routes with Fastify
   * 
   * @param fastify Fastify instance
   * @param prefix Route prefix
   */
  async registerRoutes(fastify: FastifyInstance, prefix: string = '/api/v1/redemption'): Promise<void> {
    // Register routes
    fastify.register(async (fastifyInstance) => {
      await registerRedemptionRoutes(fastifyInstance, this.redemptionController);
    }, { prefix });
    
    logger.info(`Redemption routes registered with prefix: ${prefix}`);
  }
}

/**
 * Get the redemption module singleton
 * 
 * @param redemptionRepository Repository for redemption data
 * @param walletRepository Repository for wallet data
 * @param pointsService Service for managing points
 * @param eventBus Event bus for publishing events
 * @param redis Redis client for caching and messaging
 * @returns Redemption module instance
 */
export function getRedemptionModule(
  redemptionRepository?: RedemptionRepository,
  walletRepository?: WalletRepository,
  pointsService?: PointsService,
  eventBus?: EventBus,
  redis?: Redis
): RedemptionModule {
  if (redemptionModule) {
    return redemptionModule;
  }
  
  if (!redemptionRepository || !walletRepository || !pointsService || !eventBus || !redis) {
    throw new Error('Required dependencies not provided for redemption module initialization');
  }
  
  redemptionModule = new RedemptionModule(
    redemptionRepository,
    walletRepository,
    pointsService,
    eventBus,
    redis
  );
  
  return redemptionModule;
}
