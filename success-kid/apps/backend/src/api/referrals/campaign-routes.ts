/**
 * Referral Campaign Routes
 * 
 * API routes for managing referral campaigns
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createReferralServices } from '../../services/referrals';
import { 
  createCampaignSchema, 
  updateCampaignSchema, 
  getCampaignsSchema, 
  campaignPerformanceSchema,
  generateCampaignCodeSchema
} from './schemas';
import { handleApiError } from '../../lib/errors';

export default async function referralCampaignRoutes(fastify: FastifyInstance) {
  const { pointsService } = fastify.services;
  const { campaignService } = createReferralServices(fastify.db, pointsService);

  /**
   * Create a new campaign
   * 
   * @openapi
   * /api/v1/referrals/campaigns:
   *   post:
   *     summary: Create a new campaign (admin only)
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, description, start_date, end_date, reward_multiplier]
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               start_date:
   *                 type: string
   *                 format: date-time
   *               end_date:
   *                 type: string
   *                 format: date-time
   *               reward_multiplier:
   *                 type: number
   *               eligibility_criteria:
   *                 type: string
   *               max_rewards:
   *                 type: number
   *               special_code:
   *                 type: string
   *               target_audience:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [draft, active]
   *     responses:
   *       200:
   *         description: Created campaign
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   */
  fastify.post(
    '/campaigns',
    {
      schema: createCampaignSchema,
      onRequest: [fastify.authenticate, fastify.authorizeAdmin]
    },
    async (request: FastifyRequest<{
      Body: any; // Using the full DTO would be lengthy, type 'any' for brevity
    }>, reply: FastifyReply) => {
      try {
        // Add the creator ID to the campaign data
        const campaignData = {
          ...request.body,
          created_by: request.user.id
        };

        const campaign = await campaignService.createCampaign(campaignData);

        return reply.code(200).send({
          data: campaign,
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
   * Update a campaign
   * 
   * @openapi
   * /api/v1/referrals/campaigns/{id}:
   *   patch:
   *     summary: Update a campaign (admin only)
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               start_date:
   *                 type: string
   *                 format: date-time
   *               end_date:
   *                 type: string
   *                 format: date-time
   *               reward_multiplier:
   *                 type: number
   *               eligibility_criteria:
   *                 type: string
   *               max_rewards:
   *                 type: number
   *               special_code:
   *                 type: string
   *               target_audience:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [draft, active, completed, cancelled]
   *     responses:
   *       200:
   *         description: Updated campaign
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   */
  fastify.patch(
    '/campaigns/:id',
    {
      schema: updateCampaignSchema,
      onRequest: [fastify.authenticate, fastify.authorizeAdmin]
    },
    async (request: FastifyRequest<{
      Params: { id: string };
      Body: any; // Using the full DTO would be lengthy, type 'any' for brevity
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const campaign = await campaignService.updateCampaign(id, request.body);

        return reply.code(200).send({
          data: campaign,
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
   * Get campaigns
   * 
   * @openapi
   * /api/v1/referrals/campaigns:
   *   get:
   *     summary: Get campaigns (admin only)
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: status
   *         in: query
   *         schema:
   *           type: string
   *           enum: [draft, active, completed, cancelled]
   *       - name: limit
   *         in: query
   *         schema:
   *           type: number
   *           default: 20
   *       - name: offset
   *         in: query
   *         schema:
   *           type: number
   *           default: 0
   *     responses:
   *       200:
   *         description: Campaigns
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                 pagination:
   *                   type: object
   */
  fastify.get(
    '/campaigns',
    {
      schema: getCampaignsSchema,
      onRequest: [fastify.authenticate, fastify.authorizeAdmin]
    },
    async (request: FastifyRequest<{
      Querystring: { 
        status?: string | string[];
        limit?: number; 
        offset?: number;
      }
    }>, reply: FastifyReply) => {
      try {
        const { status, limit = 20, offset = 0 } = request.query;

        const result = await campaignService.getCampaignsByStatus(
          status as any, 
          { limit, offset }
        );

        return reply.code(200).send({
          data: result.data,
          meta: {
            timestamp: new Date().toISOString()
          },
          pagination: result.pagination
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * Get active campaigns (available to all authenticated users)
   * 
   * @openapi
   * /api/v1/referrals/campaigns/active:
   *   get:
   *     summary: Get active campaigns
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Active campaigns
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   */
  fastify.get(
    '/campaigns/active',
    {
      onRequest: [fastify.authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const campaigns = await campaignService.getActiveCampaigns();

        return reply.code(200).send({
          data: campaigns,
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
   * Get campaign performance
   * 
   * @openapi
   * /api/v1/referrals/campaigns/{id}/performance:
   *   get:
   *     summary: Get campaign performance (admin only)
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Campaign performance
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   */
  fastify.get(
    '/campaigns/:id/performance',
    {
      schema: campaignPerformanceSchema,
      onRequest: [fastify.authenticate, fastify.authorizeAdmin]
    },
    async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const performance = await campaignService.getCampaignPerformance(id);

        return reply.code(200).send({
          data: performance,
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
   * Generate a campaign code for the user
   * 
   * @openapi
   * /api/v1/referrals/campaigns/{id}/code:
   *   post:
   *     summary: Generate a campaign code for the user
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Generated campaign code
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
   */
  fastify.post(
    '/campaigns/:id/code',
    {
      schema: generateCampaignCodeSchema,
      onRequest: [fastify.authenticate]
    },
    async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const userId = request.user.id;

        const result = await campaignService.generateCampaignCode(userId, id);

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
   * Activate a campaign
   * 
   * @openapi
   * /api/v1/referrals/campaigns/{id}/activate:
   *   post:
   *     summary: Activate a campaign (admin only)
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Activated campaign
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   */
  fastify.post(
    '/campaigns/:id/activate',
    {
      onRequest: [fastify.authenticate, fastify.authorizeAdmin]
    },
    async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const campaign = await campaignService.activateCampaign(id);

        return reply.code(200).send({
          data: campaign,
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
   * Cancel a campaign
   * 
   * @openapi
   * /api/v1/referrals/campaigns/{id}/cancel:
   *   post:
   *     summary: Cancel a campaign (admin only)
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Cancelled campaign
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   */
  fastify.post(
    '/campaigns/:id/cancel',
    {
      onRequest: [fastify.authenticate, fastify.authorizeAdmin]
    },
    async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const campaign = await campaignService.cancelCampaign(id);

        return reply.code(200).send({
          data: campaign,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );
}
