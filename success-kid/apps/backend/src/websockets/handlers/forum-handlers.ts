/**
 * Forum WebSocket Handlers
 * 
 * Handles real-time events for forums and threads
 */
import { WebSocket, RawData } from 'ws';
import { eventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { ConnectionManager } from '../connection-manager';
import { ClientMessage } from '../message-batcher';

/**
 * Initialize forum WebSocket handlers
 * 
 * @param connectionManager WebSocket connection manager
 */
export function initializeForumHandlers(connectionManager: ConnectionManager): void {
  // 1. Thread created handler
  eventBus.subscribe(EventType.CONTENT_CREATED, (event) => {
    if (event.contentType === 'thread') {
      try {
        // Notify users subscribed to the category
        const categoryId = event.additionalData?.categoryId;
        if (categoryId) {
          connectionManager.sendToChannel(`category:${categoryId}`, {
            type: 'thread.created',
            data: {
              threadId: event.contentId,
              title: event.additionalData?.threadTitle || 'New thread',
              categoryId,
              userId: event.userId,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        // Notify users in the forum
        const forumId = event.additionalData?.forumId;
        if (forumId) {
          connectionManager.sendToChannel(`forum:${forumId}`, {
            type: 'thread.created',
            data: {
              threadId: event.contentId,
              title: event.additionalData?.threadTitle || 'New thread',
              forumId,
              userId: event.userId,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        logger.debug('Sent thread.created notifications', { threadId: event.contentId });
      } catch (error) {
        logger.error('Error sending thread.created notifications', { error });
      }
    }
  });
  
  // 2. Comment/Reply created handler
  eventBus.subscribe(EventType.COMMENT_CREATED, (event) => {
    if (event.contentType === 'thread') {
      try {
        // Notify users subscribed to the thread
        connectionManager.sendToChannel(`thread:${event.threadId}`, {
          type: 'reply.created',
          data: {
            replyId: event.commentId,
            threadId: event.threadId,
            userId: event.userId,
            timestamp: new Date().toISOString()
          }
        });
        
        // Notify thread owner if different from commenter
        if (event.threadUserId && event.threadUserId !== event.userId) {
          connectionManager.sendToUser(event.threadUserId, {
            type: 'notification.new',
            data: {
              type: 'thread_reply',
              threadId: event.threadId,
              replyId: event.commentId,
              actorId: event.userId,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        logger.debug('Sent reply.created notifications', { threadId: event.threadId, replyId: event.commentId });
      } catch (error) {
        logger.error('Error sending reply.created notifications', { error });
      }
    }
  });
  
  // 3. Message handlers for client subscriptions
  connectionManager.addMessageHandler('subscribe.thread', (connection, message: ClientMessage) => {
    try {
      const { threadId } = message.data;
      if (threadId) {
        connection.subscribe(`thread:${threadId}`);
        logger.debug('Client subscribed to thread', { connectionId: connection.id, threadId });
      }
    } catch (error) {
      logger.error('Error handling subscribe.thread message', { error, message });
    }
  });
  
  connectionManager.addMessageHandler('subscribe.category', (connection, message: ClientMessage) => {
    try {
      const { categoryId } = message.data;
      if (categoryId) {
        connection.subscribe(`category:${categoryId}`);
        logger.debug('Client subscribed to category', { connectionId: connection.id, categoryId });
      }
    } catch (error) {
      logger.error('Error handling subscribe.category message', { error, message });
    }
  });
  
  connectionManager.addMessageHandler('subscribe.forum', (connection, message: ClientMessage) => {
    try {
      const { forumId } = message.data;
      if (forumId) {
        connection.subscribe(`forum:${forumId}`);
        logger.debug('Client subscribed to forum', { connectionId: connection.id, forumId });
      }
    } catch (error) {
      logger.error('Error handling subscribe.forum message', { error, message });
    }
  });
  
  // 4. Presence indicators for threads
  connectionManager.addMessageHandler('presence.thread', (connection, message: ClientMessage) => {
    try {
      const { threadId, action } = message.data;
      if (threadId && connection.userId) {
        if (action === 'enter') {
          // User entered thread view
          connectionManager.sendToChannel(`thread:${threadId}`, {
            type: 'presence.update',
            data: {
              threadId,
              userId: connection.userId,
              action: 'enter',
              timestamp: new Date().toISOString()
            }
          });
        } else if (action === 'leave') {
          // User left thread view
          connectionManager.sendToChannel(`thread:${threadId}`, {
            type: 'presence.update',
            data: {
              threadId,
              userId: connection.userId,
              action: 'leave',
              timestamp: new Date().toISOString()
            }
          });
        }
        
        logger.debug('Processed presence update', { threadId, userId: connection.userId, action });
      }
    } catch (error) {
      logger.error('Error handling presence.thread message', { error, message });
    }
  });
}
