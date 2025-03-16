/**
 * Challenge API Routes
 * 
 * API endpoints for challenges, challenge participation, and progress tracking.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { handleApiError } from '../../errors';

/**
 * Request parameters with challenge ID
 */
interface ChallengeParams {
  id: string;
}

/**
 * Request parameters with user ID
 */
interface UserParams {
  userId: string;
}

/**
 * Request query parameters for challenge filtering
 */
interface ChallengeQueryParams {
  category?: string;
  difficulty?: string;
  status?: string;
  active?: boolean;
}

/**
 * Join challenge request body
 */
interface JoinChallengeRequest {
  data: {
    challengeId: string;
  };
}

/**
 * Activity data request body
 */
interface ActivityDataRequest {
  data: {
    activityType: string;
    value: number;
    referenceId?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Challenge routes
 */
export default async function challengeRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/challenges:
   *   get:
   *     summary: Get all challenges
   *     description: Retrieves all challenges with optional filtering
   *     tags: [Challenges]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [daily, weekly, seasonal, special, onboarding]
   *         description: Filter by challenge category
   *       - in: query
   *         name: difficulty
   *         schema:
   *           type: string
   *           enum: [easy, medium, hard, expert]
   *         description: Filter by challenge difficulty
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [upcoming, active, completed, expired]
   *         description: Filter by challenge status
   *       - in: query
   *         name: active
   *         schema:
   *           type: boolean
   *         description: Filter for currently active challenges only
   *     responses:
   *       200:
   *         description: List of challenges
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
   *                       title:
   *                         type: string
   *                       description:
   *                         type: string
   *                       image_url:
   *                         type: string
   *                       category:
   *                         type: string
   *                       difficulty:
   *                         type: string
   *                       start_date:
   *                         type: string
   *                         format: date-time
   *                       end_date:
   *                         type: string
   *                         format: date-time
   *                       status:
   *                         type: string
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  fastify.get<{ Querystring: ChallengeQueryParams }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            difficulty: { type: 'string' },
            status: { type: 'string' },
            active: { type: 'boolean' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: ChallengeQueryParams }>, reply: FastifyReply) => {
      try {
        const { category, difficulty, status, active } = request.query;
        
        const filter = {
          ...(category ? { category } : {}),
          ...(difficulty ? { difficulty } : {}),
          ...(status ? { status } : {}),
          ...(active !== undefined ? { active } : {})
        };
        
        const challenges = await fastify.achievements.challengeService.getChallenges(
          Object.keys(filter).length > 0 ? filter : undefined
        );
        
        return reply.code(200).send({
          data: challenges,
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
   * /api/v1/challenges/active:
   *   get:
   *     summary: Get active challenges
   *     description: Retrieves currently active challenges
   *     tags: [Challenges]
   *     responses:
   *       200:
   *         description: List of active challenges
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
   *                       title:
   *                         type: string
   *                       description:
   *                         type: string
   *                       image_url:
   *                         type: string
   *                       category:
   *                         type: string
   *                       difficulty:
   *                         type: string
   *                       start_date:
   *                         type: string
   *                         format: date-time
   *                       end_date:
   *                         type: string
   *                         format: date-time
   *                       days_remaining:
   *                         type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  fastify.get(
    '/active',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const challenges = await fastify.achievements.challengeService.getActiveChallenges();
        
        // Add days remaining
        const now = new Date();
        const challengesWithDaysRemaining = challenges.map(challenge => {
          const endDate = new Date(challenge.end_date);
          const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            ...challenge,
            days_remaining: daysRemaining
          };
        });
        
        return reply.code(200).send({
          data: challengesWithDaysRemaining,
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
   * /api/v1/challenges/{id}:
   *   get:
   *     summary: Get challenge by ID
   *     description: Retrieves a specific challenge by ID
   *     tags: [Challenges]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Challenge ID
   *     responses:
   *       200:
   *         description: Challenge details
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
   *                     title:
   *                       type: string
   *                     description:
   *                       type: string
   *                     image_url:
   *                       type: string
   *                     category:
   *                       type: string
   *                     difficulty:
   *                       type: string
   *                     start_date:
   *                       type: string
   *                       format: date-time
   *                     end_date:
   *                       type: string
   *                       format: date-time
   *                     requirements:
   *                       type: array
   *                       items:
   *                         type: object
   *                     rewards:
   *                       type: array
   *                       items:
   *                         type: object
   *                     status:
   *                       type: string
   *                     days_remaining:
   *                       type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Challenge not found
   */
  fastify.get<{ Params: ChallengeParams }>(
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
    async (request: FastifyRequest<{ Params: ChallengeParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        const challenge = await fastify.achievements.challengeService.getChallengeById(id);
        
        if (!challenge) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not found' }]
          });
        }
        
        // Add days remaining
        const now = new Date();
        const endDate = new Date(challenge.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return reply.code(200).send({
          data: {
            ...challenge,
            days_remaining: daysRemaining
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
   * /api/v1/challenges/user:
   *   get:
   *     summary: Get current user's challenges
   *     description: Retrieves challenges for the authenticated user
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's challenges
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     active:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           challenge:
   *                             type: object
   *                           joined_at:
   *                             type: string
   *                             format: date-time
   *                           status:
   *                             type: string
   *                           progress:
   *                             type: array
   *                             items:
   *                               type: object
   *                     completed:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           challenge:
   *                             type: object
   *                           completed_at:
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
        
        const challenges = await fastify.achievements.challengeService.getUserChallenges(userId);
        
        return reply.code(200).send({
          data: challenges,
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
   * /api/v1/challenges/user/{userId}:
   *   get:
   *     summary: Get challenges for a specific user
   *     description: Retrieves challenges for a specific user
   *     tags: [Challenges]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User's challenges
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     active_count:
   *                       type: integer
   *                     completed_count:
   *                       type: integer
   *                     recent_completed:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           title:
   *                             type: string
   *                           completed_at:
   *                             type: string
   *                             format: date-time
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
        
        const challenges = await fastify.achievements.challengeService.getUserChallenges(userId);
        
        // For other users, we only return limited info
        const activeCount = challenges.active.length;
        const completedCount = challenges.completed.length;
        
        // Get 5 most recent completed challenges
        const recentCompleted = challenges.completed
          .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
          .slice(0, 5)
          .map(c => ({
            title: c.challenge.title,
            completed_at: c.completed_at
          }));
        
        return reply.code(200).send({
          data: {
            active_count: activeCount,
            completed_count: completedCount,
            recent_completed: recentCompleted
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
   * /api/v1/challenges/{id}/join:
   *   post:
   *     summary: Join a challenge
   *     description: Joins the authenticated user to a challenge
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Challenge ID
   *     responses:
   *       200:
   *         description: Challenge joined successfully
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
   *                     challenge:
   *                       type: object
   *                     joined_at:
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
   *       404:
   *         description: Challenge not found
   *       400:
   *         description: Challenge not active or already joined
   */
  fastify.post<{ Params: ChallengeParams }>(
    '/:id/join',
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
    async (request: FastifyRequest<{ Params: ChallengeParams }>, reply: FastifyReply) => {
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
        
        // Check if challenge exists
        const challenge = await fastify.achievements.challengeService.getChallengeById(id);
        if (!challenge) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not found' }]
          });
        }
        
        // Check if challenge is active
        if (challenge.status !== 'active') {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'VALIDATION_ERROR', message: 'Challenge is not active' }]
          });
        }
        
        // Check if already joined
        const isJoined = await fastify.achievements.challengeService.hasJoinedChallenge(userId, id);
        if (isJoined) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'VALIDATION_ERROR', message: 'Challenge already joined' }]
          });
        }
        
        // Join challenge
        const userChallenge = await fastify.achievements.challengeService.joinChallenge(userId, id);
        
        return reply.code(200).send({
          data: {
            success: true,
            challenge,
            joined_at: userChallenge.joined_at
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
   * /api/v1/challenges/{id}/progress:
   *   get:
   *     summary: Get challenge progress
   *     description: Retrieves progress for a specific challenge for the authenticated user
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Challenge ID
   *     responses:
   *       200:
   *         description: Challenge progress
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     challenge:
   *                       type: object
   *                     joined_at:
   *                       type: string
   *                       format: date-time
   *                     status:
   *                       type: string
   *                     overall_progress:
   *                       type: integer
   *                     requirements_progress:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           requirement_id:
   *                             type: string
   *                           current_value:
   *                             type: number
   *                           target_value:
   *                             type: number
   *                           percent_complete:
   *                             type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Challenge not found or not joined
   */
  fastify.get<{ Params: ChallengeParams }>(
    '/:id/progress',
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
    async (request: FastifyRequest<{ Params: ChallengeParams }>, reply: FastifyReply) => {
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
        
        // Check if joined challenge
        const isJoined = await fastify.achievements.challengeService.hasJoinedChallenge(userId, id);
        if (!isJoined) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not joined' }]
          });
        }
        
        // Get challenge progress
        const progress = await fastify.achievements.challengeService.getChallengeProgress(userId, id);
        
        if (!progress) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge progress not found' }]
          });
        }
        
        return reply.code(200).send({
          data: progress,
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
   * /api/v1/challenges/activity:
   *   post:
   *     summary: Update challenge progress
   *     description: Records activity for challenge progress for the authenticated user
   *     tags: [Challenges]
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
   *                 required: [activityType, value]
   *                 properties:
   *                   activityType:
   *                     type: string
   *                     description: Type of activity (e.g., content_creation, login)
   *                   value:
   *                     type: number
   *                     description: Value to add to the progress
   *                   referenceId:
   *                     type: string
   *                     description: Optional reference ID
   *                   metadata:
   *                     type: object
   *                     description: Optional metadata
   *     responses:
   *       200:
   *         description: Challenge progress updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     updated:
   *                       type: boolean
   *                     progressed:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           challengeId:
   *                             type: string
   *                           requirements:
   *                             type: array
   *                             items:
   *                               type: object
   *                     completed:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           challengeId:
   *                             type: string
   *                           rewards:
   *                             type: array
   *                             items:
   *                               type: object
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   */
  fastify.post<{ Body: ActivityDataRequest }>(
    '/activity',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['activityType', 'value'],
              properties: {
                activityType: { type: 'string' },
                value: { type: 'number' },
                referenceId: { type: 'string' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: ActivityDataRequest }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const activityData = request.body.data;
        
        // Update challenge progress
        const result = await fastify.achievements.challengeService.updateChallengeProgress(
          userId,
          activityData
        );
        
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
   * @openapi
   * /api/v1/challenges/{id}/abandon:
   *   post:
   *     summary: Abandon a challenge
   *     description: Abandons a challenge for the authenticated user
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Challenge ID
   *     responses:
   *       200:
   *         description: Challenge abandoned successfully
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
   *                     challenge_id:
   *                       type: string
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Challenge not found or not joined
   */
  fastify.post<{ Params: ChallengeParams }>(
    '/:id/abandon',
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
    async (request: FastifyRequest<{ Params: ChallengeParams }>, reply: FastifyReply) => {
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
        
        // Check if joined challenge
        const isJoined = await fastify.achievements.challengeService.hasJoinedChallenge(userId, id);
        if (!isJoined) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not joined' }]
          });
        }
        
        // Abandon challenge
        const success = await fastify.achievements.challengeService.abandonChallenge(userId, id);
        
        return reply.code(200).send({
          data: {
            success,
            challenge_id: id
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
   * Admin routes
   */

  /**
   * @openapi
   * /api/v1/challenges:
   *   post:
   *     summary: Create a new challenge (admin only)
   *     description: Creates a new challenge definition
   *     tags: [Challenges]
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
   *                 required: [title, description, category, difficulty, start_date, end_date, requirements, rewards]
   *                 properties:
   *                   title:
   *                     type: string
   *                   description:
   *                     type: string
   *                   image_url:
   *                     type: string
   *                   category:
   *                     type: string
   *                     enum: [daily, weekly, seasonal, special, onboarding]
   *                   difficulty:
   *                     type: string
   *                     enum: [easy, medium, hard, expert]
   *                   start_date:
   *                     type: string
   *                     format: date-time
   *                   end_date:
   *                     type: string
   *                     format: date-time
   *                   requirements:
   *                     type: array
   *                     items:
   *                       type: object
   *                   rewards:
   *                     type: array
   *                     items:
   *                       type: object
   *     responses:
   *       201:
   *         description: Challenge created successfully
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
   *                     title:
   *                       type: string
   *                     description:
   *                       type: string
   *                     image_url:
   *                       type: string
   *                     category:
   *                       type: string
   *                     difficulty:
   *                       type: string
   *                     start_date:
   *                       type: string
   *                       format: date-time
   *                     end_date:
   *                       type: string
   *                       format: date-time
   *                     requirements:
   *                       type: array
   *                       items:
   *                         type: object
   *                     rewards:
   *                       type: array
   *                       items:
   *                         type: object
   *                     status:
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
   */
  fastify.post(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
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
        
        const challengeData = request.body.data;
        
        // Create the challenge
        const challenge = await fastify.achievements.challengeService.createChallenge(challengeData);
        
        return reply.code(201).send({
          data: challenge,
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
   * /api/v1/challenges/{id}:
   *   put:
   *     summary: Update a challenge (admin only)
   *     description: Updates an existing challenge definition
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Challenge ID
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
   *                   title:
   *                     type: string
   *                   description:
   *                     type: string
   *                   image_url:
   *                     type: string
   *                   category:
   *                     type: string
   *                     enum: [daily, weekly, seasonal, special, onboarding]
   *                   difficulty:
   *                     type: string
   *                     enum: [easy, medium, hard, expert]
   *                   start_date:
   *                     type: string
   *                     format: date-time
   *                   end_date:
   *                     type: string
   *                     format: date-time
   *                   requirements:
   *                     type: array
   *                     items:
   *                       type: object
   *                   rewards:
   *                     type: array
   *                     items:
   *                       type: object
   *                   status:
   *                     type: string
   *                     enum: [upcoming, active, completed, expired]
   *     responses:
   *       200:
   *         description: Challenge updated successfully
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
   *                     title:
   *                       type: string
   *                     description:
   *                       type: string
   *                     image_url:
   *                       type: string
   *                     category:
   *                       type: string
   *                     difficulty:
   *                       type: string
   *                     start_date:
   *                       type: string
   *                       format: date-time
   *                     end_date:
   *                       type: string
   *                       format: date-time
   *                     requirements:
   *                       type: array
   *                       items:
   *                         type: object
   *                     rewards:
   *                       type: array
   *                       items:
   *                         type: object
   *                     status:
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
   *         description: Challenge not found
   */
  fastify.put<{ Params: ChallengeParams }>(
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
    async (request: FastifyRequest<{ Params: ChallengeParams }>, reply: FastifyReply) => {
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
        const challengeData = request.body.data;
        
        // Update the challenge
        const challenge = await fastify.achievements.challengeService.updateChallenge(id, challengeData);
        
        if (!challenge) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not found' }]
          });
        }
        
        return reply.code(200).send({
          data: challenge,
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
   * /api/v1/challenges/{id}:
   *   delete:
   *     summary: Delete a challenge (admin only)
   *     description: Deletes an existing challenge definition
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Challenge ID
   *     responses:
   *       200:
   *         description: Challenge deleted successfully
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
   *         description: Challenge not found
   */
  fastify.delete<{ Params: ChallengeParams }>(
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
    async (request: FastifyRequest<{ Params: ChallengeParams }>, reply: FastifyReply) => {
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
        
        // Delete the challenge
        const success = await fastify.achievements.challengeService.deleteChallenge(id);
        
        if (!success) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not found' }]
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
   * /api/v1/challenges/admin/complete:
   *   post:
   *     summary: Manually complete a challenge for a user (admin only)
   *     description: Manually completes a challenge for a specified user
   *     tags: [Challenges]
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
   *                 required: [userId, challengeId, reason]
   *                 properties:
   *                   userId:
   *                     type: string
   *                   challengeId:
   *                     type: string
   *                   reason:
   *                     type: string
   *     responses:
   *       200:
   *         description: Challenge completed successfully
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
   *                     challenge:
   *                       type: object
   *                     completed_at:
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
   *         description: Challenge not found or not joined
   */
  fastify.post<{ 
    Body: { 
      data: { 
        userId: string; 
        challengeId: string; 
        reason: string; 
      } 
    } 
  }>(
    '/admin/complete',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['userId', 'challengeId', 'reason'],
              properties: {
                userId: { type: 'string' },
                challengeId: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Body: { 
        data: { 
          userId: string; 
          challengeId: string; 
          reason: string; 
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
        
        const { userId, challengeId, reason } = request.body.data;
        
        // Check if joined challenge
        const isJoined = await fastify.achievements.challengeService.hasJoinedChallenge(userId, challengeId);
        if (!isJoined) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not joined' }]
          });
        }
        
        // Complete the challenge
        const result = await fastify.achievements.challengeService.completeChallenge(userId, challengeId, reason);
        
        // Get challenge details
        const challenge = await fastify.achievements.challengeService.getChallengeById(challengeId);
        
        return reply.code(200).send({
          data: {
            success: true,
            challenge,
            completed_at: result.completed_at
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
