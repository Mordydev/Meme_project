/**
 * Referral Attribution Hook
 * 
 * Integrates referral attribution during user registration
 */
import { FastifyInstance, FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { createReferralServices } from './index';
import { logger } from '../../lib/logger';

/**
 * Register a hook to handle referral attribution after user registration
 */
export function registerReferralAttributionHook(fastify: FastifyInstance) {
  // User registration success hook
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only process for user registration endpoint
    if (request.routerPath !== '/api/v1/auth/register' || reply.statusCode !== 201) {
      return;
    }

    try {
      // Extract the newly registered user from the response
      const responsePayload = JSON.parse(reply.payload as string);
      const newUserId = responsePayload?.data?.user?.id;

      if (!newUserId) {
        logger.warn('Cannot attribute referral: User ID not found in registration response');
        return;
      }

      // Look for referral data in cookies or session
      const visitorId = request.cookies?.visitor_id || request.session?.visitor_id;
      if (!visitorId) {
        logger.debug('No visitor ID found for referral attribution');
        return;
      }

      // Attribute the signup
      const { pointsService } = fastify.services;
      const { referralService } = createReferralServices(fastify.db, pointsService);

      const attribution = await referralService.attributeSignup(newUserId, visitorId);

      if (attribution.success) {
        logger.info('Referral attributed for new user', {
          userId: newUserId,
          referrerId: attribution.referrerId,
          referralId: attribution.referralId
        });

        // Process signup reward automatically
        await referralService.processReferralReward(attribution.referralId!, 'signup');
      } else if (attribution.error) {
        logger.warn('Referral attribution failed', {
          userId: newUserId,
          error: attribution.error
        });
      }
    } catch (error) {
      // Log but don't block registration
      logger.error('Error in referral attribution hook', { error });
    }
  });

  // User wallet connection hook (for wallet_connection reward)
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only process for wallet connection endpoint
    if (request.routerPath !== '/api/v1/wallet/connect' || reply.statusCode !== 200) {
      return;
    }

    try {
      const userId = request.user?.id;
      if (!userId) {
        return;
      }

      // Check if user was referred
      const { pointsService } = fastify.services;
      const { referralService } = createReferralServices(fastify.db, pointsService);

      const referralInfo = await referralService.wasUserReferred(userId);
      if (!referralInfo.wasReferred) {
        return;
      }

      // Find the referral record
      const query = `
        SELECT id FROM referral_tracking 
        WHERE referrer_id = $1 AND converted_user_id = $2
        LIMIT 1
      `;
      const result = await fastify.db.query(query, [referralInfo.referrerId, userId]);
      const referralId = result.rows[0]?.id;

      if (referralId) {
        // Process wallet connection reward
        await referralService.processReferralReward(referralId, 'wallet_connection');
        logger.info('Wallet connection reward processed', { userId, referrerId: referralInfo.referrerId });
      }
    } catch (error) {
      // Log but don't block wallet connection
      logger.error('Error in wallet connection reward hook', { error });
    }
  });
}
