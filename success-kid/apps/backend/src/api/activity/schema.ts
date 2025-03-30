/**
 * Schemas for the Activity API module
 */

export const getFeedSchema = {
  tags: ['Activity'],
  summary: 'Get user activity feed',
  description: 'Returns the activity feed for the authenticated user',
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'integer', default: 20 },
      before: { type: 'string' },
      after: { type: 'string' },
      types: {
        type: 'array',
        items: { type: 'string' }
      },
      actors: {
        type: 'array',
        items: { type: 'string' }
      },
      aggregated: { type: 'boolean', default: false }
    }
  },
  response: {
    200: {
      description: 'User activity feed',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            // Note: The response structure differs based on 'aggregated' query param.
            // OpenAPI 3.0 doesn't easily support conditional schemas based on query params.
            // We'll define a general structure here, or potentially use 'oneOf' if needed,
            // but for simplicity, let's keep it general or document the difference.
            // Example for non-aggregated:
            type: 'object',
            properties: {
              id: { type: 'string' },
              activityId: { type: 'string' }, // Added based on handler logic
              type: { type: 'string' },
              actorId: { type: 'string' },
              data: { type: 'object' },
              isRead: { type: 'boolean' }, // Added based on handler logic
              createdAt: { type: 'string', format: 'date-time' }
            }
            // Example for aggregated would be different
          }
        }
      }
    }
  }
};

export const markReadSchema = {
  tags: ['Activity'],
  summary: 'Mark feed items as read',
  description: 'Marks specific feed items as read',
  body: {
    type: 'object',
    required: ['feedItemIds'],
    properties: {
      feedItemIds: {
        type: 'array',
        items: { type: 'string' }
      }
    }
  },
  response: {
    200: {
      description: 'Feed items marked as read',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            count: { type: 'integer' }
          }
        }
      }
    }
  }
};

export const markReadAllSchema = {
  tags: ['Activity'],
  summary: 'Mark all feed items as read',
  description: 'Marks all feed items for the current user as read',
  response: {
    200: {
      description: 'Feed items marked as read',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            count: { type: 'integer' }
          }
        }
      }
    }
  }
};
