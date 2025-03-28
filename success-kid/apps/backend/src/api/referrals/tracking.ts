/**
 * Referral Tracking Routes
 * 
 * API endpoints for tracking referral visits and managing attribution
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getReferralTrackingService, getReferralService } from '../../services/referral';
import { handleApiError } from '../../errors';
import crypto from 'crypto';

/**
 * Interface for tracking request
 */
interface TrackingRequest {
  data: {
    code: string;
    visitorId: string;
    landingPage: string;
    userAgent: string;
    ipAddress?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  };
}

/**
 * Interface for attribution request
 */
interface AttributionRequest {
  data: {
    userId: string;
    visitorId?: string;
    ipAddress?: string;
    userAgent?: string;
    referralCode?: string;
  };
}

/**
 * Interface for custom attribution
 */
interface CustomAttributionRequest {
  data: {
    userId: string;
    referralCode: string;
  };
}

/**
 * Hash a string using SHA-256
 * 
 * @param input String to hash
 * @returns Hashed string
 */
function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Register referral tracking routes
 */
export default async function trackingRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/referrals/tracking/visit:
   *   post:
   *     summary: Track referral link visit
   *     description: Tracks a visit to a referral link
   *     tags: [Referrals]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [data]
   *             properties:
   *               data:
   *                 type: object
   *                 required: [code, visitorId, landingPage, userAgent]
   *                 properties:
   *                   code:
   *                     type: string
   *                   visitorId:
   *                     type: string
   *                   landingPage:
   *                     type: string
   *                   userAgent:
   *                     type: string
   *                   ipAddress:
   *                     type: string
   *                   utmSource:
   *                     type: string
   *                   utmMedium:
   *                     type: string
   *                   utmCampaign:
   *                     type: string
   *                   referrer:
   *                     type: string
   *     responses:
   *       200:
   *         description: Visit tracked successfully
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
   *                     code:
   *                       type: string
   *                     referrerId:
   *                       type: string
   *                       format: uuid
   *                       nullable: true
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Referral code not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: TrackingRequest }>('/visit', {
    schema: {
      tags: ['Referrals'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['code', 'visitorId', 'landingPage', 'userAgent'],
            properties: {
              code: { type: 'string' },
              visitorId: { type: 'string' },
              landingPage: { type: 'string' },
              userAgent: { type: 'string' },
              ipAddress: { type: 'string' },
              utmSource: { type: 'string' },
              utmMedium: { type: 'string' },
              utmCampaign: { type: 'string' },
              referrer: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: TrackingRequest }>, reply: FastifyReply) => {
      try {
        // Get request data
        const { 
          code, 
          visitorId, 
          landingPage, 
          userAgent, 
          ipAddress, 
          utmSource,
          utmMedium,
          utmCampaign,
          referrer
        } = request.body.data;
        
        // Get client IP (from request or provided)
        const clientIp = ipAddress || request.ip || '127.0.0.1';
        
        // Hash the IP for privacy
        const ipHash = hashString(clientIp);
        
        // Get tracking service
        const trackingService = getReferralTrackingService();
        
        // Track visit
        const result = await trackingService.trackVisit(code, {
          visitorId,
          ipHash,
          userAgent,
          landingPage,
          utmSource,
          utmMedium,
          utmCampaign,
          referrer
        });
        
        // Send response
        return reply.code(200).send({
          data: {
            success: result.success,
            code: result.code,
            referrerId: result.referrerId
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/tracking/attribute:
   *   post:
   *     summary: Attribute user signup to referral
   *     description: Attributes a new user signup to a referral based on tracking data
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [data]
   *             properties:
   *               data:
   *                 type: object
   *                 required: [userId]
   *                 properties:
   *                   userId:
   *                     type: string
   *                     format: uuid
   *                   visitorId:
   *                     type: string
   *                   ipAddress:
   *                     type: string
   *                   userAgent:
   *                     type: string
   *                   referralCode:
   *                     type: string
   *     responses:
   *       200:
   *         description: Attribution result
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
   *                     referralId:
   *                       type: string
   *                       format: uuid
   *                       nullable: true
   *                     referrerId:
   *                       type: string
   *                       format: uuid
   *                       nullable: true
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: AttributionRequest }>('/attribute', {
    schema: {
      tags: ['Referrals'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['userId'],
            properties: {
              userId: { type: 'string', format: 'uuid' },
              visitorId: { type: 'string' },
              ipAddress: { type: 'string' },
              userAgent: { type: 'string' },
              referralCode: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: AttributionRequest }>, reply: FastifyReply) => {
      try {
        // Check authentication (admin or self)
        const authUserId = request.user?.id;
        const isAdmin = request.user?.isAdmin === true;
        const isSelf = authUserId === request.body.data.userId;
        
        if (!authUserId || (!isAdmin && !isSelf)) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get request data
        const { 
          userId, 
          visitorId, 
          ipAddress, 
          userAgent, 
          referralCode 
        } = request.body.data;
        
        // Get client IP (from request or provided)
        const clientIp = ipAddress || request.ip || '127.0.0.1';
        
        // Hash the IP for privacy if provided
        const ipHash = ipAddress ? hashString(clientIp) : undefined;
        
        // Get referral service
        const referralService = getReferralService();
        
        // Attribute signup
        const result = await referralService.attributeSignup(
          userId,
          referralCode,
          visitorId
        );
        
        // Send response
        return reply.code(200).send({
          data: {
            success: result.success,
            referralId: result.referralId,
            referrerId: result.referrerId
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/tracking/custom-attribution:
   *   post:
   *     summary: Create custom attribution
   *     description: Creates a custom attribution between a user and a referrer using a referral code
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [data]
   *             properties:
   *               data:
   *                 type: object
   *                 required: [userId, referralCode]
   *                 properties:
   *                   userId:
   *                     type: string
   *                     format: uuid
   *                   referralCode:
   *                     type: string
   *     responses:
   *       200:
   *         description: Custom attribution result
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
   *                     referralId:
   *                       type: string
   *                       format: uuid
   *                       nullable: true
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: CustomAttributionRequest }>('/custom-attribution', {
    schema: {
      tags: ['Referrals'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['userId', 'referralCode'],
            properties: {
              userId: { type: 'string', format: 'uuid' },
              referralCode: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: CustomAttributionRequest }>, reply: FastifyReply) => {
      try {
        // Check authentication (admin only)
        const isAdmin = request.user?.isAdmin === true;
        
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'FORBIDDEN', 
              message: 'Admin permissions required for custom attribution' 
            }]
          });
        }
        
        // Get request data
        const { userId, referralCode } = request.body.data;
        
        // Get tracking service
        const trackingService = getReferralTrackingService();
        
        // Store custom attribution
        const success = await trackingService.storeCustomAttribution(
          userId,
          referralCode
        );
        
        if (!success) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'INVALID_CODE', 
              message: 'Invalid referral code' 
            }]
          });
        }
        
        // Get referral service
        const referralService = getReferralService();
        
        // Attribute signup using the stored custom attribution
        const result = await referralService.attributeSignup(
          userId,
          referralCode
        );
        
        // Send response
        return reply.code(200).send({
          data: {
            success: result.success,
            referralId: result.referralId
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/tracking/clear/{visitorId}:
   *   post:
   *     summary: Clear tracking data
   *     description: Clears tracking data for a specific visitor
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: visitorId
   *         required: true
   *         schema:
   *           type: string
   *         description: Visitor ID
   *     responses:
   *       200:
   *         description: Tracking data cleared successfully
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
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Params: { visitorId: string } }>('/clear/:visitorId', {
    schema: {
      tags: ['Referrals'],
      params: {
        type: 'object',
        required: ['visitorId'],
        properties: {
          visitorId: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Params: { visitorId: string } }>, reply: FastifyReply) => {
      try {
        // Check authentication
        if (!request.user?.id) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get visitor ID from path
        const { visitorId } = request.params;
        
        // Get tracking service
        const trackingService = getReferralTrackingService();
        
        // Clear tracking data
        await trackingService.clearTrackingData(visitorId);
        
        // Send response
        return reply.code(200).send({
          data: {
            success: true
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });
}
