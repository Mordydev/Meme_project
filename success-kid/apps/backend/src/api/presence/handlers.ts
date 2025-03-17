/**
 * Presence API Handlers
 * 
 * Handles user presence API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  PresenceStatus,
  PresenceVisibility,
  UpdatePresenceDto,
  UpdatePresencePreferencesDto
} from '../../models/presence';
import { logger } from '../../lib/logger';

/**
 * Get user's presence status
 */
export async function getUserPresence(
  request: FastifyRequest<{
    Params: { id: string }
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const presenceService = request.diContainer.resolve('presenceService');
    
    const presence = await presenceService.getUserPresence(id);
    
    if (!presence) {
      reply.status(404).send({
        error: 'User presence not found',
        message: 'The specified user has no presence data'
      });
      return;
    }
    
    // Check if requesting user has permission to view this user's presence
    const preferences = await presenceService.getPresencePreferences(id);
    
    // If visibility is set to NOBODY, return offline status
    if (preferences.visibility === PresenceVisibility.NOBODY && id !== request.user.id) {
      reply.send({
        data: {
          userId: id,
          status: PresenceStatus.OFFLINE,
          lastActive: presence.lastActive
        }
      });
      return;
    }
    
    // TODO: Check for additional visibility rules (followers, etc.)
    
    reply.send({
      data: presence
    });
  } catch (error) {
    logger.error('Error getting user presence', { error, userId: request.params.id });
    reply.status(500).send({
      error: 'Failed to get user presence',
      message: error.message
    });
  }
}

/**
 * Get presence for multiple users
 */
export async function getUsersPresence(
  request: FastifyRequest<{
    Body: {
      userIds: string[];
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { userIds } = request.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      reply.status(400).send({
        error: 'Invalid request',
        message: 'User IDs array is required'
      });
      return;
    }
    
    const presenceService = request.diContainer.resolve('presenceService');
    const presences = await presenceService.getUsersPresence(userIds);
    
    reply.send({
      data: presences
    });
  } catch (error) {
    logger.error('Error getting users presence', { error, userIds: request.body.userIds });
    reply.status(500).send({
      error: 'Failed to get users presence',
      message: error.message
    });
  }
}

/**
 * Update user's own presence
 */
export async function updatePresence(
  request: FastifyRequest<{
    Body: UpdatePresenceDto
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const presenceUpdate = request.body;
    
    // Validate status
    if (!Object.values(PresenceStatus).includes(presenceUpdate.status)) {
      reply.status(400).send({
        error: 'Invalid status',
        message: 'Status must be one of: online, away, busy, offline'
      });
      return;
    }
    
    const presenceService = request.diContainer.resolve('presenceService');
    const presence = await presenceService.updatePresence(userId, presenceUpdate);
    
    reply.send({
      data: presence,
      message: 'Presence updated successfully'
    });
  } catch (error) {
    logger.error('Error updating presence', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to update presence',
      message: error.message
    });
  }
}

/**
 * Get online users
 */
export async function getOnlineUsers(
  request: FastifyRequest<{
    Querystring: {
      limit?: string;
    }
  }>,
  reply: FastifyReply
) {
  try {
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 100;
    const presenceService = request.diContainer.resolve('presenceService');
    
    const onlineUsers = await presenceService.getUsersByStatus(PresenceStatus.ONLINE, limit);
    
    reply.send({
      data: onlineUsers,
      meta: {
        count: onlineUsers.length
      }
    });
  } catch (error) {
    logger.error('Error getting online users', { error });
    reply.status(500).send({
      error: 'Failed to get online users',
      message: error.message
    });
  }
}

/**
 * Get presence preferences
 */
export async function getPresencePreferences(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    const presenceService = request.diContainer.resolve('presenceService');
    
    const preferences = await presenceService.getPresencePreferences(userId);
    
    reply.send({
      data: preferences
    });
  } catch (error) {
    logger.error('Error getting presence preferences', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to get presence preferences',
      message: error.message
    });
  }
}

/**
 * Update presence preferences
 */
export async function updatePresencePreferences(
  request: FastifyRequest<{
    Body: UpdatePresencePreferencesDto
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const preferencesUpdate = request.body;
    
    // Validate visibility
    if (preferencesUpdate.visibility && 
        !Object.values(PresenceVisibility).includes(preferencesUpdate.visibility)) {
      reply.status(400).send({
        error: 'Invalid visibility',
        message: 'Visibility must be one of: everyone, followers, friends, nobody'
      });
      return;
    }
    
    const presenceService = request.diContainer.resolve('presenceService');
    const preferences = await presenceService.updatePresencePreferences(userId, preferencesUpdate);
    
    reply.send({
      data: preferences,
      message: 'Presence preferences updated successfully'
    });
  } catch (error) {
    logger.error('Error updating presence preferences', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to update presence preferences',
      message: error.message
    });
  }
}
