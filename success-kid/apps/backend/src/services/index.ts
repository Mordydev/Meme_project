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
// Removed import for old PointsService
import { EnhancedPointsService } from './points/points-service-enhanced';
import { PointsVerifier } from './points/verification/points-verifier';
import { RedemptionService } from './redemption/redemption-service';
import { WalletService } from './wallet/wallet-service';
import { BlockchainService } from './blockchain/blockchain-service';
import { ProfileService } from './profiles/profile-service';
import { AchievementService } from './achievements/achievement-service'; // Import new service
import { achievementRepository } from '../repositories/achievement-repository'; // Import its repository

// Create service instances
// Repositories extending BaseRepository likely don't need db passed in constructor
const pointsRepository = new PointsRepository(); 
const redemptionRepository = new RedemptionRepository(); 
const pointsVerifier = new PointsVerifier();

// Removed instantiation of legacy points service

// Export services with proper types
// TODO: Refactor WalletService and ProfileService to use Drizzle db instance or BaseRepository pattern instead of pg Pool
export const walletService = new WalletService(db as any, eventBus); // Pass db as any temporarily
export const blockchainService = new BlockchainService();
export const profileService = new ProfileService(db as any); // Pass db as any temporarily

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

// Achievement service
export const achievementService = new AchievementService(
  achievementRepository,
  eventBus,
  enhancedPointsService // Pass points service dependency
);

// Export other services
// Removed re-export of legacy points service
export * from './points/points-service-enhanced';
export * from './points/verification/points-verifier';
export * from './redemption/redemption-service';
export * from './wallet/wallet-service';
export * from './blockchain/blockchain-service';
export * from './profiles/profile-service';
export * from './achievements/achievement-service'; // Export new service
