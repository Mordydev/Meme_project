import { WebSocket } from 'ws';
import { logger } from '../lib/logger';

/**
 * Registry for managing WebSocket connections
 */
export class ConnectionRegistry {
  private connections: Map<WebSocket, Set<string>> = new Map();
  private channels: Map<string, Set<WebSocket>> = new Map();
  private userConnections: Map<string, Set<WebSocket>> = new Map();
  
  /**
   * Add a socket to a specific channel
   */
  addToChannel(socket: WebSocket, channel: string): void {
    // Add channel to socket's subscriptions
    if (!this.connections.has(socket)) {
      this.connections.set(socket, new Set());
    }
    this.connections.get(socket)!.add(channel);
    
    // Add socket to channel's subscribers
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(socket);
    
    logger.debug(`Socket added to channel: ${channel}`);
  }
  
  /**
   * Remove a socket from a specific channel
   */
  removeFromChannel(socket: WebSocket, channel: string): void {
    // Remove channel from socket's subscriptions
    if (this.connections.has(socket)) {
      this.connections.get(socket)!.delete(channel);
    }
    
    // Remove socket from channel's subscribers
    if (this.channels.has(channel)) {
      this.channels.get(channel)!.delete(socket);
      
      // Clean up empty channels
      if (this.channels.get(channel)!.size === 0) {
        this.channels.delete(channel);
      }
    }
    
    logger.debug(`Socket removed from channel: ${channel}`);
  }
  
  /**
   * Register a socket as belonging to a user
   */
  registerUser(socket: WebSocket, userId: string): void {
    // Add socket to user's connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socket);
    
    // Add special user channel
    this.addToChannel(socket, `user:${userId}`);
    
    logger.debug(`Socket registered for user: ${userId}`);
  }
  
  /**
   * Remove all registrations for a socket
   */
  removeSocket(socket: WebSocket): void {
    // Get all channels for this socket
    const channels = this.connections.get(socket) || new Set();
    
    // Remove socket from all channels
    for (const channel of channels) {
      if (this.channels.has(channel)) {
        this.channels.get(channel)!.delete(socket);
        
        // Clean up empty channels
        if (this.channels.get(channel)!.size === 0) {
          this.channels.delete(channel);
        }
      }
    }
    
    // Remove socket from connections
    this.connections.delete(socket);
    
    // Remove socket from user connections
    for (const [userId, sockets] of this.userConnections.entries()) {
      if (sockets.has(socket)) {
        sockets.delete(socket);
        
        // Clean up empty user entries
        if (sockets.size === 0) {
          this.userConnections.delete(userId);
        }
      }
    }
    
    logger.debug('Socket removed from all registrations');
  }
  
  /**
   * Send a message to all sockets in a channel
   */
  sendToChannel(channel: string, message: string): void {
    const sockets = this.channels.get(channel) || new Set();
    
    for (const socket of sockets) {
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(message);
        }
      } catch (error) {
        logger.error('Error sending message to socket', { error });
      }
    }
    
    logger.debug(`Sent message to channel: ${channel}`, { recipients: sockets.size });
  }
  
  /**
   * Send a message to all sockets registered for a user
   */
  sendToUser(userId: string, message: string): void {
    const sockets = this.userConnections.get(userId) || new Set();
    
    for (const socket of sockets) {
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(message);
        }
      } catch (error) {
        logger.error('Error sending message to user socket', { error, userId });
      }
    }
    
    // Also send to user's channel
    this.sendToChannel(`user:${userId}`, message);
    
    logger.debug(`Sent message to user: ${userId}`, { recipients: sockets.size });
  }
  
  /**
   * Broadcast a message to all connected sockets
   */
  broadcast(message: string): void {
    for (const socket of this.connections.keys()) {
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(message);
        }
      } catch (error) {
        logger.error('Error broadcasting message to socket', { error });
      }
    }
    
    logger.debug('Broadcasted message to all sockets', { recipients: this.connections.size });
  }
  
  /**
   * Get the total number of connections
   */
  get connectionCount(): number {
    return this.connections.size;
  }
  
  /**
   * Get the number of users with active connections
   */
  get userCount(): number {
    return this.userConnections.size;
  }
  
  /**
   * Get the number of subscribers for a channel
   */
  getChannelCount(channel: string): number {
    return this.channels.get(channel)?.size || 0;
  }
}
