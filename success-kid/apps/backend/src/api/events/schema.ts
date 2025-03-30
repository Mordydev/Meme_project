/**
 * Schemas for the Events API module (Development/Testing)
 */

export const publishEventSchema = {
  description: 'Publish a test event',
  tags: ['events', 'development'],
  summary: 'Publish a test event for development purposes',
  body: {
    type: 'object',
    required: ['type', 'data'],
    properties: {
      type: { type: 'string', description: 'Event type' },
      data: { type: 'object', description: 'Event data', additionalProperties: true }, // Allow any data structure
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Define possible simulation event types
const simulationEventTypes = [
  'points.awarded',
  'achievement.unlocked',
  'content.created',
  'milestone.reached'
];

export const simulateEventSchema = {
  description: 'Simulate a predefined event',
  tags: ['events', 'development'],
  summary: 'Simulate a predefined event for development purposes',
  params: {
    type: 'object',
    required: ['eventType'],
    properties: {
      eventType: {
        type: 'string',
        enum: simulationEventTypes
      },
    },
  },
  body: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'Target user ID (if applicable)', nullable: true },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'object', additionalProperties: true }, // Allow any data structure
      },
    },
  },
};
