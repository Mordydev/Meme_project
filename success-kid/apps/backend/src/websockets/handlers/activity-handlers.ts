/**
 * WebSocket Handlers for Activity Feed Events
 * 
 * Handles real-time delivery of activity feed updates via WebSockets.
 */
import { EventBus, EventType } from '../../lib/event-bus';
import { ConnectionRegistry } from '../connection-registry';
import { logger } from '../../lib/logger';
import { registerMessageForFallback } from '../fallback';
import { monitoringService } from '../../monitoring/service';

/**
 * Register activity-related WebSocket event handlers
 * 
 * @param eventBus Event bus for subscribing to events
 * @param connectionRegistry Registry for sending messages to connected clients
 */
export function registerActivityHandlers(
  eventBus: EventBus,
  connectionRegistry: ConnectionRegistry
): void {
  // Handle activity created event
  eventBus.subscribe(EventType.ACTIVITY_CREATED, (data) => {
    try {
      const { activity, recipients } = data;
      
      if (!activity || !recipients || !Array.isArray(recipients)) {
        logger.warn('Invalid activity data', { data });
        return;
      }
      
      // Create message for delivery
      const message = {
        type: 'activity.new',
        payload: {
          activity: formatActivityForClient(activity),
          timestamp: new Date().toISOString()
        }
      };
      
      // Deliver to each recipient
      for (const userId of recipients) {
        if (userId) {
          // Send to user's connections
          connectionRegistry.sendToUser(userId, message);
          
          // Register for fallback delivery
          registerMessageForFallback(userId, message.type, message.payload);
        }
      }
      
      // Track delivery metrics
      monitoringService.recordMetric('activity.delivery', recipients.length);
      
      logger.debug('Activity delivered via WebSocket', { 
        activityId: activity.id, 
        activityType: activity.type,
        recipientCount: recipients.length
      });
    } catch (error) {
      logger.error('Error delivering activity via WebSocket', { error, data });
    }
  });
  
  // Handle feed item created event
  eventBus.subscribe(EventType.FEED_ITEM_CREATED, (data) => {
    try {
      const { feedItem, recipientGroup, recipientIds, priority } = data;
      
      // Different delivery strategies based on recipient information
      if (recipientGroup) {
        // Deliver to a group channel
        const message = {
          type: 'feed.item.new',
          payload: {
            feedItem: formatFeedItemForClient(feedItem),
            timestamp: new Date().toISOString()
          }
        };
        
        // Send to channel
        connectionRegistry.sendToChannel(
          `group:${recipientGroup}`, 
          message,
          { priority: priority || 'normal' }
        );
        
        logger.debug('Feed item delivered to group via WebSocket', { 
          feedItemId: feedItem.id,
          group: recipientGroup
        });
      } else if (recipientIds && Array.isArray(recipientIds)) {
        // Deliver to specific recipients
        const message = {
          type: 'feed.item.new',
          payload: {
            feedItem: formatFeedItemForClient(feedItem),
            timestamp: new Date().toISOString()
          }
        };
        
        // Send to each recipient
        for (const userId of recipientIds) {
          if (userId) {
            // Send to user's connections
            connectionRegistry.sendToUser(
              userId, 
              message,
              { priority: priority || 'normal' }
            );
            
            // Register for fallback delivery
            registerMessageForFallback(userId, message.type, message.payload);
          }
        }
        
        logger.debug('Feed item delivered to recipients via WebSocket', { 
          feedItemId: feedItem.id,
          recipientCount: recipientIds.length
        });
      } else if (feedItem.isPublic) {
        // Deliver as public feed item to all connections
        const message = {
          type: 'feed.item.public',
          payload: {
            feedItem: formatFeedItemForClient(feedItem),
            timestamp: new Date().toISOString()
          }
        };
        
        // Broadcast to public feed channel
        connectionRegistry.sendToChannel(
          'feed:public', 
          message,
          { priority: priority || 'normal' }
        );
        
        logger.debug('Public feed item delivered via WebSocket', { 
          feedItemId: feedItem.id
        });
      }
      
      // Track delivery metrics
      monitoringService.recordMetric('feed.delivery', 1, {
        delivery_type: recipientGroup ? 'group' : (recipientIds ? 'targeted' : 'public')
      });
    } catch (error) {
      logger.error('Error delivering feed item via WebSocket', { error, data });
    }
  });
  
  // Handle feed items read event
  eventBus.subscribe(EventType.FEED_ITEMS_READ, (data) => {
    try {
      const { userId, itemIds } = data;
      
      if (!userId || !itemIds || !Array.isArray(itemIds)) {
        return;
      }
      
      // Create message
      const message = {
        type: 'feed.items.read',
        payload: {
          itemIds,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to all user's connections for cross-device sync
      connectionRegistry.sendToUser(userId, message, {
        priority: 'low' // Read status is lower priority
      });
      
      // Register for fallback delivery to ensure cross-device sync
      registerMessageForFallback(userId, message.type, message.payload);
      
      logger.debug('Feed items read status synced via WebSocket', { 
        userId, 
        itemCount: itemIds.length 
      });
    } catch (error) {
      logger.error('Error syncing feed items read status', { error, data });
    }
  });
  
  // Handle feed refresh request (server-triggered refresh)
  eventBus.subscribe('feed.refresh', (data) => {
    try {
      const { userId, feedType } = data;
      
      // Create message
      const message = {
        type: 'feed.refresh',
        payload: {
          feedType: feedType || 'all',
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to user or channel
      if (userId) {
        // Send to specific user
        connectionRegistry.sendToUser(userId, message, {
          priority: 'normal'
        });
        
        // Register for fallback delivery
        registerMessageForFallback(userId, message.type, message.payload);
        
        logger.debug('Feed refresh notification sent via WebSocket', { 
          userId, 
          feedType 
        });
      } else if (feedType && feedType !== 'all') {
        // Send to feed type channel
        connectionRegistry.sendToChannel(`feed:${feedType}`, message, {
          priority: 'normal'
        });
        
        logger.debug('Feed refresh notification sent to channel via WebSocket', { 
          feedType 
        });
      } else {
        // Broadcast to all (rare case for global feed refresh)
        connectionRegistry.broadcast(message, {
          priority: 'normal'
        });
        
        logger.debug('Global feed refresh notification broadcast via WebSocket');
      }
    } catch (error) {
      logger.error('Error sending feed refresh notification', { error, data });
    }
  });
  
  // Handle content created event
  eventBus.subscribe(EventType.CONTENT_CREATED, (data) => {
    try {
      const { content, userId } = data;
      
      if (!content || !content.id) {
        return;
      }
      
      // Create message for creator (confirmation)
      if (userId) {
        const creatorMessage = {
          type: 'content.created',
          payload: {
            content: formatContentForClient(content),
            status: 'success',
            timestamp: new Date().toISOString()
          }
        };
        
        // Send to creator with high priority
        connectionRegistry.sendToUser(userId, creatorMessage, {
          priority: 'high'
        });
        
        // Register for fallback delivery
        registerMessageForFallback(userId, creatorMessage.type, creatorMessage.payload);
      }
      
      // Create message for content feed
      const feedMessage = {
        type: 'content.new',
        payload: {
          content: formatContentForClient(content),
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to content type channel
      connectionRegistry.sendToChannel(
        `content:${content.type || 'general'}`, 
        feedMessage
      );
      
      logger.debug('Content created notification sent via WebSocket', { 
        contentId: content.id,
        contentType: content.type
      });
    } catch (error) {
      logger.error('Error sending content created notification', { error, data });
    }
  });
  
  // Handle content commented event
  eventBus.subscribe(EventType.CONTENT_COMMENTED, (data) => {
    try {
      const { comment, content, authorId } = data;
      
      if (!comment || !content || !content.id) {
        return;
      }
      
      // Create message for people subscribed to the content
      const commentMessage = {
        type: 'content.commented',
        payload: {
          comment: formatCommentForClient(comment),
          contentId: content.id,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send to content subscribers channel
      connectionRegistry.sendToChannel(
        `content:${content.id}:subscribers`, 
        commentMessage
      );
      
      // Send a different message to the content author if they're not the commenter
      if (content.user_id && content.user_id !== authorId) {
        const authorMessage = {
          type: 'content.new_comment',
          payload: {
            comment: formatCommentForClient(comment),
            contentId: content.id,
            timestamp: new Date().toISOString()
          }
        };
        
        // Send to content author
        connectionRegistry.sendToUser(content.user_id, authorMessage);
        
        // Register for fallback delivery
        registerMessageForFallback(content.user_id, authorMessage.type, authorMessage.payload);
      }
      
      logger.debug('Comment notification sent via WebSocket', { 
        commentId: comment.id,
        contentId: content.id
      });
    } catch (error) {
      logger.error('Error sending comment notification', { error, data });
    }
  });
}

/**
 * Format activity data for client consumption
 * 
 * @param activity Activity data from database
 * @returns Client-friendly activity
 */
function formatActivityForClient(activity: any): any {
  return {
    id: activity.id,
    type: activity.type,
    actorId: activity.actor_id,
    actorName: activity.actor_name,
    actorAvatar: activity.actor_avatar,
    targetId: activity.target_id,
    targetType: activity.target_type,
    data: activity.data || {},
    createdAt: activity.created_at
  };
}

/**
 * Format feed item data for client consumption
 * 
 * @param feedItem Feed item data from database
 * @returns Client-friendly feed item
 */
function formatFeedItemForClient(feedItem: any): any {
  return {
    id: feedItem.id,
    type: feedItem.type,
    contentId: feedItem.content_id,
    contentType: feedItem.content_type,
    actorId: feedItem.actor_id,
    actorName: feedItem.actor_name,
    actorAvatar: feedItem.actor_avatar,
    preview: feedItem.preview,
    data: feedItem.data || {},
    createdAt: feedItem.created_at,
    isPublic: !!feedItem.is_public
  };
}

/**
 * Format content data for client consumption
 * 
 * @param content Content data from database
 * @returns Client-friendly content
 */
function formatContentForClient(content: any): any {
  return {
    id: content.id,
    type: content.type,
    authorId: content.user_id,
    title: content.title,
    preview: content.preview || content.content_text?.substring(0, 100),
    createdAt: content.created_at,
    updatedAt: content.updated_at,
    metadata: content.metadata || {}
  };
}

/**
 * Format comment data for client consumption
 * 
 * @param comment Comment data from database
 * @returns Client-friendly comment
 */
function formatCommentForClient(comment: any): any {
  return {
    id: comment.id,
    contentId: comment.content_id,
    authorId: comment.user_id,
    authorName: comment.author_name,
    authorAvatar: comment.author_avatar,
    text: comment.comment_text,
    createdAt: comment.created_at
  };
}
