/**
 * Referral Status Routes
 * 
 * Routes for referral status tracking and notifications
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getReferralStatusService } from '../../services/referral';
import { handleApiError } from '../../errors';

/**
 * Interface for update status body
 */
interface UpdateStatusBody {
  data: {
    referralId: string;
    status: string;
  };
}

/**
 * Interface for track progress body
 */
interface TrackProgressBody {
  data: {
    refereeId: string;
  };
}

/**
 * Interface for notification body
 */
interface NotificationBody {
  data: {
    userId: string;
    type: string;
    data?: any;
  };
}

/**
 * Register referral status routes
 */
export default function routes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/referrals/status/summary:
   *   get:
   *     summary: Get status summary
   *     description: Retrieves a summary of the user's referral statuses
   *     tags: [Referrals, Status]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Status summary
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalReferrals:
   *                       type: integer
   *                     referralsByStatus:
   *                       type: object
   *                       properties:
   *                         pending:
   *                           type: integer
   *                         completed:
   *                           type: integer
   *                         converted:
   *                           type: integer
   *                         rewarded:
   *                           type: integer
   *                         expired:
   *                           type: integer
   *                         invalid:
   *                           type: integer
   *                     pendingMilestones:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           milestone:
   *                             type: string
   *                           refereeCount:
   *                             type: integer
   *                           potentialRewards:
   *                             type: integer
   *                     recentStatusChanges:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           referralId:
   *                             type: string
   *                           refereeId:
   *                             type: string
   *                           oldStatus:
   *                             type: string
   *                           newStatus:
   *                             type: string
   *                           changedAt:
   *                             type: string
   *                             format: date-time
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
  fastify.get('/status/summary', {
    schema: {
      tags: ['Referrals', 'Status']
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
        
        // Get status service
        const statusService = getReferralStatusService();
        
        // Get status summary
        const summary = await statusService.getStatusSummary(userId);
        
        // Send response
        return reply.code(200).send({
          data: summary,
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
   * /api/v1/referrals/status/update:
   *   post:
   *     summary: Update referral status
   *     description: Updates the status of a referral
   *     tags: [Referrals, Status]
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
   *                 required: [referralId, status]
   *                 properties:
   *                   referralId:
   *                     type: string
   *                   status:
   *                     type: string
   *                     enum: [pending, completed, converted, rewarded, expired, invalid]
   *     responses:
   *       200:
   *         description: Status update result
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
   *                     statusChanged:
   *                       type: boolean
   *                     oldStatus:
   *                       type: string
   *                     newStatus:
   *                       type: string
   *                     error:
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
   *       403:
   *         description: Forbidden - Insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: UpdateStatusBody }>('/status/update', {
    schema: {
      tags: ['Referrals', 'Status'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['referralId', 'status'],
            properties: {
              referralId: { type: 'string' },
              status: { 
                type: 'string',
                enum: ['pending', 'completed', 'converted', 'rewarded', 'expired', 'invalid']
              }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: UpdateStatusBody }>, reply: FastifyReply) => {
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
        const { referralId, status } = request.body.data;
        
        // Get status service
        const statusService = getReferralStatusService();
        
        // Update status
        const result = await statusService.updateReferralStatus(referralId, status);
        
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
   * /api/v1/referrals/status/track:
   *   post:
   *     summary: Track referee progress
   *     description: Tracks the progress of a referred user and updates status if needed
   *     tags: [Referrals, Status]
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
   *                 required: [refereeId]
   *                 properties:
   *                   refereeId:
   *                     type: string
   *     responses:
   *       200:
   *         description: Progress tracking result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     referralId:
   *                       type: string
   *                     oldStatus:
   *                       type: string
   *                     newStatus:
   *                       type: string
   *                     statusChanged:
   *                       type: boolean
   *                     progress:
   *                       type: object
   *                       properties:
   *                         hasWallet:
   *                           type: boolean
   *                         pointsEarned:
   *                           type: integer
   *                         contentCreated:
   *                           type: integer
   *                         achievements:
   *                           type: integer
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
  fastify.post<{ Body: TrackProgressBody }>('/status/track', {
    schema: {
      tags: ['Referrals', 'Status'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['refereeId'],
            properties: {
              refereeId: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: TrackProgressBody }>, reply: FastifyReply) => {
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
        const { refereeId } = request.body.data;
        
        // Get status service
        const statusService = getReferralStatusService();
        
        // Track progress
        const result = await statusService.trackRefereeProgress(refereeId);
        
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
   * /api/v1/referrals/status/notify:
   *   post:
   *     summary: Send status notification
   *     description: Sends a notification related to referral status
   *     tags: [Referrals, Status]
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
   *                 required: [userId, type]
   *                 properties:
   *                   userId:
   *                     type: string
   *                   type:
   *                     type: string
   *                     enum: [referral_created, status_changed, milestone_achieved, reward_earned, wallet_connected]
   *                   data:
   *                     type: object
   *     responses:
   *       200:
   *         description: Notification result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     sent:
   *                       type: boolean
   *                     channels:
   *                       type: array
   *                       items:
   *                         type: string
   *                     error:
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
   *       403:
   *         description: Forbidden - Insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: NotificationBody }>('/status/notify', {
    schema: {
      tags: ['Referrals', 'Status'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['userId', 'type'],
            properties: {
              userId: { type: 'string' },
              type: { 
                type: 'string',
                enum: [
                  'referral_created',
                  'status_changed',
                  'milestone_achieved',
                  'reward_earned',
                  'wallet_connected'
                ]
              },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: NotificationBody }>, reply: FastifyReply) => {
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
        const { userId, type, data } = request.body.data;
        
        // Get status service
        const statusService = getReferralStatusService();
        
        // Send notification
        const result = await statusService.sendStatusNotification(userId, type, data);
        
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
   * /api/v1/referrals/status/process-updates:
   *   post:
   *     summary: Process scheduled status updates
   *     description: Processes scheduled status updates such as expiring referrals
   *     tags: [Referrals, Status]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Processing result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     processed:
   *                       type: integer
   *                     updated:
   *                       type: integer
   *                     failed:
   *                       type: integer
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
  fastify.post('/status/process-updates', {
    schema: {
      tags: ['Referrals', 'Status']
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
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
        
        // Get status service
        const statusService = getReferralStatusService();
        
        // Process updates
        const result = await statusService.processScheduledStatusUpdates();
        
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
}
