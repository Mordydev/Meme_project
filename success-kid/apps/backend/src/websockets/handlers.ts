/**
 * WebSocket Event Handlers
 * 
 * Handlers for different WebSocket event types.
 */
import { WebSocket } from 'ws';
import { logger } from '../lib/logger';
import { handleWebSocketError } from '../errors/handlers';

/**
 * Handle ping event from client
 * 
 * @param socket WebSocket connection
 * @param payload Ping message payload
 */
export function handlePing(socket: WebSocket, payload: any): void {
  try {
    // Respond with pong message to maintain connection
    socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
  } catch (error) {
    handleWebSocketError(socket, error);
  }
}

/**
 * Handle user typing indicator
 * 
 * @param socket WebSocket connection
 * @param payload Typing indicator payload
 * @param userId User ID from authenticated connection
 */
export function handleTyping(socket: WebSocket, payload: any, userId: string): void {
  try {
    // This would normally broadcast to other users in a chat or content thread
    // But here we'll just log for demonstration
    logger.debug('User typing indicator', { userId, contentId: payload.contentId, isTyping: payload.isTyping });
  } catch (error) {
    handleWebSocketError(socket, error);
  }
}

/**
 * Handle content reaction
 * 
 * @param socket WebSocket connection
 * @param payload Reaction payload
 * @param userId User ID from authenticated connection
 */
export function handleReaction(socket: WebSocket, payload: any, userId: string): void {
  try {
    // This would normally store the reaction and notify other users
    // But here we'll just log for demonstration
    logger.debug('Content reaction', { 
      userId, 
      contentId: payload.contentId, 
      reactionType: payload.reactionType 
    });
    
    // Acknowledge successful reaction
    socket.send(JSON.stringify({
      type: 'reaction:success',
      payload: {
        contentId: payload.contentId,
        reactionType: payload.reactionType
      }
    }));
  } catch (error) {
    handleWebSocketError(socket, error);
  }
}

/**
 * Process WebSocket message based on message type
 * 
 * @param socket WebSocket connection
 * @param message Parsed message object
 * @param userId User ID from authenticated connection
 */
export function processMessage(socket: WebSocket, message: any, userId: string): void {
  // Validate message format
  if (!message || !message.type) {
    handleWebSocketError(socket, new Error('Invalid message format'));
    return;
  }
  
  // Route to appropriate handler based on message type
  switch (message.type) {
    case 'ping':
      handlePing(socket, message.payload);
      break;
    
    case 'user:typing':
      handleTyping(socket, message.payload, userId);
      break;
    
    case 'content:reaction':
      handleReaction(socket, message.payload, userId);
      break;
    
    default:
      logger.warn(`Unknown WebSocket message type: ${message.type}`, { userId });
      socket.send(JSON.stringify({
        type: 'error',
        payload: { message: `Unsupported message type: ${message.type}` }
      }));
  }
}
