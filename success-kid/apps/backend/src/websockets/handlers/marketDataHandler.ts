import { WebSocket } from 'ws';
import { eventEmitter } from '../../lib/event-emitter';
import { logger } from '../../lib/logger';
import { SocketMessage } from '../types';
import { ConnectionRegistry } from '../connection-registry';

/**
 * Market data WebSocket handler
 */
export function setupMarketDataHandler(registry: ConnectionRegistry): void {
  // Market data updates
  eventEmitter.on('market:update', (data) => {
    const message: SocketMessage = {
      type: 'market:update',
      data
    };

    // Broadcast to all connected clients
    registry.broadcast(JSON.stringify(message));
    
    logger.debug('Broadcasted market update', { recipients: registry.connectionCount });
  });

  // New transaction notifications
  eventEmitter.on('transaction:new', (data) => {
    const message: SocketMessage = {
      type: 'transaction:new',
      data
    };

    // Broadcast to all connected clients
    registry.broadcast(JSON.stringify(message));
    
    logger.debug('Broadcasted new transaction', { recipients: registry.connectionCount });
  });

  // Milestone achievement notifications
  eventEmitter.on('milestone:achieved', (data) => {
    const message: SocketMessage = {
      type: 'milestone:achieved',
      data
    };

    // Broadcast to all connected clients
    registry.broadcast(JSON.stringify(message));
    
    logger.debug('Broadcasted milestone achievement', { 
      milestone: data.milestone?.id,
      recipients: registry.connectionCount 
    });
  });
}

/**
 * Handle market data subscription request
 */
export function handleMarketSubscription(
  socket: WebSocket,
  userId: string | null,
  message: any,
  registry: ConnectionRegistry
): void {
  // Subscribe the socket to market updates
  if (message.subscribe && message.channels) {
    if (message.channels.includes('market')) {
      registry.addToChannel(socket, 'market');
      logger.debug('Socket subscribed to market updates', { userId });
      
      // Send confirmation message
      const response: SocketMessage = {
        type: 'subscription:success',
        data: {
          channel: 'market',
          message: 'Successfully subscribed to market updates'
        }
      };
      
      socket.send(JSON.stringify(response));
    }
    
    if (message.channels.includes('transactions')) {
      registry.addToChannel(socket, 'transactions');
      logger.debug('Socket subscribed to transaction updates', { userId });
      
      // Send confirmation message
      const response: SocketMessage = {
        type: 'subscription:success',
        data: {
          channel: 'transactions',
          message: 'Successfully subscribed to transaction updates'
        }
      };
      
      socket.send(JSON.stringify(response));
    }
  }
}
