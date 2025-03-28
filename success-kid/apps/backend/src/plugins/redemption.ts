/**
 * Redemption Plugin
 * 
 * Registers the redemption module with Fastify.
 */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { getRedemptionModule } from '../redemption';
import { getRedisClient } from '../lib/db-client';
import { getDbClient } from '../lib/db-client';
import { RedemptionRepository } from '../repositories/redemption-repository';
import { WalletRepository } from '../repositories/wallet-repository';
import { PointsService } from '../services/points/points-service';
import { eventBus } from '../lib/event-bus';
import { PointsRepository } from '../repositories/points-repository';
import { PointsVerifier } from '../services/points/verification/points-verifier';

/**
 * Redemption plugin for Fastify
 */
const redemptionPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get database client
  const dbClient = getDbClient();
  
  // Get Redis client
  const redisClient = getRedisClient();
  
  // Initialize dependencies
  const redemptionRepository = new RedemptionRepository(dbClient);
  const walletRepository = new WalletRepository(dbClient);
  const pointsRepository = new PointsRepository(dbClient);
  const pointsVerifier = new PointsVerifier();
  const pointsService = new PointsService(pointsRepository, eventBus, pointsVerifier);
  
  // Initialize redemption module
  const redemptionModule = getRedemptionModule(
    redemptionRepository,
    walletRepository,
    pointsService,
    eventBus,
    redisClient
  );
  
  // Register routes
  await redemptionModule.registerRoutes(fastify);
  
  // Decorate fastify instance with redemption module
  fastify.decorate('redemptionModule', redemptionModule);
};

export default fp(redemptionPlugin, {
  name: 'redemption',
  dependencies: ['db', 'redis', 'auth'],
});
