/**
 * WebSocket Handlers for Points Events
 * 
 * Handles real-time updates for points-related events.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { logger } from '../../lib/logger';
import { registerMessageForFallback } from '../fallback';
import { messageBatcher } from '../message-batcher';
import { monitoringService } from '../../monitoring/service';

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
      const { userId, amount, source, total, sourceRef, description } = data;
      
      // Create notification message
      const message = {
        type: 'points.awarded',
        payload: {
          amount,
          source,
          total,
          sourceRef,
          description,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user with high priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'high',
        batchingEnabled: true
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      // If multiple points awards are coming quickly, optimize by updating rather than sending new messages
      if (messageBatcher.updateMessageValue(
        connectionRegistry.getConnectionIds(userId)[0],
        'points.balance',
        'total',
        total
      )) {
        logger.debug('Points balance updated in existing message', { userId, total });
      } else {
        // Send a balance update with normal priority
        const balanceMessage = {
          type: 'points.balance',
          payload: {
            total,
            timestamp: new Date().toISOString()
          }
        };
        
        connectionRegistry.sendToUser(userId, balanceMessage, {
          priority: 'normal'
        });
      }
      
      // Track metrics
      monitoringService.recordMetric('points.awarded.notifications', 1, { source });
      
      logger.debug('Points awarded notification sent', { userId, amount, source });
    } catch (error) {
      logger.error('Error sending points awarded notification', { error, data });
    }
  });
  
  // Handle points deducted event
  eventBus.subscribe(EventType.POINTS_DEDUCTED, (data) => {
    try {
      const { userId, amount, source, total, sourceRef, description } = data;
      
      // Create notification message
      const message = {
        type: 'points.deducted',
        payload: {
          amount,
          source,
          total,
          sourceRef,
          description,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user with high priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'high'
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      // Send a balance update 
      const balanceMessage = {
        type: 'points.balance',
        payload: {
          total,
          timestamp: new Date().toISOString()
        }
      };
      
      connectionRegistry.sendToUser(userId, balanceMessage, {
        priority: 'normal'
      });
      
      logger.debug('Points deducted notification sent', { userId, amount, source });
    } catch (error) {
      logger.error('Error sending points deducted notification', { error, data });
    }
  });
  
  // Handle points redeemed event
  eventBus.subscribe(EventType.POINTS_REDEEMED, (data) => {
    try {
      const { userId, pointsAmount, tokenAmount, transactionHash, status } = data;
      
      // Create notification message
      const message = {
        type: 'points.redeemed',
        payload: {
          pointsAmount,
          tokenAmount,
          transactionHash,
          status,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user with high priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'high'
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      logger.debug('Points redeemed notification sent', { 
        userId, 
        pointsAmount, 
        tokenAmount,
        status
      });
    } catch (error) {
      logger.error('Error sending points redeemed notification', { error, data });
    }
  });
  
  // Handle achievement unlocked event
  eventBus.subscribe(EventType.ACHIEVEMENT_UNLOCKED, (data) => {
    try {
      const { userId, achievement, pointsAwarded } = data;
      
      // Create notification message
      const message = {
        type: 'achievement.unlocked',
        payload: {
          achievement: {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            imageUrl: achievement.image_url,
            rarity: achievement.rarity || 'common',
            category: achievement.category || 'general'
          },
          pointsAwarded,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user with high priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'high',
        batchingEnabled: false // Achievement unlocks should be immediate
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      // Track metrics
      monitoringService.recordMetric('achievements.unlocked.notifications', 1);
      
      logger.debug('Achievement unlocked notification sent', { 
        userId, 
        achievementId: achievement.id,
        achievementName: achievement.name
      });
    } catch (error) {
      logger.error('Error sending achievement unlocked notification', { error, data });
    }
  });
  
  // Handle level up event
  eventBus.subscribe(EventType.USER_LEVEL_UP, (data) => {
    try {
      const { userId, newLevel, oldLevel, pointsAwarded, perks } = data;
      
      // Create notification message
      const message = {
        type: 'user.levelUp',
        payload: {
          newLevel,
          oldLevel,
          pointsAwarded,
          perks: perks || [],
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to the user with high priority
      connectionRegistry.sendToUser(userId, message, {
        priority: 'high',
        batchingEnabled: false // Level ups should be immediate
      });
      
      // Register for fallback delivery
      registerMessageForFallback(userId, message.type, message.payload);
      
      // Track metrics
      monitoringService.recordMetric('users.level_up.notifications', 1);
      
      logger.debug('Level up notification sent', { userId, newLevel, oldLevel });
    } catch (error) {
      logger.error('Error sending level up notification', { error, data });
    }
  });
  
  // Handle milestone reached event
  eventBus.subscribe(EventType.MILESTONE_REACHED, (data) => {
    try {
      const { milestone, marketCap, activeUserIds, pointsAwarded } = data;
      
      // Create public notification message
      const publicMessage = {
        type: 'milestone.reached',
        payload: {
          milestone,
          marketCap,
          timestamp: new Date().toISOString()
        }
      };
      
      // Broadcast to all connected users
      connectionRegistry.sendToChannel('announcements:public', publicMessage, {
        priority: 'normal'
      });
      
      // If active users were awarded points, send them a personalized message
      if (activeUserIds && Array.isArray(activeUserIds) && pointsAwarded) {
        const personalMessage = {
          type: 'milestone.reward',
          payload: {
            milestone,
            pointsAwarded,
            marketCap,
            message: `You earned ${pointsAwarded} points for being active during the ${milestone} milestone!`,
            timestamp: new Date().toISOString()
          }
        };
        
        // Send to each active user
        for (const userId of activeUserIds) {
          connectionRegistry.sendToUser(userId, personalMessage, {
            priority: 'high'
          });
          
          // Register for fallback delivery
          registerMessageForFallback(userId, personalMessage.type, personalMessage.payload);
        }
      }
      
      // Track metrics
      monitoringService.recordMetric('milestones.reached.notifications', 1);
      
      logger.debug('Milestone reached notification sent', { 
        milestone, 
        marketCap,
        activeUserCount: activeUserIds?.length || 0
      });
    } catch (error) {
      logger.error('Error sending milestone reached notification', { error, data });
    }
  });
  
  // Handle daily streak event (consecutive days login)
  eventBus.subscribe('user.streak.updated', (data) => {
    try {
      const { userId, currentStreak, lastStreakDate, pointsAwarded } = data;
      
      // Only notify if it's a meaningful streak (3+ days)
      if (currentStreak >= 3) {
        const message = {
          type: 'user.streak',
          payload: {
            currentStreak,
            pointsAwarded,
            timestamp: new Date().toISOString()
          }
        };
        
        // Send to the user with normal priority
        connectionRegistry.sendToUser(userId, message, {
          priority: 'normal'
        });
        
        // Register for fallback delivery
        registerMessageForFallback(userId, message.type, message.payload);
        
        logger.debug('Streak notification sent', { userId, currentStreak, pointsAwarded });
      }
    } catch (error) {
      logger.error('Error sending streak notification', { error, data });
    }
  });
}
