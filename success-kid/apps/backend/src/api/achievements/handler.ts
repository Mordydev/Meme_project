/**
 * Achievements API Handlers
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { handleApiError } from '../../errors';
import { achievementService } from '../../services'; // Assuming service instance is exported
import { GetUserAchievementsParams, GetUserAchievementsQuery } from './types'; // Import correct types

/**
 * Handler to get all available achievements.
 */
export async function getAllAchievementsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Use getAchievementsForApi - it returns { data: AchievementListItem[], total: number }
    // TODO: Implement filtering/logic in getAchievementsForApi as needed (e.g., pass filters from query)
    const { data: achievementsData } = await achievementService.getAchievementsForApi(null, {}); // Destructure data

    // Map to response schema if necessary (e.g., date formatting)
    // Map over the destructured 'data' array
    const responseData = achievementsData.map((ach) => ({ // Map over the data array
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
}

/**
 * Handler to get a specific user's achievement progress.
 */
export async function getUserAchievementsHandler(
  // Ensure correct types are used for request generics
  request: FastifyRequest<{ Params: GetUserAchievementsParams; Querystring: GetUserAchievementsQuery }>, 
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;
    // Provide defaults for limit and offset from query
    const limit = request.query.limit ?? 50; 
    const offset = request.query.offset ?? 0;
    const filter = request.query.filter ?? 'all';

    // Pass pagination and filter options to the service method
    // Assume the service method will return { data: AchievementListItem[], total: number }
    const { data: achievementsData, total } = await achievementService.getAchievementsForApi(userId, {
      limit,
      offset,
      status: filter === 'all' ? undefined : (filter as 'locked' | 'unlocked' | 'in-progress'), // Pass filter as status, handle 'all'
    });

    // Map data to response schema (e.g., date formatting)
    // Map over the achievementsData array
    const responseData = achievementsData.map(ua => ({ // Type 'ua' should be AchievementListItem
        id: ua.id,
        name: ua.name,
        description: ua.description,
        iconUrl: ua.iconUrl,
        pointsAwarded: ua.pointsAwarded,
        criteriaType: ua.criteriaType,
        criteriaThreshold: ua.criteriaThreshold,
        isSecret: ua.isSecret,
        // Map userProgress fields correctly
        userId: userId, // Use userId from params
        unlockedAt: ua.userProgress?.unlockedAt ? ua.userProgress.unlockedAt.toISOString() : null,
        progress: ua.userProgress?.current ?? 0,
        isUnlocked: ua.userProgress?.isUnlocked ?? false
    }));

    // Construct pagination object using the total count from the service
    const responsePagination = {
        total: total,
        limit: limit,
        offset: offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
        hasMore: (offset + responseData.length) < total // Check if there are more items
    };

    return reply.code(200).send({
      data: responseData,
      meta: { timestamp: new Date().toISOString() },
      pagination: responsePagination, // Send calculated pagination
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

// Remove all other placeholder handlers related to badges, challenges, etc.
