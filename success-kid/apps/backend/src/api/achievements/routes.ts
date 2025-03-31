/**
 * Achievements API Routes
 */
import { FastifyInstance } from 'fastify';
import { handleApiError } from '../../errors';
import { achievementService } from '../../services'; // Assuming service instance is exported
import { 
    ListAchievementsResponseSchema,
    UserAchievementsResponseSchema,
    GetUserAchievementsParamsSchema,
    GetUserAchievementsQuerySchema
} from './schema';
import { GetUserAchievementsParams, GetUserAchievementsQuery } from './types'; // Assuming types exist

export default async function registerAchievementRoutes(fastify: FastifyInstance) {
  
  // --- GET /achievements ---
  fastify.get('/', {
    schema: {
      tags: ['Achievements'],
      description: 'Retrieves a list of all available achievements.',
      response: { 200: ListAchievementsResponseSchema }
    },
    handler: async (request, reply) => {
      try {
        // TODO: Implement achievementService.getAllAchievements()
        // This method should fetch all defined achievements, potentially filtering out secret ones unless requested by admin?
        const achievements = await achievementService.getAllAchievements(); // Placeholder call
        
        // Map to response schema if necessary (e.g., date formatting)
        const responseData = achievements.map(ach => ({
            id: ach.id,
            name: ach.name,
            description: ach.description,
            iconUrl: ach.iconUrl,
            pointsAwarded: ach.pointsAwarded,
            criteriaType: ach.criteriaType,
            criteriaThreshold: ach.criteriaThreshold,
            isSecret: ach.isSecret
        }));

        return reply.code(200).send({
          data: responseData,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  // --- GET /achievements/user/:userId ---
  fastify.get<{ Params: GetUserAchievementsParams; Querystring: GetUserAchievementsQuery }>('/user/:userId', {
    schema: {
      tags: ['Achievements'],
      description: "Retrieves a specific user's achievement progress.",
      params: GetUserAchievementsParamsSchema,
      querystring: GetUserAchievementsQuerySchema,
      response: { 200: UserAchievementsResponseSchema }
    },
    // TODO: Add authentication middleware if this shouldn't be public
    handler: async (request, reply) => {
      try {
        const { userId } = request.params;
        const { limit, offset, filter } = request.query;

        // TODO: Implement achievementService.getUserAchievements(userId, options)
        // This method should fetch user progress joined with achievement definitions
        // It should handle pagination and filtering ('all', 'unlocked', 'locked')
        const result = await achievementService.getUserAchievements(userId, { limit, offset, filter }); // Placeholder call

        // Map data to response schema (e.g., date formatting)
        const responseData = result.data.map(ua => ({
            id: ua.id,
            name: ua.name,
            description: ua.description,
            iconUrl: ua.iconUrl,
            pointsAwarded: ua.pointsAwarded,
            criteriaType: ua.criteriaType,
            criteriaThreshold: ua.criteriaThreshold,
            isSecret: ua.isSecret,
            userId: ua.userId,
            unlockedAt: ua.unlockedAt ? ua.unlockedAt.toISOString() : null,
            progress: ua.progress,
            isUnlocked: ua.isUnlocked
        }));

        // Construct pagination object
        const responsePagination = {
            total: result.pagination.total,
            limit: limit,
            offset: offset,
            page: result.pagination.page,
            totalPages: result.pagination.totalPages,
            hasMore: (offset + result.data.length) < result.pagination.total
        };

        return reply.code(200).send({
          data: responseData,
          meta: { timestamp: new Date().toISOString() },
          pagination: responsePagination,
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  // --- Other potential routes (placeholders, remove if not needed) ---
  // GET /achievements/:id - Get details of a specific achievement definition
  // POST /achievements/admin/award - Manually award an achievement (admin only)
}
