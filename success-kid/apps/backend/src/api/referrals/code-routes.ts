/**
 * Referral Code Routes
 * 
 * API routes for managing referral codes
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createReferralServices } from '../../services/referrals';
import { 
  createCustomCodeSchema, 
  getReferralCodeSchema, 
  validateReferralCodeSchema, 
  trackReferralVisitSchema 
} from './schemas';
import { handleApiError } from '../../lib/errors';
import { logger } from '../../lib/logger';

export default async function referralCodeRoutes(fastify: FastifyInstance) {
  const { pointsService } = fastify.services;
  const { referralService } = createReferralServices(fastify.db, pointsService);

  /**
   * Get the user's referral code
   * 
   * @openapi
   * /api/v1/referrals/code:
   *   get:
   *     summary: Get the user's referral code
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's referral code
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                     url:
   *                       type: string
   *                       format: uri
   *                     isNew:
   *                       type: boolean
   */
  fastify.get(
    '/code',
    {
      schema: getReferralCodeSchema,
      onRequest: [fastify.authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.id;
        const result = await referralService.getUserReferralCode(userId);

        return reply.code(200).send({
          data: result,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * Create a custom referral code
   * 
   * @openapi
   * /api/v1/referrals/code/custom:
   *   post:
   *     summary: Create a custom referral code
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [customCode]
   *             properties:
   *               customCode:
   *                 type: string
   *                 minLength: 4
   *                 maxLength: 20
   *     responses:
   *       200:
   *         description: Custom code created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                     url:
   *                       type: string
   *                       format: uri
   */
  fastify.post(
    '/code/custom',
    {
      schema: createCustomCodeSchema,
      onRequest: [fastify.authenticate]
    },
    async (request: FastifyRequest<{
      Body: { customCode: string }
    }>, reply: FastifyReply) => {
      try {
        const userId = request.user.id;
        const { customCode } = request.body;

        const result = await referralService.createCustomReferralCode(userId, customCode);

        return reply.code(200).send({
          data: result,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * Validate a referral code
   * 
   * @openapi
   * /api/v1/referrals/code/{code}/validate:
   *   get:
   *     summary: Validate a referral code
   *     tags: [Referrals]
   *     parameters:
   *       - name: code
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Validation result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     isValid:
   *                       type: boolean
   *                     referrerId:
   *                       type: string
   *                     type:
   *                       type: string
   *                     campaignId:
   *                       type: string
   */
  fastify.get(
    '/code/:code/validate',
    {
      schema: validateReferralCodeSchema
    },
    async (request: FastifyRequest<{
      Params: { code: string }
    }>, reply: FastifyReply) => {
      try {
        const { code } = request.params;
        const result = await referralService.validateReferralCode(code);

        return reply.code(200).send({
          data: result,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * Track a referral link visit
   * 
   * @openapi
   * /api/v1/referrals/track:
   *   post:
   *     summary: Track a referral link visit
   *     tags: [Referrals]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [code, visitorData]
   *             properties:
   *               code:
   *                 type: string
   *               visitorData:
   *                 type: object
   *                 required: [ip_address, user_agent, landing_page]
   *                 properties:
   *                   visitor_id:
   *                     type: string
   *                   ip_address:
   *                     type: string
   *                   user_agent:
   *                     type: string
   *                   landing_page:
   *                     type: string
   *                   utm_source:
   *                     type: string
   *                   utm_medium:
   *                     type: string
   *                   utm_campaign:
   *                     type: string
   *     responses:
   *       200:
   *         description: Tracking result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     success:
   *                       type: boolean
   */
  fastify.post(
    '/track',
    {
      schema: trackReferralVisitSchema,
      config: {
        rateLimit: {
          max: 50,
          timeWindow: '1 minute'
        }
      }
    },
    async (request: FastifyRequest<{
      Body: {
        code: string;
        visitorData: {
          visitor_id?: string;
          ip_address: string;
          user_agent: string;
          landing_page: string;
          utm_source?: string;
          utm_medium?: string;
          utm_campaign?: string;
        }
      }
    }>, reply: FastifyReply) => {
      try {
        const { code, visitorData } = request.body;
        
        // Use the IP from request if not provided (safer)
        const ipAddress = visitorData.ip_address || request.ip;
        const userAgent = visitorData.user_agent || request.headers['user-agent'] || '';
        
        const trackingData = {
          ...visitorData,
          ip_address: ipAddress,
          user_agent: userAgent
        };
        
        const success = await referralService.trackReferralVisit(code, trackingData);

        return reply.code(200).send({
          data: { success },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        // Don't expose detailed errors for tracking endpoints
        logger.error('Error tracking referral visit', { error });
        return reply.code(200).send({
          data: { success: false },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  );
}
