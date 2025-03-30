/**
 * Schemas for the Presence API module
 */
import { PresenceStatus } from './types'; // Import the enum/type

// Define the enum values based on the original file
const presenceStatusEnum = ['online', 'away', 'busy', 'offline'];

export const updatePresenceSchema = {
  tags: ['Presence'],
  summary: 'Update user presence',
  description: 'Updates the current user\'s presence status',
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: presenceStatusEnum
      },
      customStatus: { type: 'string', nullable: true }
    }
  },
  response: {
    200: {
      description: 'Updated presence',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            status: { type: 'string', enum: presenceStatusEnum },
            lastActive: { type: 'string', format: 'date-time' },
            customStatus: { type: 'string', nullable: true }
          }
        }
      }
    }
  }
};

export const getPresenceSchema = {
  tags: ['Presence'],
  summary: 'Get current user presence',
  description: 'Returns the current user\'s presence status',
  response: {
    200: {
      description: 'User presence',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            status: { type: 'string', enum: presenceStatusEnum },
            lastActive: { type: 'string', format: 'date-time' },
            customStatus: { type: 'string', nullable: true }
          }
        }
      }
    }
  }
};

export const getPresenceBatchSchema = {
  tags: ['Presence'],
  summary: 'Get presence for multiple users',
  description: 'Returns presence status for multiple users',
  querystring: {
    type: 'object',
    required: ['userIds'],
    properties: {
      userIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 100 // Add a reasonable limit
      }
    }
  },
  response: {
    200: {
      description: 'User presence batch',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          // Describes a map where keys are user IDs
          additionalProperties: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: presenceStatusEnum },
              lastActive: { type: 'string', format: 'date-time' },
              customStatus: { type: 'string', nullable: true }
            }
          }
        }
      }
    }
  }
};

export const subscribePresenceSchema = {
  tags: ['Presence'],
  summary: 'Subscribe to presence updates',
  description: 'Subscribes to presence updates for specific users',
  body: {
    type: 'object',
    required: ['userIds'],
    properties: {
      userIds: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 100 // Add a reasonable limit
      }
    }
  },
  response: {
    200: {
      description: 'Subscription status',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            subscribed: { type: 'boolean' },
            userCount: { type: 'integer' }
          }
        }
      }
    }
  }
};
