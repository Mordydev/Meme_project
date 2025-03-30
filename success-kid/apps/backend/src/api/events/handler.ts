/**
 * Request Handlers for the Events API module (Development/Testing)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { eventBus, EventType } from '../../lib/event-bus'; // Assuming EventType is exported
import { PublishEventBody, SimulateEventParams, SimulateEventBody } from './types';

/**
 * Handler for publishing a test event
 */
export async function publishEventHandler(
  request: FastifyRequest<{ Body: PublishEventBody }>,
  reply: FastifyReply
) {
  const { type, data } = request.body;
  try {
    await eventBus.publish(type, data);
    return {
      success: true,
      message: `Event ${type} published successfully`,
    };
  } catch (error) {
    request.log.error('Error publishing event', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return reply.code(500).send({ // Send proper error response
      success: false,
      message: `Error publishing event: ${errorMessage}`,
    });
  }
}

/**
 * Handler for simulating a predefined event
 */
export async function simulateEventHandler(
  request: FastifyRequest<{ Params: SimulateEventParams; Body: SimulateEventBody }>,
  reply: FastifyReply
) {
  const { eventType } = request.params;
  const { userId = 'user_123' } = request.body; // Default userId for simulation

  let eventData: any = {};

  // Generate sample data based on event type
  switch (eventType) {
    case 'points.awarded':
      eventData = {
        userId,
        amount: Math.floor(Math.random() * 50) + 10,
        source: ['post_creation', 'comment', 'daily_login', 'achievement'][Math.floor(Math.random() * 4)],
        // Add other relevant fields like total if needed by subscribers
      };
      break;

    case 'achievement.unlocked':
      eventData = {
        userId,
        achievement: {
          id: `achievement_${Date.now()}`,
          name: ['First Post', 'Conversation Starter', 'Daily Devotion'][Math.floor(Math.random() * 3)],
          description: 'Simulated achievement description',
          image_url: '/images/achievement.png', // Use correct property name if different
        },
        // Add points awarded if applicable
      };
      break;

    case 'content.created':
      eventData = {
        id: `content_${Date.now()}`,
        authorId: userId, // Use consistent naming if possible
        authorName: ['Alice', 'Bob', 'Charlie'][Math.floor(Math.random() * 3)], // Use consistent naming if possible
        preview: 'This is a preview of the simulated content...',
        type: ['text', 'image', 'link'][Math.floor(Math.random() * 3)], // Use ContentType if available
      };
      break;

    case 'milestone.reached':
      const milestones = ['$100,000 Market Cap', '$500,000 Market Cap', '$1,000,000 Market Cap'];
      const values = ['$100,000', '$500,000', '$1,000,000'];
      const index = Math.floor(Math.random() * 3);
      eventData = {
        milestone: milestones[index],
        value: values[index],
        timestamp: new Date().toISOString(),
      };
      break;

    default:
      // Should not happen due to schema validation, but handle defensively
      return reply.code(400).send({
        success: false,
        message: 'Unknown event type for simulation',
      });
  }

  try {
    await eventBus.publish(eventType, eventData);
    return {
      success: true,
      message: `Event ${eventType} simulated successfully`,
      data: eventData,
    };
  } catch (error) {
    request.log.error('Error simulating event', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return reply.code(500).send({ // Send proper error response
      success: false,
      message: `Error simulating event: ${errorMessage}`,
    });
  }
}
