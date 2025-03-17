/**
 * Services Exports
 * 
 * Exports all application service instances
 */
import { db } from '../database';
import { redisClient } from '../lib/redis-client';
import { eventBus } from '../lib/event-bus';
import { PointsRepository } from '../repositories/points-repository';
import { RedemptionRepository } from '../repositories/redemption-repository';
import { PointsService } from './points/points-service';
import { EnhancedPointsService } from './points/points-service-enhanced';
import { PointsVerifier } from './points/verification/points-verifier';
import { RedemptionService } from './redemption/redemption-service';
import { WalletService } from './wallet/wallet-service';
import { BlockchainService } from './blockchain/blockchain-service';
import { ProfileService } from './profiles/profile-service';

// Create service instances
const pointsRepository = new PointsRepository(db);
const redemptionRepository = new RedemptionRepository(db);
const pointsVerifier = new PointsVerifier();

// Legacy points service
export const pointsService = new PointsService(
  pointsRepository,
  eventBus,
  pointsVerifier
);

// Export services with proper types
export const walletService = new WalletService(db, eventBus);
export const blockchainService = new BlockchainService();
export const profileService = new ProfileService(db);

// Enhanced points service with Redis-based cap tracking
export const enhancedPointsService = new EnhancedPointsService(
  pointsRepository,
  eventBus,
  pointsVerifier
);

// Redemption service
export const redemptionService = new RedemptionService(
  redemptionRepository,
  enhancedPointsService,
  walletService,
  blockchainService,
  eventBus
);

// Export other services
export * from './points/points-service';
export * from './points/points-service-enhanced';
export * from './points/verification/points-verifier';
export * from './redemption/redemption-service';
export * from './wallet/wallet-service';
export * from './blockchain/blockchain-service';
export * from './profiles/profile-service';
