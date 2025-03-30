/**
 * Request Handlers for the Presence API module
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  presenceService,
  PresenceStatus
} from '../../presence'; // Assuming presenceService is exported from the service index
import { UpdatePresenceBody, GetPresenceQuery, SubscribePresenceBody } from './types';

/**
 * Handler for updating user presence
 */
export async function updatePresenceHandler(
  request: FastifyRequest<{ Body: UpdatePresenceBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user.id;
    const { status, customStatus } = request.body;

    // Update presence
    const presence = await presenceService.updatePresence(userId, status, {
      customStatus,
      source: 'api'
    });

    return reply.send({
      data: {
        userId: presence.userId,
        status: presence.status,
        lastActive: presence.lastActive.toISOString(),
        customStatus: presence.customStatus
      }
    });
  } catch (error) {
    request.log.error('Error updating presence', error);
    return reply.status(500).send({
      error: 'Failed to update presence'
    });
  }
}

/**
 * Handler for getting current user presence
 */
export async function getPresenceHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user.id;

    // Get presence
    const presence = await presenceService.getUserPresence(userId);

    if (!presence) {
      // Return default offline status if no presence data
      return reply.send({
        data: {
          userId,
          status: PresenceStatus.OFFLINE,
          lastActive: new Date(0).toISOString(),
          customStatus: null // Ensure customStatus is null or undefined
        }
      });
    }

    return reply.send({
      data: {
        userId: presence.userId,
        status: presence.status,
        lastActive: presence.lastActive.toISOString(),
        customStatus: presence.customStatus
      }
    });
  } catch (error) {
    request.log.error('Error getting presence', error);
    return reply.status(500).send({
      error: 'Failed to get presence'
    });
  }
}

/**
 * Handler for getting presence for multiple users
 */
export async function getPresenceBatchHandler(
  request: FastifyRequest<{ Querystring: GetPresenceQuery }>,
  reply: FastifyReply
) {
  try {
    const userIds = request.query.userIds;

    // Get presence for multiple users
    const presenceMap = await presenceService.getUsersPresence(userIds);

    // Transform for response
    const responseData: Record<string, any> = {};

    presenceMap.forEach((presence, userId) => {
      responseData[userId] = {
        status: presence.status,
        lastActive: presence.lastActive.toISOString(),
        customStatus: presence.customStatus
      };
    });

    // Ensure all requested userIds are present in the response, even if offline
    userIds.forEach(id => {
      if (!responseData[id]) {
        responseData[id] = {
          status: PresenceStatus.OFFLINE,
          lastActive: new Date(0).toISOString(),
          customStatus: null
        };
      }
    });


    return reply.send({
      data: responseData
    });
  } catch (error) {
    request.log.error('Error getting batch presence', error);
    return reply.status(500).send({
      error: 'Failed to get presence'
    });
  }
}

/**
 * Handler for subscribing to presence updates
 */
export async function subscribePresenceHandler(
  request: FastifyRequest<{ Body: SubscribePresenceBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user.id;
    const targetIds = request.body.userIds;

    // Subscribe to presence updates
    await presenceService.subscribeToPresence(userId, targetIds);

    return reply.send({
      data: {
        subscribed: true,
        userCount: targetIds.length
      }
    });
  } catch (error) {
    request.log.error('Error subscribing to presence', error);
    return reply.status(500).send({
      error: 'Failed to subscribe to presence updates'
    });
  }
}
