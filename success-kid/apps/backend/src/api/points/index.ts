/**
 * Points API Routes
 * 
 * Registers all points-related API endpoints and middleware
 */
import { FastifyInstance } from 'fastify';
import * as handlers from './handlers';
import * as adminHandlers from './admin-handlers';
import * as redemptionHandlers from './redemption-handlers';
import { registerPointsMiddleware } from '../../middleware/points-transaction-middleware';
import * as schema from './schema';

export default async function registerPointsRoutes(app: FastifyInstance): Promise<void> {
  // Register middleware
  registerPointsMiddleware(app);
  
  // Basic points endpoints
  app.get('/api/v1/points/balance/:userId', handlers.getPointsBalance);
  app.get('/api/v1/points/history/:userId', handlers.getPointsHistory);
  app.get('/api/v1/points/caps/:userId', handlers.getDailyCaps);
  app.post('/api/v1/points/award', { schema: schema.awardPointsSchema }, handlers.awardPoints);
  
  // Redemption endpoints
  app.get('/api/v1/points/redemption/eligibility/:userId', redemptionHandlers.getRedemptionEligibility);
  app.post('/api/v1/points/redemption', { schema: schema.redemptionRequestSchema }, redemptionHandlers.requestRedemption);
  app.get('/api/v1/points/redemption/:id', redemptionHandlers.getRedemptionStatus);
  app.get('/api/v1/points/redemption/history/:userId', redemptionHandlers.getRedemptionHistory);
  
  // Admin endpoints (protected by admin authorization middleware)
  app.post('/api/v1/points/admin/award', { schema: schema.adminAwardPointsSchema }, adminHandlers.adminAwardPoints);
  app.post('/api/v1/points/admin/deduct', { schema: schema.adminDeductPointsSchema }, adminHandlers.adminDeductPoints);
  app.get('/api/v1/points/admin/stats', adminHandlers.getPointsStats);
  app.get('/api/v1/points/redemption/stats', redemptionHandlers.getRedemptionStats);
  app.get('/api/v1/points/redemption/flagged', redemptionHandlers.getFlaggedRedemptions);
  app.post('/api/v1/points/redemption/flagged/:id/review', 
    { schema: schema.reviewRedemptionSchema }, 
    redemptionHandlers.reviewFlaggedRedemption
  );
  
  // Rule configuration endpoints
  app.get('/api/v1/points/rules', adminHandlers.getPointsRules);
  app.get('/api/v1/points/events', adminHandlers.getSpecialEvents);
  app.post('/api/v1/points/events/:id/toggle', adminHandlers.toggleSpecialEvent);
  
  // Debugging/development endpoints (disabled in production)
  if (process.env.NODE_ENV !== 'production') {
    app.post('/api/v1/points/debug/reset-caps/:userId', adminHandlers.resetUserCaps);
    app.post('/api/v1/points/debug/simulate-activity', adminHandlers.simulateActivity);
  }
}
