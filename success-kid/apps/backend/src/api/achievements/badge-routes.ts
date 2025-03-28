/**
 * Badge API Routes
 * 
 * API endpoints for badges, user badge awards, and badge management.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { handleApiError } from '../../errors';

/**
 * Request parameters with badge ID
 */
interface BadgeParams {
  id: string;
}

/**
 * Request parameters with user ID
 */
interface UserParams {
  userId: string;
}

/**
 * Request query parameters for badge filtering
 */
interface BadgeQueryParams {
  category?: string;
  tier?: string;
  search?: string;
}

/**
 * Badge award request body
 */
interface BadgeAwardRequest {
  data: {
    userId: string;
    badgeId: string;
    source: string;
    reason?: string;
  };
}

/**
 * Badge equip request body
 */
interface BadgeEquipRequest {
  data: {
    equipped: boolean;
    slot?: number;
  };
}

/**
 * Badge routes
 */
export default async function badgeRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/badges:
   *   get:
   *     summary: Get all badges
   *     description: Retrieves all badges with optional filtering
   *     tags: [Badges]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [achievement, rank, event, supporter, milestone, custom]
   *         description: Filter by badge category
   *       - in: query
   *         name: tier
   *         schema:
   *           type: string
   *           enum: [bronze, silver, gold, platinum, special]
   *         description: Filter by badge tier
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for badge name/description
   *     responses:
   *       200:
   *         description: List of badges
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       image_url:
   *                         type: string
   *                       category:
   *                         type: string
   *                       tier:
   *                         type: string
   *                       points_value:
   *                         type: integer
   *                       display_priority:
   *                         type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  fastify.get<{ Querystring: BadgeQueryParams }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            tier: { type: 'string' },
            search: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: BadgeQueryParams }>, reply: FastifyReply) => {
      try {
        const { category, tier, search } = request.query;
        
        const filter = {
          ...(category ? { category } : {}),
          ...(tier ? { tier } : {}),
          ...(search ? { search } : {})
        };
        
        const badges = await fastify.achievements.badgeService.getBadges(
          Object.keys(filter).length > 0 ? filter : undefined
        );
        
        return reply.code(200).send({
          data: badges,
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
   * @openapi
   * /api/v1/badges/{id}:
   *   get:
   *     summary: Get badge by ID
   *     description: Retrieves a specific badge by ID
   *     tags: [Badges]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Badge ID
   *     responses:
   *       200:
   *         description: Badge details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     description:
   *                       type: string
   *                     image_url:
   *                       type: string
   *                     category:
   *                       type: string
   *                     tier:
   *                       type: string
   *                     points_value:
   *                       type: integer
   *                     display_priority:
   *                       type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Badge not found
   */
  fastify.get<{ Params: BadgeParams }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: BadgeParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        const badge = await fastify.achievements.badgeService.getBadgeById(id);
        
        if (!badge) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Badge not found' }]
          });
        }
        
        return reply.code(200).send({
          data: badge,
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
   * @openapi
   * /api/v1/badges/user:
   *   get:
   *     summary: Get current user's badges
   *     description: Retrieves badges for the authenticated user
   *     tags: [Badges]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's badges
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       badge:
   *                         type: object
   *                       awarded_at:
   *                         type: string
   *                         format: date-time
   *                       equipped:
   *                         type: boolean
   *                       slot:
   *                         type: integer
   *                         nullable: true
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   */
  fastify.get(
    '/user',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const badges = await fastify.achievements.badgeService.getUserBadges(userId);
        
        return reply.code(200).send({
          data: badges,
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
   * @openapi
   * /api/v1/badges/user/{userId}:
   *   get:
   *     summary: Get user's badges by user ID
   *     description: Retrieves badges for a specific user
   *     tags: [Badges]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User's badges
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       badge:
   *                         type: object
   *                       awarded_at:
   *                         type: string
   *                         format: date-time
   *                       equipped:
   *                         type: boolean
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  fastify.get<{ Params: UserParams }>(
    '/user/:userId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;
        
        const badges = await fastify.achievements.badgeService.getUserBadges(userId);
        
        return reply.code(200).send({
          data: badges,
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
   * @openapi
   * /api/v1/badges/user/equipped:
   *   get:
   *     summary: Get current user's equipped badges
   *     description: Retrieves only the equipped badges for the authenticated user
   *     tags: [Badges]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's equipped badges
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       badge:
   *                         type: object
   *                       slot:
   *                         type: integer
   *                       awarded_at:
   *                         type: string
   *                         format: date-time
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   */
  fastify.get(
    '/user/equipped',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const badges = await fastify.achievements.badgeService.getEquippedBadges(userId);
        
        return reply.code(200).send({
          data: badges,
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
   * @openapi
   * /api/v1/badges/recommended:
   *   get:
   *     summary: Get recommended badges for current user
   *     description: Retrieves recommended badges for the authenticated user
   *     tags: [Badges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 3
   *         description: Maximum number of badges to return
   *     responses:
   *       200:
   *         description: Recommended badges
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       image_url:
   *                         type: string
   *                       category:
   *                         type: string
   *                       tier:
   *                         type: string
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   */
  fastify.get<{ Querystring: { limit?: number } }>(
    '/recommended',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 3 }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: { limit?: number } }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const { limit = 3 } = request.query;
        
        const badges = await fastify.achievements.badgeService.getRecommendedBadges(userId, limit);
        
        return reply.code(200).send({
          data: badges,
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
   * @openapi
   * /api/v1/badges/{id}/equip:
   *   post:
   *     summary: Equip or unequip a badge
   *     description: Toggles whether a badge is equipped for the authenticated user
   *     tags: [Badges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Badge ID
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
   *                 required: [equipped]
   *                 properties:
   *                   equipped:
   *                     type: boolean
   *                     description: Whether to equip or unequip the badge
   *                   slot:
   *                     type: integer
   *                     description: Optional slot to equip the badge in (0-2)
   *     responses:
   *       200:
   *         description: Badge equip status updated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     badge_id:
   *                       type: string
   *                     equipped:
   *                       type: boolean
   *                     slot:
   *                       type: integer
   *                       nullable: true
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Badge not found or not owned by user
   */
  fastify.post<{ 
    Params: BadgeParams; 
    Body: { data: { equipped: boolean; slot?: number } } 
  }>(
    '/:id/equip',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['equipped'],
              properties: {
                equipped: { type: 'boolean' },
                slot: { type: 'number' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Params: BadgeParams; 
      Body: { data: { equipped: boolean; slot?: number } } 
    }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const { id } = request.params;
        const { equipped, slot } = request.body.data;
        
        // Check if user has the badge
        const hasBadge = await fastify.achievements.badgeService.hasBadge(userId, id);
        if (!hasBadge) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Badge not found or not owned by user' }]
          });
        }
        
        // Update badge equip status
        const userBadge = await fastify.achievements.badgeService.toggleEquipBadge(
          userId, id, { equipped, slot }
        );
        
        return reply.code(200).send({
          data: {
            badge_id: id,
            equipped,
            slot: userBadge?.slot || null
          },
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
   * Admin routes below
   * (These would be protected with admin authentication in a real implementation)
   */

  /**
   * @openapi
   * /api/v1/badges:
   *   post:
   *     summary: Create a new badge (admin only)
   *     description: Creates a new badge definition
   *     tags: [Badges]
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
   *                 required: [name, description, image_url, category, tier]
   *                 properties:
   *                   name:
   *                     type: string
   *                   description:
   *                     type: string
   *                   image_url:
   *                     type: string
   *                   category:
   *                     type: string
   *                     enum: [achievement, rank, event, supporter, milestone, custom]
   *                   tier:
   *                     type: string
   *                     enum: [bronze, silver, gold, platinum, special]
   *                   points_value:
   *                     type: integer
   *                     default: 0
   *                   display_priority:
   *                     type: integer
   *                     default: 0
   *     responses:
   *       201:
   *         description: Badge created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     description:
   *                       type: string
   *                     image_url:
   *                       type: string
   *                     category:
   *                       type: string
   *                     tier:
   *                       type: string
   *                     points_value:
   *                       type: integer
   *                     display_priority:
   *                       type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin only
   */
  fastify.post(
    '/',
    async (request: FastifyRequest<{ 
      Body: { 
        data: { 
          name: string; 
          description: string; 
          image_url: string; 
          category: string; 
          tier: string; 
          points_value?: number; 
          display_priority?: number; 
        } 
      } 
    }>, reply: FastifyReply) => {
      try {
        // Check if user is admin
        const isAdmin = false; // Placeholder for actual admin check
        
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin access required' }]
          });
        }
        
        const badgeData = request.body.data;
        
        // Create the badge
        const badge = await fastify.achievements.badgeService.createBadge(badgeData);
        
        return reply.code(201).send({
          data: badge,
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
   * @openapi
   * /api/v1/badges/{id}:
   *   put:
   *     summary: Update a badge (admin only)
   *     description: Updates an existing badge definition
   *     tags: [Badges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Badge ID
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
   *                 properties:
   *                   name:
   *                     type: string
   *                   description:
   *                     type: string
   *                   image_url:
   *                     type: string
   *                   category:
   *                     type: string
   *                     enum: [achievement, rank, event, supporter, milestone, custom]
   *                   tier:
   *                     type: string
   *                     enum: [bronze, silver, gold, platinum, special]
   *                   points_value:
   *                     type: integer
   *                   display_priority:
   *                     type: integer
   *     responses:
   *       200:
   *         description: Badge updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     description:
   *                       type: string
   *                     image_url:
   *                       type: string
   *                     category:
   *                       type: string
   *                     tier:
   *                       type: string
   *                     points_value:
   *                       type: integer
   *                     display_priority:
   *                       type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin only
   *       404:
   *         description: Badge not found
   */
  fastify.put<{ 
    Params: BadgeParams; 
    Body: { 
      data: { 
        name?: string; 
        description?: string; 
        image_url?: string; 
        category?: string; 
        tier?: string; 
        points_value?: number; 
        display_priority?: number; 
      } 
    } 
  }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Params: BadgeParams; 
      Body: { 
        data: { 
          name?: string; 
          description?: string; 
          image_url?: string; 
          category?: string; 
          tier?: string; 
          points_value?: number; 
          display_priority?: number; 
        } 
      } 
    }>, reply: FastifyReply) => {
      try {
        // Check if user is admin
        const isAdmin = false; // Placeholder for actual admin check
        
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin access required' }]
          });
        }
        
        const { id } = request.params;
        const badgeData = request.body.data;
        
        // Update the badge
        const badge = await fastify.achievements.badgeService.updateBadge(id, badgeData);
        
        if (!badge) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Badge not found' }]
          });
        }
        
        return reply.code(200).send({
          data: badge,
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
   * @openapi
   * /api/v1/badges/{id}:
   *   delete:
   *     summary: Delete a badge (admin only)
   *     description: Deletes an existing badge definition
   *     tags: [Badges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Badge ID
   *     responses:
   *       200:
   *         description: Badge deleted successfully
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
   *                     id:
   *                       type: string
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin only
   *       404:
   *         description: Badge not found
   */
  fastify.delete<{ Params: BadgeParams }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: BadgeParams }>, reply: FastifyReply) => {
      try {
        // Check if user is admin
        const isAdmin = false; // Placeholder for actual admin check
        
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin access required' }]
          });
        }
        
        const { id } = request.params;
        
        // Delete the badge
        const success = await fastify.achievements.badgeService.deleteBadge(id);
        
        if (!success) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Badge not found' }]
          });
        }
        
        return reply.code(200).send({
          data: {
            success: true,
            id
          },
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
   * @openapi
   * /api/v1/badges/award:
   *   post:
   *     summary: Award a badge to a user (admin only)
   *     description: Manually awards a badge to a specified user
   *     tags: [Badges]
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
   *                 required: [userId, badgeId, source]
   *                 properties:
   *                   userId:
   *                     type: string
   *                   badgeId:
   *                     type: string
   *                   source:
   *                     type: string
   *                   reason:
   *                     type: string
   *     responses:
   *       200:
   *         description: Badge awarded successfully
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
   *                     badge:
   *                       type: object
   *                     awarded_at:
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
   *       403:
   *         description: Forbidden - Admin only
   *       404:
   *         description: Badge not found
   */
  fastify.post<{ Body: BadgeAwardRequest }>(
    '/award',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['userId', 'badgeId', 'source'],
              properties: {
                userId: { type: 'string' },
                badgeId: { type: 'string' },
                source: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: BadgeAwardRequest }>, reply: FastifyReply) => {
      try {
        // Check if user is admin
        const isAdmin = false; // Placeholder for actual admin check
        
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin access required' }]
          });
        }
        
        const { userId, badgeId, source, reason } = request.body.data;
        
        // Award the badge
        const userBadge = await fastify.achievements.badgeService.awardBadge({
          userId,
          badgeId,
          source,
          reason
        });
        
        // Get badge details
        const badge = await fastify.achievements.badgeService.getBadgeById(badgeId);
        
        return reply.code(200).send({
          data: {
            success: true,
            badge,
            awarded_at: userBadge.awarded_at
          },
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
