/**
 * Points Analytics Module
 * 
 * Exports the PointsAnalyticsService and related types
 */
import { getPgPool } from '../../../lib/db-client';
import { PointsAnalyticsService } from './points-analytics';

// Create and export service instance
export const pointsAnalyticsService = new PointsAnalyticsService(getPgPool());

// Export types and classes
export * from './points-analytics';
