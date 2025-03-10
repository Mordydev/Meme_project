import { WebSocket } from 'ws';
import { Logger } from 'pino';
import { randomUUID } from 'crypto';
import { EventEmitter, EventType } from '../lib/events';
import { MetricsService } from '../services/core/metrics-service';

/**
 * Type for connection metadata
 */
interface ConnectionMetadata {
  userId: string;
  ip?: string;
  userAgent?: string;
  subscriptions: Set<string>;
  [key: string]: any;
}

/**
 * Class for managing WebSocket connections
 */
export class ConnectionManager {
  // User ID to Set of connection IDs
  private userConnections = new Map<string, Set<string>>();
  
  // Connection ID to WebSocket instance
  private connections = new Map<string, {
    ws: WebSocket;
    userId: string;
    createdAt: Date;
    lastActivity: Date;
    metadata: ConnectionMetadata;
  }>();
  
  // Channel name to Set of connection IDs
  private channelSubscriptions = new Map<string, Set<string>>();
  
  /**
   * Create a new ConnectionManager
   */
  constructor(
    private readonly eventEmitter?: EventEmitter,
    private readonly metrics?: MetricsService,
    private readonly logger?: Logger
  ) {}
  
  /**
   * Register a new connection
   */
  registerConnection(
    userId: string, 
    ws: WebSocket, 
    metadata?: Partial<ConnectionMetadata>
  ): string {
    // Generate unique connection ID
    const connectionId = randomUUID();
    
    // Create connection metadata
    const connectionMetadata: ConnectionMetadata = {
      userId,
      subscriptions: new Set(),
      ...metadata
    };
    
    // Store connection data
    this.connections.set(connectionId, {
      ws,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: connectionMetadata
    });
    
    // Add to user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    
    this.userConnections.get(userId)!.add(connectionId);
    
    // Update metrics
    this.metrics?.increment('websocket.connections.total');
    this.metrics?.gauge('websocket.connections.active', this.connections.size);
    
    // Log connection
    this.logger?.info({ 
      connectionId, 
      userId, 
      total: this.connections.size 
    }, 'WebSocket connection established');
    
    // Emit event
    this.eventEmitter?.emit(EventType.WEBSOCKET_CONNECTED, {
      connectionId,
      userId,
      timestamp: new Date().toISOString()
    } as any);
    
    return connectionId;
  }
  
  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }
    
    // Clean up user connection mapping
    const userId = connection.userId;
    const userConnectionSet = this.userConnections.get(userId);
    
    if (userConnectionSet) {
      userConnectionSet.delete(connectionId);
      
      // If user has no more connections, remove user from map
      if (userConnectionSet.size === 0) {
        this.userConnections.delete(userId);
      }
    }
    
    // Clean up channel subscriptions
    const subscriptions = connection.metadata.subscriptions;
    if (subscriptions) {
      for (const channel of subscriptions) {
        const channelSet = this.channelSubscriptions.get(channel);
        if (channelSet) {
          channelSet.delete(connectionId);
          
          // If channel has no more subscribers, remove channel from map
          if (channelSet.size === 0) {
            this.channelSubscriptions.delete(channel);
          }
        }
      }
    }
    
    // Remove connection from map
    this.connections.delete(connectionId);
    
    // Update metrics
    this.metrics?.decrement('websocket.connections.active');
    this.metrics?.increment('websocket.connections.closed');
    
    // Log disconnection
    this.logger?.info({ 
      connectionId, 
      userId, 
      total: this.connections.size 
    }, 'WebSocket connection closed');
    
    // Emit event
    this.eventEmitter?.emit(EventType.WEBSOCKET_DISCONNECTED, {
      connectionId,
      userId,
      timestamp: new Date().toISOString()
    } as any);
    
    return true;
  }
  
  /**
   * Update connection activity timestamp
   */
  updateActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }
  
  /**
   * Subscribe a connection to a channel
   */
  subscribeToChannel(connectionId: string, channel: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }
    
    // Add channel to connection's subscriptions
    connection.metadata.subscriptions.add(channel);
    
    // Add connection to channel subscribers
    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
    }
    
    this.channelSubscriptions.get(channel)!.add(connectionId);
    
    // Update metrics
    this.metrics?.increment('websocket.subscriptions.total');
    this.metrics?.gauge(
      `websocket.channels.${channel.replace(/[^a-zA-Z0-9]/g, '_')}.subscribers`,
      this.channelSubscriptions.get(channel)!.size
    );
    
    this.logger?.debug({ 
      connectionId, 
      userId: connection.userId, 
      channel 
    }, 'Connection subscribed to channel');
    
    return true;
  }
  
  /**
   * Unsubscribe a connection from a channel
   */
  unsubscribeFromChannel(connectionId: string, channel: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }
    
    // Remove channel from connection's subscriptions
    connection.metadata.subscriptions.delete(channel);
    
    // Remove connection from channel subscribers
    const channelSet = this.channelSubscriptions.get(channel);
    if (channelSet) {
      channelSet.delete(connectionId);
      
      // If channel has no more subscribers, remove channel from map
      if (channelSet.size === 0) {
        this.channelSubscriptions.delete(channel);
      } else {
        // Update metrics
        this.metrics?.gauge(
          `websocket.channels.${channel.replace(/[^a-zA-Z0-9]/g, '_')}.subscribers`,
          channelSet.size
        );
      }
    }
    
    this.logger?.debug({ 
      connectionId, 
      userId: connection.userId, 
      channel 
    }, 'Connection unsubscribed from channel');
    
    return true;
  }
  
  /**
   * Get all connections for a user
   */
  getUserConnections(userId: string): string[] {
    const connections = this.userConnections.get(userId);
    return connections ? Array.from(connections) : [];
  }
  
  /**
   * Get all subscribers to a channel
   */
  getChannelSubscribers(channel: string): string[] {
    const subscribers = this.channelSubscriptions.get(channel);
    return subscribers ? Array.from(subscribers) : [];
  }
  
  /**
   * Send a message to a specific connection
   */
  sendToConnection(connectionId: string, type: string, data: any): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      connection.ws.send(JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      }));
      
      // Update activity timestamp
      connection.lastActivity = new Date();
      
      // Update metrics
      this.metrics?.increment('websocket.messages.sent');
      
      return true;
    } catch (error) {
      this.logger?.error(
        { error, connectionId, userId: connection.userId, type },
        'Failed to send message to connection'
      );
      
      return false;
    }
  }
  
  /**
   * Send a message to all user connections
   */
  sendToUser(userId: string, type: string, data: any): number {
    const connectionIds = this.getUserConnections(userId);
    let successCount = 0;
    
    for (const connectionId of connectionIds) {
      if (this.sendToConnection(connectionId, type, data)) {
        successCount++;
      }
    }
    
    return successCount;
  }
  
  /**
   * Send a message to all channel subscribers
   */
  sendToChannel(channel: string, type: string, data: any, excludeConnectionId?: string): number {
    const subscribers = this.getChannelSubscribers(channel);
    let successCount = 0;
    
    for (const connectionId of subscribers) {
      // Skip excluded connection
      if (excludeConnectionId === connectionId) {
        continue;
      }
      
      if (this.sendToConnection(connectionId, type, data)) {
        successCount++;
      }
    }
    
    return successCount;
  }
  
  /**
   * Broadcast a message to all connections
   */
  broadcast(type: string, data: any, filter?: (connectionId: string) => boolean): number {
    let successCount = 0;
    
    for (const connectionId of this.connections.keys()) {
      // Apply filter if provided
      if (filter && !filter(connectionId)) {
        continue;
      }
      
      if (this.sendToConnection(connectionId, type, data)) {
        successCount++;
      }
    }
    
    return successCount;
  }
  
  /**
   * Get all stale connections
   */
  getStaleConnections(maxInactivityMs: number): string[] {
    const now = new Date();
    const staleConnections: string[] = [];
    
    for (const [id, conn] of this.connections.entries()) {
      const inactiveTime = now.getTime() - conn.lastActivity.getTime();
      if (inactiveTime > maxInactivityMs) {
        staleConnections.push(id);
      }
    }
    
    return staleConnections;
  }
  
  /**
   * Close a connection
   */
  closeConnection(connectionId: string, code: number = 1000, reason?: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }
    
    try {
      // Close WebSocket connection
      connection.ws.close(code, reason);
      
      // Remove connection from manager
      this.removeConnection(connectionId);
      
      return true;
    } catch (error) {
      this.logger?.error(
        { error, connectionId, userId: connection.userId },
        'Failed to close connection'
      );
      
      return false;
    }
  }
  
  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number,
    uniqueUsers: number,
    channelStats: Record<string, number>
  } {
    const channelStats: Record<string, number> = {};
    
    // Collect channel subscriber counts
    for (const [channel, subscribers] of this.channelSubscriptions.entries()) {
      channelStats[channel] = subscribers.size;
    }
    
    return {
      totalConnections: this.connections.size,
      uniqueUsers: this.userConnections.size,
      channelStats
    };
  }
  
  /**
   * Perform a health check and close stale connections
   */
  performHealthCheck(maxInactivityMs: number = 5 * 60 * 1000): number {
    const staleConnections = this.getStaleConnections(maxInactivityMs);
    let closedCount = 0;
    
    for (const connectionId of staleConnections) {
      if (this.closeConnection(connectionId, 1000, 'Connection inactive')) {
        closedCount++;
      }
    }
    
    this.logger?.info(
      { staleCount: staleConnections.length, closedCount },
      'Connection health check completed'
    );
    
    return closedCount;
  }
}
