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
        // Use the correct method to get all achievements
        const achievements = await achievementService.getAchievementsForApi(null, {});
        
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

        // Use getAchievementsForApi with userId and proper filters
        const filterMap: { [key: string]: string | undefined } = {
          'all': undefined,
          'unlocked': 'unlocked',
          'locked': 'locked'
        };
        
        // Fetch all achievements with user progress data
        const achievements = await achievementService.getAchievementsForApi(userId, {
          status: filterMap[filter as string] as any
        });
        
        // Calculate pagination manually
        const total = achievements.length;
        const startIndex = offset || 0;
        const endIndex = Math.min((offset || 0) + (limit || 20), total);
        const data = achievements.slice(startIndex, endIndex);
        const page = Math.floor((offset || 0) / (limit || 20)) + 1;
        const totalPages = Math.ceil(total / (limit || 20));
        
        // Create result wrapper to match interface expected by response mapping
        const result = {
          data,
          pagination: {
            total,
            page,
            totalPages
          }
        };

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
            limit: limit || 20,
            offset: offset || 0,
            page: result.pagination.page,
            totalPages: result.pagination.totalPages,
            hasMore: ((offset || 0) + result.data.length) < result.pagination.total
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
