/**
 * WebSocket Handlers for Points Events
 * 
 * Handles real-time notifications for points-related events.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { logger } from '../../lib/logger';

/**
 * Register points-related WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to connected clients
 */
export function registerPointsEventHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry
): void {
  // Handle points awarded event
  eventBus.subscribe(EventType.POINTS_AWARDED, (data) => {
    try {
      const { userId, amount, source, total } = data;
      
      // Create notification message
      const message = {
        type: 'points.awarded',
        payload: {
          amount,
          source,
          total,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user who earned points
      connectionRegistry.sendToUser(userId, message);
      
      logger.debug('Points awarded notification sent', { userId, amount, source });
    } catch (error) {
      logger.error('Error sending points awarded notification', { error });
    }
  });
  
  // Handle points redeemed event
  eventBus.subscribe(EventType.POINTS_REDEEMED, (data) => {
    try {
      const { userId, pointsAmount, tokenAmount, transactionHash } = data;
      
      // Create notification message
      const message = {
        type: 'points.redeemed',
        payload: {
          pointsAmount,
          tokenAmount,
          transactionHash,
          status: 'completed',
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user who redeemed points
      connectionRegistry.sendToUser(userId, message);
      
      logger.debug('Points redeemed notification sent', { 
        userId, 
        pointsAmount, 
        tokenAmount
      });
    } catch (error) {
      logger.error('Error sending points redeemed notification', { error });
    }
  });
  
  // Handle achievement unlocked event (if it awards points)
  eventBus.subscribe(EventType.ACHIEVEMENT_UNLOCKED, (data) => {
    try {
      const { userId, achievement, pointsAwarded } = data;
      
      // Only notify if points were awarded
      if (pointsAwarded) {
        // Create notification message
        const message = {
          type: 'achievement.unlocked',
          payload: {
            achievement,
            pointsAwarded,
            timestamp: new Date().toISOString()
          }
        };
        
        // Send to the user who unlocked the achievement
        connectionRegistry.sendToUser(userId, message);
        
        logger.debug('Achievement unlocked notification sent', { 
          userId, 
          achievement: achievement.name,
          pointsAwarded
        });
      }
    } catch (error) {
      logger.error('Error sending achievement unlocked notification', { error });
    }
  });
  
  // Handle level up event
  eventBus.subscribe(EventType.LEVEL_UP, (data) => {
    try {
      const { userId, newLevel, pointsAwarded } = data;
      
      // Create notification message
      const message = {
        type: 'user.levelUp',
        payload: {
          newLevel,
          pointsAwarded,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user who leveled up
      connectionRegistry.sendToUser(userId, message);
      
      logger.debug('Level up notification sent', { 
        userId, 
        newLevel,
        pointsAwarded
      });
    } catch (error) {
      logger.error('Error sending level up notification', { error });
    }
  });
  
  // Handle market milestone reached event (might award points to active users)
  eventBus.subscribe(EventType.MILESTONE_REACHED, (data) => {
    try {
      const { milestone, marketCap, activeUserIds } = data;
      
      // Create notification message for all users
      const publicMessage = {
        type: 'milestone.reached',
        payload: {
          milestone,
          marketCap,
          timestamp: new Date().toISOString()
        }
      };
      
      // Broadcast to all connected users
      connectionRegistry.sendToAll(publicMessage);
      
      // If active users were awarded points, send them a personalized message
      if (activeUserIds && activeUserIds.length > 0) {
        const pointsMessage = {
          type: 'milestone.points',
          payload: {
            milestone,
            pointsAwarded: data.pointsAwarded,
            message: `You earned ${data.pointsAwarded} points for being active during the ${milestone} milestone!`,
            timestamp: new Date().toISOString()
          }
        };
        
        // Send to each active user
        activeUserIds.forEach(userId => {
          connectionRegistry.sendToUser(userId, pointsMessage);
        });
      }
      
      logger.debug('Milestone reached notification sent', { 
        milestone, 
        marketCap,
        recipientCount: connectionRegistry.getUserCount()
      });
    } catch (error) {
      logger.error('Error sending milestone reached notification', { error });
    }
  });
}
