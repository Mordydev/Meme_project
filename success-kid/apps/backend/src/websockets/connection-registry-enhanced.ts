/**
 * Enhanced WebSocket Connection Registry
 * 
 * Manages WebSocket connections for users with improved tracking,
 * analytics, and performance optimizations
 */
import { WebSocket } from 'ws';
import { logger } from '../lib/logger';

/**
 * Connection stats for a specific time period
 */
interface ConnectionPeriodStats {
  peak: number;
  average: number;
  current: number;
  timestamp: string;
}

/**
 * Enhanced registry for WebSocket connections
 * Provides optimized access patterns and detailed metrics
 */
export class EnhancedConnectionRegistry {
  /**
   * Map of user IDs to sets of WebSocket connections
   */
  private connections: Map<string, Set<WebSocket>> = new Map();
  
  /**
   * All active connections regardless of user
   */
  private allConnections: Set<WebSocket> = new Set();
  
  /**
   * Connection count history for analytics
   * Hourly snapshots of connection counts
   */
  private connectionHistory: ConnectionPeriodStats[] = [];
  
  /**
   * Last connection count sample timestamp
   */
  private lastHistorySample: number = Date.now();
  
  /**
   * Sample interval for connection history (1 hour)
   */
  private readonly HISTORY_SAMPLE_INTERVAL = 60 * 60 * 1000;
  
  /**
   * Max history samples to keep (24 hours)
   */
  private readonly MAX_HISTORY_SAMPLES = 24;
  
  /**
   * Create a new connection registry
   */
  constructor() {
    // Take initial sample
    this.sampleConnectionStats();
    
    // Set up regular sampling
    setInterval(() => this.sampleConnectionStats(), 5 * 60 * 1000); // Every 5 minutes
  }
  
  /**
   * Add a WebSocket connection for a user
   * @param userId User identifier
   * @param socket WebSocket connection
   */
  add(userId: string, socket: WebSocket): void {
    // Add to user's connections
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(socket);
    
    // Add to all connections
    this.allConnections.add(socket);
    
    logger.debug(`Added connection for user ${userId}. Total connections: ${this.getConnectionCount()}`);
  }
  
  /**
   * Remove a WebSocket connection for a user
   * @param userId User identifier
   * @param socket WebSocket connection to remove
   */
  remove(userId: string, socket: WebSocket): void {
    // Remove from user's connections
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(socket);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
    
    // Remove from all connections
    this.allConnections.delete(socket);
    
    logger.debug(`Removed connection for user ${userId}. Total connections: ${this.getConnectionCount()}`);
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
   * @returns Set of user's WebSocket connections or empty set if none
   */
  getUserConnections(userId: string): Set<WebSocket> {
    return this.connections.get(userId) || new Set();
  }
  
  /**
   * Get all WebSocket connections regardless of user
   * @returns Set of all WebSocket connections
   */
  getAllConnections(): Set<WebSocket> {
    return this.allConnections;
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
        try {
          socket.send(messageString);
          sentCount++;
        } catch (error) {
          logger.error(`Error sending message to user ${userId}`, { error });
          // Consider closing the socket on error
          try {
            socket.close(1011, 'Error sending message');
          } catch (closeError) {
            // Ignore errors on close
          }
        }
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
    
    this.allConnections.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(messageString);
          sentCount++;
        } catch (error) {
          logger.error('Error sending broadcast message', { error });
          // Consider closing the socket on error
          try {
            socket.close(1011, 'Error sending message');
          } catch (closeError) {
            // Ignore errors on close
          }
        }
      }
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
    if (userIds.length === 0) {
      return 0;
    }
    
    // For a single user, use sendToUser directly
    if (userIds.length === 1) {
      return this.sendToUser(userIds[0], message);
    }
    
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    let sentCount = 0;
    
    for (const userId of userIds) {
      const userConnections = this.connections.get(userId);
      if (userConnections && userConnections.size > 0) {
        userConnections.forEach(socket => {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.send(messageString);
              sentCount++;
            } catch (error) {
              logger.error(`Error sending message to user ${userId}`, { error });
            }
          }
        });
      }
    }
    
    logger.debug(`Sent message to ${sentCount} connections across ${userIds.length} users`);
    return sentCount;
  }
  
  /**
   * Sample and store current connection statistics
   */
  private sampleConnectionStats(): void {
    const now = Date.now();
    
    // Check if it's time for an hourly sample
    if (now - this.lastHistorySample >= this.HISTORY_SAMPLE_INTERVAL) {
      this.lastHistorySample = now;
      
      // Get current connection count
      const current = this.getConnectionCount();
      
      // Calculate peak and average for the last period
      let peak = current;
      let sum = current;
      let count = 1;
      
      // Use previous samples if available
      if (this.connectionHistory.length > 0) {
        const lastSample = this.connectionHistory[this.connectionHistory.length - 1];
        peak = Math.max(peak, lastSample.peak);
        sum += lastSample.current;
        count++;
      }
      
      // Calculate average
      const average = Math.round(sum / count);
      
      // Add new sample
      this.connectionHistory.push({
        peak,
        average,
        current,
        timestamp: new Date().toISOString()
      });
      
      // Trim history if needed
      if (this.connectionHistory.length > this.MAX_HISTORY_SAMPLES) {
        this.connectionHistory.shift();
      }
      
      logger.info('Connection stats sampled', {
        current,
        peak,
        average,
        users: this.getUserCount()
      });
    }
  }
  
  /**
   * Get the total number of connections across all users
   * @returns Number of connections
   */
  getConnectionCount(): number {
    return this.allConnections.size;
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
   * Get connection history statistics
   * @returns Connection history data
   */
  getConnectionHistory(): ConnectionPeriodStats[] {
    return [...this.connectionHistory];
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
    connectionHistory: ConnectionPeriodStats[];
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
      topUsers,
      connectionHistory: this.getConnectionHistory()
    };
  }
  
  /**
   * Close all connections
   * @param code Close code
   * @param reason Close reason
   * @returns Number of connections closed
   */
  closeAllConnections(code: number = 1000, reason: string = 'Closed by server'): number {
    let closedCount = 0;
    
    this.allConnections.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.close(code, reason);
          closedCount++;
        } catch (error) {
          logger.error('Error closing connection', { error });
        }
      }
    });
    
    return closedCount;
  }
  
  /**
   * Remove stale connections that are no longer active
   * @returns Number of connections cleaned up
   */
  cleanupStaleConnections(): number {
    let removedCount = 0;
    const terminalStates = [WebSocket.CLOSING, WebSocket.CLOSED];
    
    // For efficiency, create arrays of connections to remove
    const toRemove: Map<string, WebSocket[]> = new Map();
    
    // Check all connections
    this.connections.forEach((connections, userId) => {
      const userToRemove: WebSocket[] = [];
      
      connections.forEach(socket => {
        if (terminalStates.includes(socket.readyState)) {
          userToRemove.push(socket);
        }
      });
      
      if (userToRemove.length > 0) {
        toRemove.set(userId, userToRemove);
      }
    });
    
    // Remove stale connections
    toRemove.forEach((sockets, userId) => {
      sockets.forEach(socket => {
        this.remove(userId, socket);
        removedCount++;
      });
    });
    
    if (removedCount > 0) {
      logger.info(`Cleaned up ${removedCount} stale connections`);
    }
    
    return removedCount;
  }
}

// For backward compatibility, export as both the enhanced and original name
export { EnhancedConnectionRegistry as ConnectionRegistry };
export default EnhancedConnectionRegistry;
