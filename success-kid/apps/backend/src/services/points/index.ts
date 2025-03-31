/**
 * Points Service Module
 * 
 * Exports the PointsService and related components
 */
import { getPgPool } from '../../lib/db-client';
import { eventBus } from '../../lib/event-bus';
import { PointsRepository } from '../../repositories/points-repository';
import { EnhancedPointsService } from './points-service-enhanced'; // Changed import
import { PointsVerifier } from './verification/points-verifier';

// Create dependencies
const pointsRepository = new PointsRepository();
const pointsVerifier = new PointsVerifier();

// Create and export service instance
export const pointsService = new EnhancedPointsService( // Changed class name
  pointsRepository,
  eventBus,
  pointsVerifier
);

// Export additional services
export * from './analytics';
export * from './redemption';

// Export types
export * from './points-service-enhanced'; // Changed export
export * from './verification/points-verifier';
