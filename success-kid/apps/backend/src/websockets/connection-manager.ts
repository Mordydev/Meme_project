/**
 * WebSocket Connection Manager
 * 
 * Manages WebSocket connections, tracking user connections and providing methods
 * for sending messages to specific users or broadcasting to all connections.
 */
import { WebSocket } from 'ws';
import { logger } from '../lib/logger';

/**
 * Interface for Connection Manager
 */
export interface ConnectionManager {
  /**
   * Register a new WebSocket connection for a user
   */
  add(userId: string, socket: WebSocket): void;
  
  /**
   * Remove a WebSocket connection for a user
   */
  remove(userId: string, socket: WebSocket): void;
  
  /**
   * Send a message to all connections for a specific user
   */
  sendToUser(userId: string, event: string, data: any): void;
  
  /**
   * Broadcast a message to all connected users
   */
  sendToAll(event: string, data: any): void;
  
  /**
   * Get the count of connected users
   */
  getUserCount(): number;
  
  /**
   * Get the count of total active connections
   */
  getConnectionCount(): number;
  
  /**
   * Check if a user has any active connections
   */
  isUserOnline(userId: string): boolean;
}

/**
 * Connection Registry for WebSocket management
 * 
 * Tracks WebSocket connections by user ID, allowing messages to be
 * sent to specific users or broadcast to all users.
 */
export class ConnectionRegistry implements ConnectionManager {
  // Map of user IDs to sets of their active WebSocket connections
  private connections: Map<string, Set<WebSocket>> = new Map();
  
  /**
   * Add a WebSocket connection for a user
   * 
   * @param userId User ID to associate with the connection
   * @param socket WebSocket connection to register
   */
  add(userId: string, socket: WebSocket): void {
    // Initialize user's connection set if needed
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    
    // Add the socket to the user's connections
    this.connections.get(userId)!.add(socket);
    
    logger.debug(`WS: User ${userId} connected. Total: ${this.getConnectionCount()}`);
  }
  
  /**
   * Remove a WebSocket connection for a user
   * 
   * @param userId User ID to remove the connection from
   * @param socket WebSocket connection to remove
   */
  remove(userId: string, socket: WebSocket): void {
    const userConnections = this.connections.get(userId);
    
    if (userConnections) {
      // Remove the specific socket
      userConnections.delete(socket);
      
      // Clean up user entry if no connections remain
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
      
      logger.debug(`WS: User ${userId} disconnected. Total: ${this.getConnectionCount()}`);
    }
  }
  
  /**
   * Send a message to all connections for a specific user
   * 
   * @param userId User ID to send the message to
   * @param event Event type for the message
   * @param data Data payload for the message
   */
  sendToUser(userId: string, event: string, data: any): void {
    const userConnections = this.connections.get(userId);
    
    if (userConnections && userConnections.size > 0) {
      const message = JSON.stringify({ event, data });
      
      userConnections.forEach(socket => {
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
          }
        } catch (error) {
          logger.error(`WS: Error sending to user ${userId}`, { error });
        }
      });
    }
  }
  
  /**
   * Broadcast a message to all connected users
   * 
   * @param event Event type for the message
   * @param data Data payload for the message
   */
  sendToAll(event: string, data: any): void {
    const message = JSON.stringify({ event, data });
    
    this.connections.forEach((sockets, userId) => {
      sockets.forEach(socket => {
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
          }
        } catch (error) {
          logger.error(`WS: Error broadcasting to user ${userId}`, { error });
        }
      });
    });
  }
  
  /**
   * Get the count of connected users
   * 
   * @returns Number of users with active connections
   */
  getUserCount(): number {
    return this.connections.size;
  }
  
  /**
   * Get the count of total active connections
   * 
   * @returns Total number of active WebSocket connections
   */
  getConnectionCount(): number {
    let count = 0;
    this.connections.forEach(sockets => {
      count += sockets.size;
    });
    return count;
  }
  
  /**
   * Check if a user has any active connections
   * 
   * @param userId User ID to check
   * @returns True if the user has at least one active connection
   */
  isUserOnline(userId: string): boolean {
    const userConnections = this.connections.get(userId);
    return !!userConnections && userConnections.size > 0;
  }
}

// Export a singleton instance for app-wide use
export const connectionManager = new ConnectionRegistry();
