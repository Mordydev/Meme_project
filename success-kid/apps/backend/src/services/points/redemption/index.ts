/**
 * Redemption Service Module
 * 
 * Exports the RedemptionService and related types
 */
import { getPgPool } from '../../../lib/db-client';
import { eventBus } from '../../../lib/event-bus';
import { pointsService } from '../index';
import { RedemptionService } from './redemption-service';

// Create and export service instance
export const redemptionService = new RedemptionService(
  getPgPool(),
  pointsService,
  eventBus
);

// Export types and classes
export * from './redemption-service';
