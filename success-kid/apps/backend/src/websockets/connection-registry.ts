import { WebSocket } from 'ws';
import { logger } from '../lib/logger';

/**
 * Manages WebSocket connections for users
 * Tracks connections by user ID and handles sending messages
 */
export class ConnectionRegistry {
  private connections: Map<string, Set<WebSocket>> = new Map();
  // Event handlers for connection events
  private eventHandlers: Map<string, Array<Function>> = new Map();
  
  /**
   * Add a WebSocket connection for a user
   * @param userId User identifier
   * @param socket WebSocket connection
   */
  add(userId: string, socket: WebSocket): void {
    // Initialize user's connection set if needed
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    
    // Add the socket to the user's connections
    this.connections.get(userId)!.add(socket);
    
    // Get previous connection count
    const previousConnectionCount = this.getUserConnectionCount(userId) - 1;
    
    logger.debug(`Added connection for user ${userId}. Total connections: ${this.getConnectionCount()}`);
    
    // Emit connection event
    this.emit('connection', userId, { previousConnectionCount });
  }
  
  /**
   * Remove a WebSocket connection for a user
   * @param userId User identifier
   * @param socket WebSocket connection to remove
   */
  remove(userId: string, socket: WebSocket): void {
    const userConnections = this.connections.get(userId);
    
    if (userConnections) {
      // Get current connection count before removal
      const previousConnectionCount = userConnections.size;
      
      // Remove the specific socket
      userConnections.delete(socket);
      
      // Get new connection count
      const newConnectionCount = userConnections.size;
      
      // Clean up user entry if no connections remain
      if (newConnectionCount === 0) {
        this.connections.delete(userId);
      }
      
      logger.debug(`Removed connection for user ${userId}. Total connections: ${this.getConnectionCount()}`);
      
      // Emit disconnection event
      this.emit('disconnection', userId, newConnectionCount);
    }
  }
  
  /**
   * Send a message to a specific user across all their connections
   * @param userId User identifier
   * @param event Event type
   * @param payload Message payload
   */
  sendToUser(userId: string, event: string, payload: any): void {
    const userConnections = this.connections.get(userId);
    
    if (userConnections && userConnections.size > 0) {
      const message = JSON.stringify({ event, payload });
      
      userConnections.forEach(socket => {
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
          }
        } catch (error) {
          logger.error(`Error sending message to user ${userId}`, { error });
        }
      });
      
      logger.debug(`Sent message to user ${userId}`);
    }
  }
  
  /**
   * Send a message to all connected users
   * @param event Event type
   * @param payload Message payload
   */
  sendToAll(event: string, payload: any): void {
    const message = JSON.stringify({ event, payload });
    
    this.connections.forEach((sockets, userId) => {
      sockets.forEach(socket => {
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
          }
        } catch (error) {
          logger.error(`Error broadcasting message to user ${userId}`, { error });
        }
      });
    });
    
    logger.debug(`Broadcasted message to all users. Total recipients: ${this.getUserCount()}`);
  }
  
  /**
   * Get the total number of connections across all users
   * @returns Number of connections
   */
  getConnectionCount(): number {
    let count = 0;
    this.connections.forEach(sockets => {
      count += sockets.size;
    });
    return count;
  }
  
  /**
   * Get the number of users with active connections
   * @returns Number of connected users
   */
  getUserCount(): number {
    return this.connections.size;
  }
  
  /**
   * Check if a user has any active connections
   * @param userId User ID to check
   * @returns True if the user has at least one active connection
   */
  isUserOnline(userId: string): boolean {
    const userConnections = this.connections.get(userId);
    return !!userConnections && userConnections.size > 0;
  }
  
  /**
   * Get the number of connections for a specific user
   * @param userId User ID
   * @returns Number of connections
   */
  getUserConnectionCount(userId: string): number {
    const userConnections = this.connections.get(userId);
    return userConnections ? userConnections.size : 0;
  }
  
  /**
   * Register an event handler
   * @param event Event name ('connection' or 'disconnection')
   * @param handler Handler function
   * @returns Function to unregister the handler
   */
  on(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)!.push(handler);
    
    // Return function to unregister the handler
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Emit an event
   * @param event Event name
   * @param args Event arguments
   */
  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          logger.error(`Error in connection event handler for ${event}`, { error });
        }
      });
    }
  }
}