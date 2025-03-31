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
// Import handlers
import { getAllAchievementsHandler, getUserAchievementsHandler } from './handler'; 

export default async function registerAchievementRoutes(fastify: FastifyInstance) {
  
  // --- GET /achievements ---
  fastify.get('/', {
    schema: {
      tags: ['Achievements'],
      description: 'Retrieves a list of all available achievements.',
      response: { 200: ListAchievementsResponseSchema }
    },
    handler: getAllAchievementsHandler, // Use imported handler
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
    handler: getUserAchievementsHandler, // Use imported handler
  });

  // --- Other potential routes (placeholders, remove if not needed) ---
  // GET /achievements/:id - Get details of a specific achievement definition
  // POST /achievements/admin/award - Manually award an achievement (admin only)
}
