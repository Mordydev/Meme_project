/**
 * Points Service Module
 * 
 * Exports the PointsService and related components
 */
import { getPgPool } from '../../lib/db-client';
import { eventBus } from '../../lib/event-bus';
import { PointsRepository } from '../../repositories/points-repository';
import { PointsService } from './points-service';
import { PointsVerifier } from './verification/points-verifier';

// Create dependencies
const pointsRepository = new PointsRepository(getPgPool());
const pointsVerifier = new PointsVerifier();

// Create and export service instance
export const pointsService = new PointsService(
  pointsRepository,
  eventBus,
  pointsVerifier
);

// Export additional services
export * from './analytics';
export * from './redemption';

// Export types
export * from './points-service';
export * from './verification/points-verifier';
