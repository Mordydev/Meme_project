/**
 * Referral API Routes
 * 
 * API endpoints for referral system, including code generation, tracking,
 * attribution, and analytics.
 */
import { FastifyInstance } from 'fastify';
import codesRoutes from './codes';
import trackingRoutes from './tracking';
import campaignsRoutes from './campaigns';
import analyticsRoutes from './analytics';
import rewardsRoutes from './rewards';
import networkRoutes from './network';
import protectionRoutes from './protection';
import statusRoutes from './status';

/**
 * Register all referral API routes
 * 
 * @param fastify Fastify instance
 */
export default async function referralRoutes(fastify: FastifyInstance) {
  // Register sub-routes
  fastify.register(codesRoutes, { prefix: '/codes' });
  fastify.register(trackingRoutes, { prefix: '/tracking' });
  fastify.register(campaignsRoutes, { prefix: '/campaigns' });
  fastify.register(analyticsRoutes, { prefix: '/analytics' });
  fastify.register(rewardsRoutes, { prefix: '/rewards' });
  fastify.register(networkRoutes, { prefix: '/network' });
  fastify.register(protectionRoutes, { prefix: '/protection' });
  fastify.register(statusRoutes, { prefix: '/status' });
  
  // Include top-level routes
  fastify.register(function(fastify, _opts, done) {
    // Import routes
    import('./routes').then(routes => {
      // Register routes
      routes.default(fastify);
      done();
    }).catch(err => {
      done(err);
    });
  });
}
