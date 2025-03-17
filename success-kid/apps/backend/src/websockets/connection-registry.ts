/**
 * Enhanced WebSocket Connection Registry
 * 
 * Manages WebSocket connections for users with improved features
 */
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
   * Check if user has active connections
   * @param userId User identifier
   * @returns Whether user has any connections
   */
  hasConnections(userId: string): boolean {
    const userConnections = this.connections.get(userId);
    return !!userConnections && userConnections.size > 0;
  }
  
  /**
   * Get connections for a user
   * @param userId User identifier
   * @returns Set of user's WebSocket connections or null if none
   */
  getUserConnections(userId: string): Set<WebSocket> | null {
    return this.connections.get(userId) || null;
  }
  
  /**
   * Send a message to a specific user across all their connections
   * @param userId User identifier
   * @param message Message to send (will be stringified if not a string)
   * @returns Number of connections message was sent to
   */
  sendToUser(userId: string, message: any): number {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return 0;
    }
    
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    let sentCount = 0;
    
    userConnections.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(messageString);
        sentCount++;
      }
    });
    
    logger.debug(`Sent message to user ${userId} on ${sentCount} connections`);
    return sentCount;
  }
  
  /**
   * Send a message to all connected users
   * @param message Message to send (will be stringified if not a string)
   * @returns Number of connections message was sent to
   */
  sendToAll(message: any): number {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    let sentCount = 0;
    
    this.connections.forEach((userConnections, userId) => {
      userConnections.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageString);
          sentCount++;
        }
      });
    });
    
    logger.debug(`Broadcasted message to all users. Total recipients: ${sentCount}`);
    return sentCount;
  }
  
  /**
   * Send a message to multiple users
   * @param userIds Array of user IDs
   * @param message Message to send
   * @returns Number of connections message was sent to
   */
  sendToUsers(userIds: string[], message: any): number {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    let sentCount = 0;
    
    for (const userId of userIds) {
      const userConnections = this.connections.get(userId);
      if (userConnections && userConnections.size > 0) {
        userConnections.forEach(socket => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(messageString);
            sentCount++;
          }
        });
      }
    }
    
    logger.debug(`Sent message to ${sentCount} connections across ${userIds.length} users`);
    return sentCount;
  }
  
  /**
   * Get the total number of connections across all users
   * @returns Number of connections
   */
  getConnectionCount(): number {
    let count = 0;
    this.connections.forEach(userConnections => {
      count += userConnections.size;
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
   * Get all connected user IDs
   * @returns Array of user IDs
   */
  getConnectedUserIds(): string[] {
    return Array.from(this.connections.keys());
  }
  
  /**
   * Get detailed connection statistics
   * @returns Connection statistics
   */
  getDetailedStats(): {
    totalConnections: number;
    userCount: number;
    userConnections: Record<string, number>;
    topUsers: Array<{userId: string; connections: number}>;
  } {
    const totalConnections = this.getConnectionCount();
    const userCount = this.getUserCount();
    
    const userConnections: Record<string, number> = {};
    this.connections.forEach((connections, userId) => {
      userConnections[userId] = connections.size;
    });
    
    const topUsers = Object.entries(userConnections)
      .map(([userId, connections]) => ({ userId, connections }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);
    
    return {
      totalConnections,
      userCount,
      userConnections,
      topUsers
    };
  }
}
