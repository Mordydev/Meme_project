import { WebSocket } from 'ws';
import { logger } from '../lib/logger';

/**
 * Manages WebSocket connections for users
 * Tracks connections by user ID and handles sending messages
 */
export class ConnectionRegistry {
  private connections: Map<string, Set<WebSocket>> = new Map();
  
  /**
   * Add a WebSocket connection for a user
   * @param userId User identifier
   * @param socket WebSocket connection
   */
  add(userId: string, socket: WebSocket): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(socket);
    logger.debug(`Added connection for user ${userId}. Total connections: ${this.getConnectionCount()}`);
  }
  
  /**
   * Remove a WebSocket connection for a user
   * @param userId User identifier
   * @param socket WebSocket connection to remove
   */
  remove(userId: string, socket: WebSocket): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(socket);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
      logger.debug(`Removed connection for user ${userId}. Total connections: ${this.getConnectionCount()}`);
    }
  }
  
  /**
   * Send a message to a specific user across all their connections
   * @param userId User identifier
   * @param message Message to send (will be stringified if not a string)
   */
  sendToUser(userId: string, message: any): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      userConnections.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageString);
        }
      });
      logger.debug(`Sent message to user ${userId}`);
    }
  }
  
  /**
   * Send a message to all connected users
   * @param message Message to send (will be stringified if not a string)
   */
  sendToAll(message: any): void {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    this.connections.forEach((sockets, userId) => {
      sockets.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageString);
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
}