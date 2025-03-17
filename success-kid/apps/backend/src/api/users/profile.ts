/**
 * User Profile API
 * 
 * Handlers for user profile endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../../services/user-service';
import { authMiddleware } from '../../auth';
import { logger } from '../../lib/logger';
import { UpdateProfileDto, updateProfileSchema } from '../../models/profile';
import { ValidationError, NotFoundError } from '../../errors';

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    
    // Get user with profile
    const userWithProfile = await userService.getUserWithProfile(userId);
    if (!userWithProfile) {
      throw new NotFoundError('User not found');
    }
    
    // Return user profile data
    return reply.send({
      data: {
        id: userWithProfile.user.id,
        displayName: userWithProfile.user.display_name,
        email: userWithProfile.user.email,
        username: userWithProfile.profile.username,
        bio: userWithProfile.profile.bio,
        avatarUrl: userWithProfile.profile.avatar_url,
        level: userWithProfile.profile.level,
        title: userWithProfile.profile.title,
        socialLinks: userWithProfile.profile.social_links,
        preferences: userWithProfile.profile.preferences,
        createdAt: userWithProfile.user.created_at
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting current user profile', { error });
    throw error;
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    
    // Get user with profile
    const userWithProfile = await userService.getUserWithProfile(id);
    if (!userWithProfile) {
      throw new NotFoundError('User not found');
    }
    
    // Return user profile data (with reduced fields for privacy)
    return reply.send({
      data: {
        id: userWithProfile.user.id,
        displayName: userWithProfile.user.display_name,
        username: userWithProfile.profile.username,
        bio: userWithProfile.profile.bio,
        avatarUrl: userWithProfile.profile.avatar_url,
        level: userWithProfile.profile.level,
        title: userWithProfile.profile.title,
        socialLinks: userWithProfile.profile.social_links
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting user profile', { error, userId: request.params.id });
    throw error;
  }
}

/**
 * Update current user profile
 */
export async function updateCurrentUserProfile(
  request: FastifyRequest<{ Body: UpdateProfileDto }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const data = request.body;
    
    // Validate input
    try {
      updateProfileSchema.parse(data);
    } catch (error) {
      throw new ValidationError('Invalid profile data', error);
    }
    
    // Update profile
    const updatedProfile = await userService.updateProfile(userId, data);
    
    // Return updated profile
    return reply.send({
      data: {
        id: userId,
        username: updatedProfile.username,
        bio: updatedProfile.bio,
        avatarUrl: updatedProfile.avatar_url,
        level: updatedProfile.level,
        title: updatedProfile.title,
        socialLinks: updatedProfile.social_links,
        preferences: updatedProfile.preferences
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error updating user profile', { error, userId: request.user.id });
    throw error;
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(
  request: FastifyRequest<{ Body: UpdateProfileDto }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const data = request.body;
    
    // Validate required fields for onboarding
    const validationSchema = updateProfileSchema.extend({
      username: updateProfileSchema.shape.username.refine(val => !!val, {
        message: 'Username is required for onboarding'
      }),
      bio: updateProfileSchema.shape.bio.refine(val => !!val, {
        message: 'Bio is required for onboarding'
      })
    });
    
    try {
      validationSchema.parse(data);
    } catch (error) {
      throw new ValidationError('Missing required onboarding fields', error);
    }
    
    // Complete onboarding
    const result = await userService.completeOnboarding(userId, data);
    
    // Return updated profile
    return reply.send({
      data: {
        id: userId,
        displayName: result.user.display_name,
        username: result.profile.username,
        bio: result.profile.bio,
        avatarUrl: result.profile.avatar_url,
        level: result.profile.level,
        title: result.profile.title,
        onboardingCompleted: true
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error completing onboarding', { error, userId: request.user.id });
    throw error;
  }
}

/**
 * Check username availability
 */
export async function checkUsernameAvailability(
  request: FastifyRequest<{ Params: { username: string } }>,
  reply: FastifyReply
) {
  try {
    const { username } = request.params;
    
    // Check availability
    const isAvailable = await userService.isUsernameAvailable(username);
    
    return reply.send({
      data: {
        username,
        available: isAvailable
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error checking username availability', { error, username: request.params.username });
    throw error;
  }
}

/**
 * Register profile routes
 */
export function registerProfileRoutes(fastify: any) {
  // Get current user profile
  fastify.get(
    '/api/v1/users/me/profile',
    { preHandler: authMiddleware({ required: true }) },
    getCurrentUserProfile
  );
  
  // Update current user profile
  fastify.put(
    '/api/v1/users/me/profile',
    { preHandler: authMiddleware({ required: true }) },
    updateCurrentUserProfile
  );
  
  // Complete onboarding
  fastify.post(
    '/api/v1/users/me/onboarding',
    { preHandler: authMiddleware({ required: true }) },
    completeOnboarding
  );
  
  // Get user profile by ID
  fastify.get(
    '/api/v1/users/:id/profile',
    { preHandler: authMiddleware({ required: false }) },
    getUserProfile
  );
  
  // Check username availability
  fastify.get(
    '/api/v1/users/check-username/:username',
    checkUsernameAvailability
  );
}
