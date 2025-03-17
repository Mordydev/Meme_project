/**
 * Referral Protection Routes
 * 
 * Routes for referral protection and anti-abuse mechanisms
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getReferralProtectionService } from '../../services/referral';
import { handleApiError } from '../../errors';

/**
 * Interface for report suspicious activity body
 */
interface ReportSuspiciousBody {
  data: {
    reportedUserId: string;
    reason: string;
    details?: string;
  };
}

/**
 * Interface for reset protection body
 */
interface ResetProtectionBody {
  data: {
    userId: string;
  };
}

/**
 * Register referral protection routes
 */
export default function routes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/referrals/protection/status:
   *   get:
   *     summary: Get protection status
   *     description: Retrieves the user's current protection status and limitations
   *     tags: [Referrals, Protection]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Protection status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     rateLimits:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           type:
   *                             type: string
   *                           current:
   *                             type: integer
   *                           limit:
   *                             type: integer
   *                           resetTime:
   *                             type: string
   *                             format: date-time
   *                     restrictions:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           type:
   *                             type: string
   *                           reason:
   *                             type: string
   *                           appliedAt:
   *                             type: string
   *                             format: date-time
   *                           expiresAt:
   *                             type: string
   *                             format: date-time
   *                     riskScore:
   *                       type: number
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
  fastify.get('/protection/status', {
    schema: {
      tags: ['Referrals', 'Protection']
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get user ID from authentication
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get protection service
        const protectionService = getReferralProtectionService();
        
        // Get protection status
        const status = await protectionService.getProtectionStatus(userId);
        
        // Send response
        return reply.code(200).send({
          data: status,
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
   * /api/v1/referrals/protection/check:
   *   get:
   *     summary: Check referral limits
   *     description: Checks if the user is allowed to create referrals based on current limits
   *     tags: [Referrals, Protection]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Limit check result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     allowed:
   *                       type: boolean
   *                     limitExceeded:
   *                       type: boolean
   *                     suspicious:
   *                       type: boolean
   *                     reason:
   *                       type: string
   *                     currentCount:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     resetTime:
   *                       type: string
   *                       format: date-time
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
  fastify.get('/protection/check', {
    schema: {
      tags: ['Referrals', 'Protection']
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get user ID from authentication
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get protection service
        const protectionService = getReferralProtectionService();
        
        // Check referral limits
        const result = await protectionService.checkReferralLimits(userId);
        
        // Send response
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
  });

  /**
   * @openapi
   * /api/v1/referrals/protection/detect-abuse:
   *   get:
   *     summary: Detect abuse patterns
   *     description: Analyzes the user's behavior for potential abuse patterns
   *     tags: [Referrals, Protection]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Abuse detection result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     suspicious:
   *                       type: boolean
   *                     signals:
   *                       type: array
   *                       items:
   *                         type: string
   *                     riskScore:
   *                       type: number
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
   *       403:
   *         description: Forbidden - Insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get('/protection/detect-abuse', {
    schema: {
      tags: ['Referrals', 'Protection']
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Check for admin permission
        const isAdmin = request.user?.isAdmin === true;
        
        // Get user ID from query or auth (admins can check others)
        let userId = request.query?.userId as string;
        if (!userId) {
          userId = request.user?.id;
        } else if (!isAdmin) {
          // Non-admins can only check their own status
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin permission required to check other users' }]
          });
        }
        
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get protection service
        const protectionService = getReferralProtectionService();
        
        // Detect abuse patterns
        const result = await protectionService.detectAbusePatterns(userId);
        
        // Send response
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
  });

  /**
   * @openapi
   * /api/v1/referrals/protection/report:
   *   post:
   *     summary: Report suspicious activity
   *     description: Reports a user for suspicious referral activity
   *     tags: [Referrals, Protection]
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
   *                 required: [reportedUserId, reason]
   *                 properties:
   *                   reportedUserId:
   *                     type: string
   *                   reason:
   *                     type: string
   *                   details:
   *                     type: string
   *     responses:
   *       200:
   *         description: Report result
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
   *                     reference:
   *                       type: string
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
  fastify.post<{ Body: ReportSuspiciousBody }>('/protection/report', {
    schema: {
      tags: ['Referrals', 'Protection'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['reportedUserId', 'reason'],
            properties: {
              reportedUserId: { type: 'string' },
              reason: { type: 'string' },
              details: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: ReportSuspiciousBody }>, reply: FastifyReply) => {
      try {
        // Get user ID from authentication
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get request data
        const { reportedUserId, reason, details } = request.body.data;
        
        // Get protection service
        const protectionService = getReferralProtectionService();
        
        // Report suspicious activity
        const success = await protectionService.reportSuspiciousActivity(
          userId,
          reportedUserId,
          reason,
          details
        );
        
        // Send response
        return reply.code(200).send({
          data: {
            success,
            reference: `report-${Date.now()}`
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
   * /api/v1/referrals/protection/reset:
   *   post:
   *     summary: Reset protection status
   *     description: Resets protection status for a user, clearing rate limits and restrictions
   *     tags: [Referrals, Protection]
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
   *     responses:
   *       200:
   *         description: Reset result
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
   *         description: Forbidden - Insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: ResetProtectionBody }>('/protection/reset', {
    schema: {
      tags: ['Referrals', 'Protection'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['userId'],
            properties: {
              userId: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: ResetProtectionBody }>, reply: FastifyReply) => {
      try {
        // Check for admin permission
        const isAdmin = request.user?.isAdmin === true;
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin permission required' }]
          });
        }
        
        // Get request data
        const { userId } = request.body.data;
        
        // Get admin ID
        const adminId = request.user?.id;
        if (!adminId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get protection service
        const protectionService = getReferralProtectionService();
        
        // Reset protection status
        const success = await protectionService.resetProtectionStatus(userId, adminId);
        
        // Send response
        return reply.code(200).send({
          data: { success },
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
