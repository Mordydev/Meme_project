/**
 * Request Handlers for the Achievements API module
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { handleApiError } from '../../errors'; // Assuming error handler is accessible
import {
  AchievementParams,
  UserParams,
  AchievementQueryParams,
  UnlockAchievementBody,
  BadgeQueryParams, // Added import
  BadgeParams, // Added import
  BadgeEquipRequest, // Added import
  BadgeAwardRequest, // Added import
  // Challenge Types
  ChallengeQueryParams, // Added import
  ChallengeParams, // Added import
  ActivityDataRequest, // Added import
  // Leaderboard Types
  LeaderboardParams, // Added import
  LeaderboardQueryParams, // Added import
  // Level Types
  LevelParams, // Added import
  PaginationParams, // Added import
  XpAwardRequest, // Added import
  // Streak Types
  StreakParams, // Added import
  StreakActivityRequest // Added import
} from './types';

// Placeholder for achievement service - replace with actual import
// import { achievementService } from '../../services/achievement-service'; // Example import
// import { badgeService } from '../../services/badge-service'; // Example import

/**
 * Handler for getting all achievements
 */
export async function getAchievementsHandler(
  request: FastifyRequest<{ Querystring: AchievementQueryParams }>,
  reply: FastifyReply
) {
  try {
    const { category, difficulty, is_public, search } = request.query;

    const filter = {
      ...(category ? { category } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(is_public !== undefined ? { is_public } : {}),
      ...(search ? { search } : {})
    };

    // @ts-ignore - Assuming achievementService is decorated onto fastify instance or imported
    const achievements = await request.server.achievements.achievementService.getAchievements(
      Object.keys(filter).length > 0 ? filter : undefined
    );

    // Filter out hidden achievements for non-admin users
    // This would be enhanced with proper authorization logic
    const isAdmin = false; // Placeholder for actual admin check

    const filteredAchievements = isAdmin
      ? achievements
      : achievements.filter((a: any) => a.is_public); // Add type assertion if needed

    return reply.code(200).send({
      data: filteredAchievements,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting achievement by ID
 */
export async function getAchievementByIdHandler(
  request: FastifyRequest<{ Params: AchievementParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    // @ts-ignore - Assuming achievementService is decorated onto fastify instance or imported
    const achievement = await request.server.achievements.achievementService.getAchievementById(id);

    if (!achievement) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Achievement not found' }]
      });
    }

    // Check if hidden achievement and not admin
    // This would be enhanced with proper authorization logic
    const isAdmin = false; // Placeholder for actual admin check

    if (!achievement.is_public && !isAdmin) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Achievement not found' }]
      });
    }

    return reply.code(200).send({
      data: achievement,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting current user's achievements
 */
export async function getUserAchievementsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    // @ts-ignore - Assuming achievementService is decorated onto fastify instance or imported
    const achievements = await request.server.achievements.achievementService.getUserAchievements(userId, true);

    return reply.code(200).send({
      data: achievements,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting user's achievements by user ID
 */
export async function getUserAchievementsByIdHandler(
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;

    // Get unlocked achievements only (no progress for other users)
    // @ts-ignore - Assuming achievementService is decorated onto fastify instance or imported
    const achievements = await request.server.achievements.achievementService.getUserAchievements(userId, false);

    // Only include unlocked achievements
    const unlockedAchievements = achievements.filter((a: any) => a.unlocked_at); // Add type assertion if needed

    return reply.code(200).send({
      data: unlockedAchievements,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting achievement progress
 */
export async function getAchievementProgressHandler(
  request: FastifyRequest<{ Params: AchievementParams }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    const { id } = request.params;

    // Check if achievement exists
    // @ts-ignore - Assuming achievementService is decorated onto fastify instance or imported
    const achievement = await request.server.achievements.achievementService.getAchievementById(id);
    if (!achievement) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Achievement not found' }]
      });
    }

    // Get progress
    // @ts-ignore - Assuming achievementService is decorated onto fastify instance or imported
    const progress = await request.server.achievements.achievementService.getAchievementProgress(userId, id);

    if (!progress) {
      // No progress yet, return default values
      return reply.code(200).send({
        data: {
          currentValue: 0,
          targetValue: 1, // Default target value, might need adjustment based on actual achievement data
          percentComplete: 0,
          isComplete: false
        },
        meta: {
          timestamp: new Date().toISOString()
        }
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

/**
 * Handler for manually unlocking an achievement (admin only)
 */
export async function unlockAchievementHandler(
  request: FastifyRequest<{ Params: AchievementParams; Body: UnlockAchievementBody }>,
  reply: FastifyReply
) {
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
    const { userId } = request.body.data;

    // Check if achievement exists
    // @ts-ignore - Assuming achievementService is decorated onto fastify instance or imported
    const achievement = await request.server.achievements.achievementService.getAchievementById(id);
    if (!achievement) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Achievement not found' }]
      });
    }

    // Unlock the achievement
    // @ts-ignore - Assuming achievementService is decorated onto fastify instance or imported
    const userAchievement = await request.server.achievements.achievementService.manuallyUnlockAchievement(
      userId, id
    );

    return reply.code(200).send({
      data: {
        success: true,
        achievement,
        unlocked_at: userAchievement.unlocked_at
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

// --- Handlers from badge-routes.ts ---

/**
 * Handler for getting all badges
 */
export async function getBadgesHandler(
  request: FastifyRequest<{ Querystring: BadgeQueryParams }>,
  reply: FastifyReply
) {
  try {
    const { category, tier, search } = request.query;

    const filter = {
      ...(category ? { category } : {}),
      ...(tier ? { tier } : {}),
      ...(search ? { search } : {})
    };

    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const badges = await request.server.achievements.badgeService.getBadges(
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

/**
 * Handler for getting badge by ID
 */
export async function getBadgeByIdHandler(
  request: FastifyRequest<{ Params: BadgeParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const badge = await request.server.achievements.badgeService.getBadgeById(id);

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

/**
 * Handler for getting current user's badges
 */
export async function getUserBadgesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const badges = await request.server.achievements.badgeService.getUserBadges(userId);

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

/**
 * Handler for getting user's badges by user ID
 */
export async function getUserBadgesByIdHandler(
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;

    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const badges = await request.server.achievements.badgeService.getUserBadges(userId);

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

/**
 * Handler for getting current user's equipped badges
 */
export async function getEquippedBadgesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const badges = await request.server.achievements.badgeService.getEquippedBadges(userId);

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

/**
 * Handler for getting recommended badges for current user
 */
export async function getRecommendedBadgesHandler(
  request: FastifyRequest<{ Querystring: { limit?: number } }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    const { limit = 3 } = request.query;

    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const badges = await request.server.achievements.badgeService.getRecommendedBadges(userId, limit);

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

/**
 * Handler for equipping or unequipping a badge
 */
export async function equipBadgeHandler(
  request: FastifyRequest<{ Params: BadgeParams; Body: BadgeEquipRequest }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const hasBadge = await request.server.achievements.badgeService.hasBadge(userId, id);
    if (!hasBadge) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Badge not found or not owned by user' }]
      });
    }

    // Update badge equip status
    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const userBadge = await request.server.achievements.badgeService.toggleEquipBadge(
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

/**
 * Handler for creating a new badge (admin only)
 */
export async function createBadgeHandler(
  request: FastifyRequest<{ Body: { data: any } }>, // Use specific type if available
  reply: FastifyReply
) {
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
    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const badge = await request.server.achievements.badgeService.createBadge(badgeData);

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

/**
 * Handler for updating a badge (admin only)
 */
export async function updateBadgeHandler(
  request: FastifyRequest<{ Params: BadgeParams; Body: { data: any } }>, // Use specific type if available
  reply: FastifyReply
) {
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
    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const badge = await request.server.achievements.badgeService.updateBadge(id, badgeData);

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

/**
 * Handler for deleting a badge (admin only)
 */
export async function deleteBadgeHandler(
  request: FastifyRequest<{ Params: BadgeParams }>,
  reply: FastifyReply
) {
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
    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const success = await request.server.achievements.badgeService.deleteBadge(id);

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

/**
 * Handler for awarding a badge to a user (admin only)
 */
export async function awardBadgeHandler(
  request: FastifyRequest<{ Body: BadgeAwardRequest }>,
  reply: FastifyReply
) {
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
    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const userBadge = await request.server.achievements.badgeService.awardBadge({
      userId,
      badgeId,
      source,
      reason
    });

    // Get badge details
    // @ts-ignore - Assuming badgeService is decorated onto fastify instance or imported
    const badge = await request.server.achievements.badgeService.getBadgeById(badgeId);

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

// --- Handlers from challenge-routes.ts ---

/**
 * Handler for getting all challenges
 */
export async function getChallengesHandler(
  request: FastifyRequest<{ Querystring: ChallengeQueryParams }>,
  reply: FastifyReply
) {
  try {
    const { category, difficulty, status, active } = request.query;

    const filter = {
      ...(category ? { category } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(status ? { status } : {}),
      ...(active !== undefined ? { active } : {})
    };

    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const challenges = await request.server.achievements.challengeService.getChallenges(
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

/**
 * Handler for getting active challenges
 */
export async function getActiveChallengesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const challenges = await request.server.achievements.challengeService.getActiveChallenges();

    // Add days remaining
    const now = new Date();
    const challengesWithDaysRemaining = challenges.map((challenge: any) => { // Add type assertion
      const endDate = new Date(challenge.end_date);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...challenge,
        days_remaining: daysRemaining >= 0 ? daysRemaining : 0 // Ensure non-negative
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

/**
 * Handler for getting challenge by ID
 */
export async function getChallengeByIdHandler(
  request: FastifyRequest<{ Params: ChallengeParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const challenge = await request.server.achievements.challengeService.getChallengeById(id);

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
        days_remaining: daysRemaining >= 0 ? daysRemaining : 0 // Ensure non-negative
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting current user's challenges
 */
export async function getUserChallengesHandler_Challenge( // Renamed to avoid conflict
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const challenges = await request.server.achievements.challengeService.getUserChallenges(userId);

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

/**
 * Handler for getting challenges for a specific user
 */
export async function getUserChallengesByIdHandler_Challenge( // Renamed to avoid conflict
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;

    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const challenges = await request.server.achievements.challengeService.getUserChallenges(userId);

    // For other users, we only return limited info
    const activeCount = challenges.active.length;
    const completedCount = challenges.completed.length;

    // Get 5 most recent completed challenges
    const recentCompleted = challenges.completed
      .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()) // Add types
      .slice(0, 5)
      .map((c: any) => ({ // Add type
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

/**
 * Handler for joining a challenge
 */
export async function joinChallengeHandler(
  request: FastifyRequest<{ Params: ChallengeParams }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const challenge = await request.server.achievements.challengeService.getChallengeById(id);
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
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const isJoined = await request.server.achievements.challengeService.hasJoinedChallenge(userId, id);
    if (isJoined) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'VALIDATION_ERROR', message: 'Challenge already joined' }]
      });
    }

    // Join challenge
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const userChallenge = await request.server.achievements.challengeService.joinChallenge(userId, id);

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

/**
 * Handler for getting challenge progress
 */
export async function getChallengeProgressHandler(
  request: FastifyRequest<{ Params: ChallengeParams }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const isJoined = await request.server.achievements.challengeService.hasJoinedChallenge(userId, id);
    if (!isJoined) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not joined' }]
      });
    }

    // Get challenge progress
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const progress = await request.server.achievements.challengeService.getChallengeProgress(userId, id);

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

/**
 * Handler for updating challenge progress based on activity
 */
export async function updateChallengeProgressHandler(
  request: FastifyRequest<{ Body: ActivityDataRequest }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const result = await request.server.achievements.challengeService.updateChallengeProgress(
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

/**
 * Handler for abandoning a challenge
 */
export async function abandonChallengeHandler(
  request: FastifyRequest<{ Params: ChallengeParams }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const isJoined = await request.server.achievements.challengeService.hasJoinedChallenge(userId, id);
    if (!isJoined) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not joined' }]
      });
    }

    // Abandon challenge
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const success = await request.server.achievements.challengeService.abandonChallenge(userId, id);

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

/**
 * Handler for creating a new challenge (admin only)
 */
export async function createChallengeHandler(
  request: FastifyRequest<{ Body: { data: any } }>, // Use specific type if available
  reply: FastifyReply
) {
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
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const challenge = await request.server.achievements.challengeService.createChallenge(challengeData);

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

/**
 * Handler for updating a challenge (admin only)
 */
export async function updateChallengeHandler(
  request: FastifyRequest<{ Params: ChallengeParams; Body: { data: any } }>, // Use specific type if available
  reply: FastifyReply
) {
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
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const challenge = await request.server.achievements.challengeService.updateChallenge(id, challengeData);

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

/**
 * Handler for deleting a challenge (admin only)
 */
export async function deleteChallengeHandler(
  request: FastifyRequest<{ Params: ChallengeParams }>,
  reply: FastifyReply
) {
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
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const success = await request.server.achievements.challengeService.deleteChallenge(id);

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

/**
 * Handler for manually completing a challenge for a user (admin only)
 */
export async function completeChallengeHandler(
  request: FastifyRequest<{ Body: { data: { userId: string; challengeId: string; reason: string; } } }>,
  reply: FastifyReply
) {
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
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const isJoined = await request.server.achievements.challengeService.hasJoinedChallenge(userId, challengeId);
    if (!isJoined) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Challenge not joined' }]
      });
    }

    // Complete the challenge
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const result = await request.server.achievements.challengeService.completeChallenge(userId, challengeId, reason);

    // Get challenge details
    // @ts-ignore - Assuming challengeService is decorated onto fastify instance or imported
    const challenge = await request.server.achievements.challengeService.getChallengeById(challengeId);

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

// --- Handlers from leaderboard-routes.ts ---

/**
 * Handler for getting available leaderboard categories
 */
export async function getLeaderboardCategoriesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const categories = await request.server.achievements.leaderboardService.getLeaderboardCategories();

    return reply.code(200).send({
      data: categories,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting available leaderboard time periods
 */
export async function getLeaderboardPeriodsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const periods = await request.server.achievements.leaderboardService.getLeaderboardPeriods();

    return reply.code(200).send({
      data: periods,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting a specific leaderboard
 */
export async function getLeaderboardHandler(
  request: FastifyRequest<{ Params: LeaderboardParams; Querystring: LeaderboardQueryParams }>,
  reply: FastifyReply
) {
  try {
    const { category, period } = request.params;
    const { limit = 100, offset = 0 } = request.query;

    // Validate category and period
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const validCategories = await request.server.achievements.leaderboardService.getLeaderboardCategories();
    const validCategoryIds = validCategories.map((c: any) => c.id); // Add type

    if (!validCategoryIds.includes(category)) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Invalid category: ${category}. Valid categories are: ${validCategoryIds.join(', ')}`
        }]
      });
    }

    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const validPeriods = await request.server.achievements.leaderboardService.getLeaderboardPeriods();
    const validPeriodIds = validPeriods.map((p: any) => p.id); // Add type

    if (!validPeriodIds.includes(period)) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Invalid period: ${period}. Valid periods are: ${validPeriodIds.join(', ')}`
        }]
      });
    }

    // Get leaderboard
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const leaderboard = await request.server.achievements.leaderboardService.getLeaderboard(
      category,
      period,
      { limit, offset }
    );

    return reply.code(200).send({
      data: leaderboard,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting current user's rank in a leaderboard
 */
export async function getUserRankHandler(
  request: FastifyRequest<{ Params: LeaderboardParams }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    const { category, period } = request.params;

    // Validate category and period (simplified validation)
    const validCategories = ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'];
    const validPeriods = ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'];

    if (!validCategories.includes(category)) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`
        }]
      });
    }

    if (!validPeriods.includes(period)) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Invalid period: ${period}. Valid periods are: ${validPeriods.join(', ')}`
        }]
      });
    }

    // Get user's rank
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const userRank = await request.server.achievements.leaderboardService.getUserRank(
      userId,
      category,
      period
    );

    if (!userRank) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'User not on leaderboard' }]
      });
    }

    return reply.code(200).send({
      data: userRank,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting a specific user's rank in a leaderboard
 */
export async function getUserRankByIdHandler(
  request: FastifyRequest<{ Params: LeaderboardParams & UserParams }>,
  reply: FastifyReply
) {
  try {
    const { category, period, userId } = request.params;

    // Validate category and period (simplified validation)
    const validCategories = ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'];
    const validPeriods = ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'];

    if (!validCategories.includes(category)) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`
        }]
      });
    }

    if (!validPeriods.includes(period)) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Invalid period: ${period}. Valid periods are: ${validPeriods.join(', ')}`
        }]
      });
    }

    // Get user's rank
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const userRank = await request.server.achievements.leaderboardService.getUserRank(
      userId,
      category,
      period
    );

    if (!userRank) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'User not on leaderboard' }]
      });
    }

    // For other users, we return limited data (no nearby users)
    const publicUserRank = {
      rank: userRank.rank,
      score: userRank.score,
      previous_rank: userRank.previous_rank,
      total_participants: userRank.total_participants,
      percentile: userRank.percentile
    };

    return reply.code(200).send({
      data: publicUserRank,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting current user's leaderboard summary
 */
export async function getUserLeaderboardSummaryHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const summary = await request.server.achievements.leaderboardService.getUserLeaderboardSummary(userId);

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

/**
 * Handler for getting historical leaderboard snapshots
 */
export async function getLeaderboardHistoryHandler(
  request: FastifyRequest<{ Params: LeaderboardParams; Querystring: { limit?: number } }>,
  reply: FastifyReply
) {
  try {
    const { category, period } = request.params;
    const { limit = 30 } = request.query;

    // Validate category and period (simplified validation)
    const validCategories = ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'];
    const validPeriods = ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'];

    if (!validCategories.includes(category)) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`
        }]
      });
    }

    if (!validPeriods.includes(period)) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Invalid period: ${period}. Valid periods are: ${validPeriods.join(', ')}`
        }]
      });
    }

    // Get historical snapshots
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const snapshots = await request.server.achievements.leaderboardService.getLeaderboardHistory(
      category,
      period,
      limit
    );

    return reply.code(200).send({
      data: snapshots,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting a user's ranking history
 */
export async function getUserRankHistoryHandler(
  request: FastifyRequest<{ Params: UserParams; Querystring: { category?: string; period?: string; limit?: number; } }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;
    const { category, period, limit = 30 } = request.query;

    // Get user's ranking history
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const history = await request.server.achievements.leaderboardService.getUserRankHistory(
      userId,
      {
        category,
        period,
        limit
      }
    );

    return reply.code(200).send({
      data: history,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for manually refreshing leaderboards (admin only)
 */
export async function refreshLeaderboardHandler(
  request: FastifyRequest<{ Body: { data: { category: string; period: string; } } }>,
  reply: FastifyReply
) {
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

    const { category, period } = request.body.data;

    // Refresh leaderboard
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const result = await request.server.achievements.leaderboardService.refreshLeaderboard(category, period);

    return reply.code(200).send({
      data: {
        success: true,
        entries_processed: result.entriesProcessed,
        timestamp: result.timestamp
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for creating a leaderboard snapshot (admin only)
 */
export async function createLeaderboardSnapshotHandler(
  request: FastifyRequest<{ Body: { data: { category: string; period: string; } } }>,
  reply: FastifyReply
) {
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

    const { category, period } = request.body.data;

    // Create snapshot
    // @ts-ignore - Assuming leaderboardService is decorated onto fastify instance or imported
    const snapshot = await request.server.achievements.leaderboardService.createLeaderboardSnapshot(
      category,
      period
    );

    return reply.code(200).send({
      data: {
        success: true,
        snapshot_id: snapshot.id,
        snapshot_date: snapshot.snapshot_date
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

// --- Handlers from level-routes.ts ---

/**
 * Handler for getting all level definitions
 */
export async function getAllLevelDefinitionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming levelService is decorated onto fastify instance or imported
    const levels = await request.server.achievements.levelService.getAllLevelDefinitions();

    return reply.code(200).send({
      data: levels,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting level definition by level number
 */
export async function getLevelDefinitionHandler(
  request: FastifyRequest<{ Params: LevelParams }>,
  reply: FastifyReply
) {
  try {
    const { level } = request.params;

    // @ts-ignore - Assuming levelService is decorated onto fastify instance or imported
    const levelDefinition = await request.server.achievements.levelService.getLevelDefinition(level);

    if (!levelDefinition) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Level not found' }]
      });
    }

    return reply.code(200).send({
      data: levelDefinition,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting current user's level
 */
export async function getUserLevelHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    // @ts-ignore - Assuming levelService is decorated onto fastify instance or imported
    const userLevel = await request.server.achievements.levelService.getUserLevel(userId);

    return reply.code(200).send({
      data: userLevel,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting level for a specific user
 */
export async function getUserLevelByIdHandler(
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;

    // @ts-ignore - Assuming levelService is decorated onto fastify instance or imported
    const userLevel = await request.server.achievements.levelService.getUserLevel(userId);

    // For other users, we only return the level, not detailed XP information
    return reply.code(200).send({
      data: {
        level: userLevel.level,
        levelTitle: userLevel.levelTitle,
        benefits: userLevel.benefits
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting XP transactions for current user
 */
export async function getXpTransactionsHandler(
  request: FastifyRequest<{ Querystring: PaginationParams }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    const { limit = 20, offset = 0 } = request.query;

    // @ts-ignore - Assuming levelService is decorated onto fastify instance or imported
    const transactions = await request.server.achievements.levelService.getXpTransactions(
      userId, limit, offset
    );

    return reply.code(200).send({
      data: transactions,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting XP values for different activities
 */
export async function getXpValuesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming levelService is decorated onto fastify instance or imported
    const xpValues = request.server.achievements.levelService.getXpValues();

    return reply.code(200).send({
      data: xpValues,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for awarding XP to current user
 */
export async function awardXpHandler(
  request: FastifyRequest<{ Body: XpAwardRequest }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    const { amount, source, referenceId } = request.body.data;

    // Validate amount
    if (amount <= 0) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'VALIDATION_ERROR', message: 'XP amount must be positive' }]
      });
    }

    // Add XP and check for level up
    // @ts-ignore - Assuming levelService is decorated onto fastify instance or imported
    const result = await request.server.achievements.levelService.addXP({
      userId,
      amount,
      source,
      referenceId
    });

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

/**
 * Handler for awarding XP to a user (admin only)
 */
export async function adminAwardXpHandler(
  request: FastifyRequest<{ Body: { data: { userId: string; amount: number; reason?: string; } } }>,
  reply: FastifyReply
) {
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

    const { userId, amount, reason } = request.body.data;

    // Add XP and check for level up
    // @ts-ignore - Assuming levelService is decorated onto fastify instance or imported
    const result = await request.server.achievements.levelService.addXP({
      userId,
      amount,
      source: 'admin_award',
      referenceId: reason
    });

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

// --- Handlers from streak-routes.ts ---

/**
 * Handler for getting all streak definitions
 */
export async function getAllStreakDefinitionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming streakService is decorated onto fastify instance or imported
    const streaks = await request.server.achievements.streakService.getAllStreakDefinitions();

    return reply.code(200).send({
      data: streaks,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting streak definition by ID
 */
export async function getStreakDefinitionHandler(
  request: FastifyRequest<{ Params: StreakParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    // @ts-ignore - Assuming streakService is decorated onto fastify instance or imported
    const streak = await request.server.achievements.streakService.getStreakDefinition(id);

    if (!streak) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Streak not found' }]
      });
    }

    return reply.code(200).send({
      data: streak,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting current user's streaks
 */
export async function getUserStreaksHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    // @ts-ignore - Assuming streakService is decorated onto fastify instance or imported
    const streaks = await request.server.achievements.streakService.getUserStreaks(userId);

    return reply.code(200).send({
      data: streaks,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting streaks for a specific user
 */
export async function getUserStreaksByIdHandler(
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;

    // @ts-ignore - Assuming streakService is decorated onto fastify instance or imported
    const streaks = await request.server.achievements.streakService.getUserStreaks(userId);

    // For other users, we only return limited streak info
    const publicStreakData = streaks.map((streak: any) => ({ // Add type
      streak_name: streak.streak.name,
      current_count: streak.current_count,
      longest_count: streak.longest_count
    }));

    // Find best streak (highest current count)
    const bestStreak = publicStreakData.reduce((best: any, current: any) => // Add types
      current.current_count > best.count ? { streak_name: current.streak_name, count: current.current_count } : best,
      { streak_name: '', count: 0 }
    );

    return reply.code(200).send({
      data: {
        streaks: publicStreakData,
        best_streak: bestStreak.count > 0 ? bestStreak : null
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for getting user's status for a specific streak
 */
export async function getStreakStatusHandler(
  request: FastifyRequest<{ Params: StreakParams }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    const { id } = request.params;

    // @ts-ignore - Assuming streakService is decorated onto fastify instance or imported
    const streakStatus = await request.server.achievements.streakService.getStreakStatus(userId, id);

    if (!streakStatus) {
      return reply.code(404).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Streak not found' }]
      });
    }

    return reply.code(200).send({
      data: streakStatus,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for recording streak activity
 */
export async function recordStreakActivityHandler(
  request: FastifyRequest<{ Body: StreakActivityRequest }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
      });
    }

    const { activityType } = request.body.data;

    // Check if activity type is valid
    // @ts-ignore - Assuming streakService is decorated onto fastify instance or imported
    const validActivityTypes = await request.server.achievements.streakService.getValidActivityTypes();
    if (!validActivityTypes.includes(activityType)) {
      return reply.code(400).send({
        data: null,
        meta: { timestamp: new Date().toISOString() },
        errors: [{ code: 'VALIDATION_ERROR', message: 'Invalid activity type' }]
      });
    }

    // Record activity
    // @ts-ignore - Assuming streakService is decorated onto fastify instance or imported
    const result = await request.server.achievements.streakService.recordActivity(userId, activityType);

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

/**
 * Handler for resetting streaks (admin only)
 */
export async function resetStreaksHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
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

    // Reset expired streaks
    // @ts-ignore - Assuming streakService is decorated onto fastify instance or imported
    const resetCount = await request.server.achievements.streakService.resetExpiredStreaks();

    return reply.code(200).send({
      data: {
        resetCount
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Handler for manually recording streak activity for a user (admin only)
 */
export async function adminRecordStreakActivityHandler(
  request: FastifyRequest<{ Body: { data: { userId: string; activityType: string; reason?: string; } } }>,
  reply: FastifyReply
) {
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

    const { userId, activityType } = request.body.data;

    // Record activity
    // @ts-ignore - Assuming streakService is decorated onto fastify instance or imported
    const result = await request.server.achievements.streakService.recordActivity(userId, activityType);

    return reply.code(200).send({
      data: {
        success: true,
        ...result
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}
