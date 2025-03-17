/**
 * Presence API Handlers
 * 
 * Implements route handlers for presence management
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { getPresenceService } from '../../services/presence';
import { PresenceStatus } from '../../models/presence';
import { logger } from '../../lib/logger';
import { NotFoundError, ForbiddenError } from '../../errors/api-errors';

/**
 * Get user presence
 */
export async function getUserPresence(
  request: FastifyRequest<{
    Params: { userId: string }
  }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  const presenceService = getPresenceService();
  
  const presence = await presenceService.getPresence(userId);
  
  if (!presence) {
    // Return offline if no presence found
    return reply.send({
      data: {
        userId,
        status: PresenceStatus.OFFLINE,
        lastActivity: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Format and return presence data
  return reply.send({
    data: {
      userId: presence.userId,
      status: presence.status,
      statusMessage: presence.metadata?.statusMessage,
      lastActivity: presence.lastActivity.toISOString(),
      lastLocation: presence.metadata?.lastLocation
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Update current user's presence
 */
export async function updatePresence(
  request: FastifyRequest<{
    Body: {
      status: PresenceStatus;
      statusMessage?: string;
      lastLocation?: string;
      metadata?: Record<string, any>;
    }
  }>,
  reply: FastifyReply
) {
  // Ensure user is authenticated
  if (!request.user?.id) {
    throw new ForbiddenError('Authentication required');
  }
  
  const userId = request.user.id;
  const { status, statusMessage, lastLocation, metadata = {} } = request.body;
  
  // Create metadata object
  const presenceMetadata = {
    ...metadata,
    statusMessage,
    lastLocation
  };
  
  // Update presence
  const presenceService = getPresenceService();
  const success = await presenceService.updatePresence(userId, {
    status,
    metadata: presenceMetadata
  });
  
  // Return result
  return reply.send({
    data: {
      success,
      status
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Get presence for multiple users
 */
export async function getMultiplePresence(
  request: FastifyRequest<{
    Body: {
      userIds: string[];
    }
  }>,
  reply: FastifyReply
) {
  const { userIds } = request.body;
  
  // Validate input
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return reply.send({
      data: {},
      meta: {
        timestamp: new Date().toISOString(),
        count: 0
      }
    });
  }
  
  // Limit to 100 users max
  const limitedUserIds = userIds.slice(0, 100);
  
  // Get presence for all users
  const presenceService = getPresenceService();
  const presenceMap = await presenceService.getMultiplePresence(limitedUserIds);
  
  // Format response
  const result: Record<string, any> = {};
  
  // Add data for users with presence
  for (const [userId, presence] of presenceMap.entries()) {
    result[userId] = {
      userId,
      status: presence.status,
      statusMessage: presence.metadata?.statusMessage,
      lastActivity: presence.lastActivity.toISOString(),
      lastLocation: presence.metadata?.lastLocation
    };
  }
  
  // Add offline status for users without presence
  for (const userId of limitedUserIds) {
    if (!result[userId]) {
      result[userId] = {
        userId,
        status: PresenceStatus.OFFLINE,
        lastActivity: new Date().toISOString()
      };
    }
  }
  
  // Return result
  return reply.send({
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
      count: Object.keys(result).length
    }
  });
}

/**
 * Get users present in a room
 */
export async function getRoomPresence(
  request: FastifyRequest<{
    Params: { roomId: string }
  }>,
  reply: FastifyReply
) {
  const { roomId } = request.params;
  
  // Get room presence
  const presenceService = getPresenceService();
  const roomPresence = await presenceService.getRoomPresence(roomId);
  
  // Format response
  const users = Array.from(roomPresence.values()).map(presence => ({
    userId: presence.userId,
    status: presence.status,
    statusMessage: presence.metadata?.statusMessage,
    lastActivity: presence.lastActivity.toISOString()
  }));
  
  // Return result
  return reply.send({
    data: users,
    meta: {
      timestamp: new Date().toISOString(),
      count: users.length
    }
  });
}

/**
 * Join a room
 */
export async function joinRoom(
  request: FastifyRequest<{
    Params: { roomId: string }
  }>,
  reply: FastifyReply
) {
  // Ensure user is authenticated
  if (!request.user?.id) {
    throw new ForbiddenError('Authentication required');
  }
  
  const userId = request.user.id;
  const { roomId } = request.params;
  
  // Get current presence
  const presenceService = getPresenceService();
  const currentPresence = await presenceService.getPresence(userId);
  
  // Use current status or default to online
  const status = currentPresence?.status || PresenceStatus.ONLINE;
  
  // Update presence with room ID
  const success = await presenceService.updatePresence(userId, {
    status,
    roomId,
    metadata: currentPresence?.metadata
  });
  
  // Return result
  return reply.send({
    data: {
      success,
      roomId
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Leave a room
 */
export async function leaveRoom(
  request: FastifyRequest<{
    Params: { roomId: string }
  }>,
  reply: FastifyReply
) {
  // Ensure user is authenticated
  if (!request.user?.id) {
    throw new ForbiddenError('Authentication required');
  }
  
  const userId = request.user.id;
  const { roomId } = request.params;
  
  // Get current presence
  const presenceService = getPresenceService();
  const currentPresence = await presenceService.getPresence(userId);
  
  // Check if user is in this room
  if (!currentPresence || currentPresence.roomId !== roomId) {
    return reply.send({
      data: {
        success: true // Already not in the room, so technically succeeded
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Update presence to remove room ID
  const success = await presenceService.updatePresence(userId, {
    status: currentPresence.status,
    roomId: undefined, // Remove room ID
    metadata: currentPresence.metadata
  });
  
  // Return result
  return reply.send({
    data: {
      success
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}
