import { WebSocket } from 'ws';
import { eventEmitter } from '../../lib/event-emitter';
import { logger } from '../../lib/logger';
import { SocketMessage } from '../types';
import { ConnectionRegistry } from '../connection-registry';

/**
 * Wallet WebSocket handler
 */
export function setupWalletHandler(registry: ConnectionRegistry): void {
  // Wallet balance updates
  eventEmitter.on('wallet:balance:update', (data) => {
    const { userId, balance, usdValue } = data;
    
    if (!userId) return;
    
    const message: SocketMessage = {
      type: 'wallet:balance:update',
      data: { balance, usdValue }
    };
    
    // Send to specific user
    registry.sendToUser(userId, JSON.stringify(message));
    
    logger.debug('Sent wallet balance update', { userId });
  });

  // Wallet transaction updates
  eventEmitter.on('wallet:transaction:new', (data) => {
    const { userId, transaction } = data;
    
    if (!userId) return;
    
    const message: SocketMessage = {
      type: 'wallet:transaction:new',
      data: { transaction }
    };
    
    // Send to specific user
    registry.sendToUser(userId, JSON.stringify(message));
    
    logger.debug('Sent wallet transaction update', { userId });
  });
  
  // Redemption status updates
  eventEmitter.on('redemption:status', (data) => {
    const { userId, redemptionId, status, transactionHash } = data;
    
    if (!userId) return;
    
    const message: SocketMessage = {
      type: 'redemption:status',
      data: { redemptionId, status, transactionHash }
    };
    
    // Send to specific user
    registry.sendToUser(userId, JSON.stringify(message));
    
    logger.debug('Sent redemption status update', { userId, redemptionId, status });
  });
}

/**
 * Handle wallet subscription request
 */
export function handleWalletSubscription(
  socket: WebSocket,
  userId: string | null,
  message: any,
  registry: ConnectionRegistry
): void {
  // Only authenticated users can subscribe to wallet updates
  if (!userId) {
    const errorResponse: SocketMessage = {
      type: 'subscription:error',
      data: {
        channel: 'wallet',
        message: 'Authentication required to subscribe to wallet updates'
      }
    };
    
    socket.send(JSON.stringify(errorResponse));
    return;
  }
  
  if (message.subscribe && message.channels) {
    if (message.channels.includes('wallet')) {
      registry.addToChannel(socket, `wallet:${userId}`);
      logger.debug('Socket subscribed to wallet updates', { userId });
      
      // Send confirmation message
      const response: SocketMessage = {
        type: 'subscription:success',
        data: {
          channel: 'wallet',
          message: 'Successfully subscribed to wallet updates'
        }
      };
      
      socket.send(JSON.stringify(response));
    }
    
    if (message.channels.includes('redemptions')) {
      registry.addToChannel(socket, `redemptions:${userId}`);
      logger.debug('Socket subscribed to redemption updates', { userId });
      
      // Send confirmation message
      const response: SocketMessage = {
        type: 'subscription:success',
        data: {
          channel: 'redemptions',
          message: 'Successfully subscribed to redemption updates'
        }
      };
      
      socket.send(JSON.stringify(response));
    }
  }
}
