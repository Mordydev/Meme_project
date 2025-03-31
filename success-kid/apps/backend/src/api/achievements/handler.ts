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
    // Use getAchievementsForApi - assuming it returns the list of all definitions when userId is null
    // TODO: Implement filtering/logic in getAchievementsForApi as needed (e.g., pass filters from query)
    const achievements = await achievementService.getAchievementsForApi(null, {}); 
    
    // Map to response schema if necessary (e.g., date formatting)
    // Assuming getAchievementsForApi returns an array of objects matching AchievementListItemSchema structure
    const responseData = achievements.map((ach: { id: string; name: string; description: string; iconUrl: string | null; pointsAwarded: number; criteriaType: string; criteriaThreshold?: number; isSecret: boolean; category?: string }) => ({ 
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

    // Use getUserAchievementsForApi as suggested by previous error
    // TODO: Implement pagination and proper filtering ('all', 'unlocked', 'locked') directly in getUserAchievementsForApi
    // For now, fetch all and filter/paginate manually (less efficient)
    const allUserAchievements = await achievementService.getAchievementsForApi(userId, {}); // Fetch all for user

    let filteredAchievements = allUserAchievements;
    // Apply filtering based on query param
    if (filter === 'unlocked') {
        filteredAchievements = allUserAchievements.filter(ua => ua.userProgress?.isUnlocked);
    } else if (filter === 'locked') {
        // Filter for achievements where userProgress exists but is not unlocked
        filteredAchievements = allUserAchievements.filter(ua => ua.userProgress && !ua.userProgress.isUnlocked);
    } 
    // 'all' filter requires no additional filtering here
    
    // Apply pagination manually
    const total = filteredAchievements.length;
    const paginatedData = filteredAchievements.slice(offset, offset + limit);

    // Map data to response schema (e.g., date formatting)
    // Assuming getAchievementsForApi returns objects matching the required structure
    const responseData = paginatedData.map(ua => ({ 
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

    // Construct pagination object based on manual pagination
    const responsePagination = {
        total: total,
        limit: limit,
        offset: offset,
        // Calculate page and totalPages based on manual pagination
        page: Math.floor(offset / limit) + 1, 
        totalPages: Math.ceil(total / limit),
        hasMore: (offset + paginatedData.length) < total
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
