/**
 * WebSocket Connection Registry
 * 
 * Manages active WebSocket connections and provides methods for
 * sending messages to specific users or groups with optimized performance.
 */
import { WebSocket } from 'ws';
import { WebSocketMessage } from '@success-kid/api-types';
import { logger } from '../lib/logger';
import { messageBatcher } from './message-batcher';
import { monitoringService } from '../monitoring/service';

/**
 * Connection metadata interface
 */
export interface ConnectionMetadata {
  source: string;
  ip?: string;
  userAgent?: string;
  query?: Record<string, any>;
  deviceType?: string;
  clientVersion?: string;
  [key: string]: any;
}

/**
 * Connection information
 */
interface ConnectionInfo {
  id: string;
  socket: WebSocket;
  userId: string;
  subscriptions: Set<string>;
  connectedAt: Date;
  lastActive: Date;
  metadata?: ConnectionMetadata;
  perfMetrics?: {
    messagesSent: number;
    messagesReceived: number;
    bytesReceived: number;
    bytesSent: number;
    lastLatency?: number;
  };
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  totalConnections: number;
  uniqueUsers: number;
  connectionsByUserAgent: Record<string, number>;
  connectionsBySource: Record<string, number>;
  connectionsByIp: Record<string, number>;
  averageConnectionAge: number;
  subscriptionStats: {
    totalSubscriptions: number;
    topChannels: Array<{ channel: string; count: number }>;
  };
}

/**
 * Message delivery options
 */
export interface DeliveryOptions {
  priority?: 'high' | 'normal' | 'low';
  excludeConnectionIds?: string[];
  batchingEnabled?: boolean;
  trackDelivery?: boolean;
}

/**
 * WebSocket connection registry
 */
export class ConnectionRegistry {
  // User ID -> Set of connection infos
  private connections: Map<string, Set<ConnectionInfo>> = new Map();
  
  // Connection ID -> Connection info
  private connectionMap: Map<string, ConnectionInfo> = new Map();
  
  // Channel -> Set of connection IDs
  private subscriptions: Map<string, Set<string>> = new Map();
  
  // Message sequence for deduplication
  private messageSequence = 0;
  
  /**
   * Add a new connection
   * 
   * @param userId User ID
   * @param socket WebSocket connection
   * @param connectionId Unique connection ID
   * @param metadata Additional connection metadata
   * @returns The connection ID
   */
  add(
    userId: string, 
    socket: WebSocket, 
    connectionId: string,
    metadata: ConnectionMetadata = { source: 'unknown' }
  ): string {
    // Get or create user connections set
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    
    // Create connection info
    const now = new Date();
    const connInfo: ConnectionInfo = {
      id: connectionId,
      socket,
      userId,
      subscriptions: new Set(),
      connectedAt: now,
      lastActive: now,
      metadata,
      perfMetrics: {
        messagesSent: 0,
        messagesReceived: 0,
        bytesReceived: 0,
        bytesSent: 0
      }
    };
    
    // Add to user's connections
    this.connections.get(userId)!.add(connInfo);
    
    // Add to connection map
    this.connectionMap.set(connectionId, connInfo);
    
    // Track device type if user agent available
    if (metadata.userAgent) {
      metadata.deviceType = this.detectDeviceType(metadata.userAgent);
    }
    
    logger.debug('WebSocket connection added', { userId, connectionId });
    
    // Report connection metrics
    monitoringService.recordMetric('websocket.connections.by_device', 1, { 
      deviceType: metadata.deviceType || 'unknown' 
    });
    
    return connectionId;
  }
  
  /**
   * Remove a connection
   * 
   * @param connectionId Connection ID
   * @returns True if connection was removed
   */
  remove(connectionId: string): boolean {
    const connInfo = this.connectionMap.get(connectionId);
    
    if (!connInfo) {
      return false;
    }
    
    const { userId, subscriptions } = connInfo;
    
    // Remove from user's connections
    const userConnections = this.connections.get(userId);
    
    if (userConnections) {
      userConnections.delete(connInfo);
      
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
    
    // Remove from subscriptions
    for (const channel of subscriptions) {
      const channelSubscriptions = this.subscriptions.get(channel);
      
      if (channelSubscriptions) {
        channelSubscriptions.delete(connectionId);
        
        if (channelSubscriptions.size === 0) {
          this.subscriptions.delete(channel);
        }
      }
    }
    
    // Remove from connection map
    this.connectionMap.delete(connectionId);
    
    logger.debug('WebSocket connection removed', { userId, connectionId });
    
    return true;
  }
  
  /**
   * Subscribe a connection to a channel
   * 
   * @param connectionId Connection ID
   * @param channel Channel to subscribe to
   * @returns True if subscription was successful
   */
  subscribe(connectionId: string, channel: string): boolean {
    const connInfo = this.connectionMap.get(connectionId);
    
    if (!connInfo) {
      return false;
    }
    
    // Add channel to connection's subscriptions
    connInfo.subscriptions.add(channel);
    
    // Add connection to channel's subscriptions
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    this.subscriptions.get(channel)!.add(connectionId);
    
    logger.debug('WebSocket subscription added', { 
      userId: connInfo.userId, 
      connectionId, 
      channel 
    });
    
    // Report subscription metrics
    monitoringService.recordMetric('websocket.subscriptions.total', 1);
    monitoringService.recordMetric('websocket.subscriptions.by_channel', 1, { channel });
    
    return true;
  }
  
  /**
   * Unsubscribe a connection from a channel
   * 
   * @param connectionId Connection ID
   * @param channel Channel to unsubscribe from
   * @returns True if unsubscription was successful
   */
  unsubscribe(connectionId: string, channel: string): boolean {
    const connInfo = this.connectionMap.get(connectionId);
    
    if (!connInfo) {
      return false;
    }
    
    // Remove channel from connection's subscriptions
    connInfo.subscriptions.delete(channel);
    
    // Remove connection from channel's subscriptions
    const channelSubscriptions = this.subscriptions.get(channel);
    
    if (channelSubscriptions) {
      channelSubscriptions.delete(connectionId);
      
      if (channelSubscriptions.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
    
    logger.debug('WebSocket subscription removed', { 
      userId: connInfo.userId, 
      connectionId, 
      channel 
    });
    
    // Report subscription metrics
    monitoringService.recordMetric('websocket.subscriptions.total', -1);
    monitoringService.recordMetric('websocket.subscriptions.by_channel', -1, { channel });
    
    return true;
  }
  
  /**
   * Send a message to a specific user
   * 
   * @param userId User ID
   * @param message Message to send
   * @param options Delivery options
   * @returns Number of connections message was sent to
   */
  sendToUser(
    userId: string, 
    message: WebSocketMessage,
    options: DeliveryOptions = {}
  ): number {
    const userConnections = this.connections.get(userId);
    
    if (!userConnections || userConnections.size === 0) {
      return 0;
    }
    
    let sent = 0;
    const messageString = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);
    
    const messageSize = Buffer.byteLength(messageString);
    const excludeConnections = new Set(options.excludeConnectionIds || []);
    const useBatching = options.batchingEnabled !== false;
    const priority = options.priority || 'normal';
    
    // Add sequence number for deduplication
    const messageWithSeq = {
      ...message,
      meta: {
        ...(message.meta || {}),
        seq: this.getNextSequence()
      }
    };
    
    for (const connInfo of userConnections) {
      try {
        // Skip excluded connections
        if (excludeConnections.has(connInfo.id)) {
          continue;
        }
        
        if (connInfo.socket.readyState === WebSocket.OPEN) {
          if (useBatching) {
            // Use message batcher for optimized delivery
            messageBatcher.queueMessage(
              connInfo.socket, 
              messageWithSeq.type, 
              messageWithSeq.payload,
              priority
            );
          } else {
            // Send immediately
            connInfo.socket.send(messageString);
          }
          
          connInfo.lastActive = new Date(); // Update last active timestamp
          
          // Update metrics
          if (connInfo.perfMetrics) {
            connInfo.perfMetrics.messagesSent++;
            connInfo.perfMetrics.bytesSent += messageSize;
          }
          
          sent++;
        }
      } catch (error) {
        logger.error('Error sending message to user', { 
          userId, 
          connectionId: connInfo.id,
          error: error.message 
        });
      }
    }
    
    // Report metrics
    monitoringService.recordMetric('websocket.messages.sent', sent);
    monitoringService.recordMetric('websocket.bytes.sent', messageSize * sent);
    
    return sent;
  }
  
  /**
   * Send a message to a channel
   * 
   * @param channel Channel to send to
   * @param message Message to send
   * @param options Delivery options
   * @returns Number of connections message was sent to
   */
  sendToChannel(
    channel: string, 
    message: WebSocketMessage,
    options: DeliveryOptions = {}
  ): number {
    const channelSubscriptions = this.subscriptions.get(channel);
    
    if (!channelSubscriptions || channelSubscriptions.size === 0) {
      return 0;
    }
    
    let sent = 0;
    const messageString = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);
    
    const messageSize = Buffer.byteLength(messageString);
    const excludeConnections = new Set(options.excludeConnectionIds || []);
    const useBatching = options.batchingEnabled !== false;
    const priority = options.priority || 'normal';
    
    // Add sequence number for deduplication
    const messageWithSeq = {
      ...message,
      meta: {
        ...(message.meta || {}),
        seq: this.getNextSequence(),
        channel
      }
    };
    
    for (const connectionId of channelSubscriptions) {
      const connInfo = this.connectionMap.get(connectionId);
      
      if (!connInfo) {
        continue;
      }
      
      // Skip excluded connections
      if (excludeConnections.has(connectionId)) {
        continue;
      }
      
      try {
        if (connInfo.socket.readyState === WebSocket.OPEN) {
          if (useBatching) {
            // Use message batcher for optimized delivery
            messageBatcher.queueMessage(
              connInfo.socket, 
              messageWithSeq.type, 
              messageWithSeq.payload,
              priority
            );
          } else {
            // Send immediately
            connInfo.socket.send(messageString);
          }
          
          connInfo.lastActive = new Date(); // Update last active timestamp
          
          // Update metrics
          if (connInfo.perfMetrics) {
            connInfo.perfMetrics.messagesSent++;
            connInfo.perfMetrics.bytesSent += messageSize;
          }
          
          sent++;
        }
      } catch (error) {
        logger.error('Error sending message to channel', { 
          channel, 
          userId: connInfo.userId,
          connectionId,
          error: error.message 
        });
      }
    }
    
    // Report metrics
    monitoringService.recordMetric('websocket.messages.sent', sent);
    monitoringService.recordMetric('websocket.bytes.sent', messageSize * sent);
    monitoringService.recordMetric('websocket.channel.messages', 1, { channel });
    
    return sent;
  }
  
  /**
   * Send a message to all connections
   * 
   * @param message Message to send
   * @param options Delivery options
   * @returns Number of connections message was sent to
   */
  broadcast(
    message: WebSocketMessage,
    options: DeliveryOptions = {}
  ): number {
    let sent = 0;
    const messageString = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);
    
    const messageSize = Buffer.byteLength(messageString);
    const excludeConnections = new Set(options.excludeConnectionIds || []);
    const useBatching = options.batchingEnabled !== false;
    const priority = options.priority || 'normal';
    
    // Add sequence number for deduplication
    const messageWithSeq = {
      ...message,
      meta: {
        ...(message.meta || {}),
        seq: this.getNextSequence(),
        broadcast: true
      }
    };
    
    for (const connInfo of this.connectionMap.values()) {
      // Skip excluded connections
      if (excludeConnections.has(connInfo.id)) {
        continue;
      }
      
      try {
        if (connInfo.socket.readyState === WebSocket.OPEN) {
          if (useBatching) {
            // Use message batcher for optimized delivery
            messageBatcher.queueMessage(
              connInfo.socket, 
              messageWithSeq.type, 
              messageWithSeq.payload,
              priority
            );
          } else {
            // Send immediately
            connInfo.socket.send(messageString);
          }
          
          connInfo.lastActive = new Date(); // Update last active timestamp
          
          // Update metrics
          if (connInfo.perfMetrics) {
            connInfo.perfMetrics.messagesSent++;
            connInfo.perfMetrics.bytesSent += messageSize;
          }
          
          sent++;
        }
      } catch (error) {
        logger.error('Error broadcasting message', { 
          userId: connInfo.userId, 
          connectionId: connInfo.id,
          error: error.message 
        });
      }
    }
    
    // Report metrics
    monitoringService.recordMetric('websocket.messages.sent', sent);
    monitoringService.recordMetric('websocket.bytes.sent', messageSize * sent);
    monitoringService.recordMetric('websocket.broadcasts', 1);
    
    return sent;
  }
  
  /**
   * Send a direct message to a specific connection
   * 
   * @param connectionId Connection ID
   * @param message Message to send
   * @param options Delivery options
   * @returns True if message was sent successfully
   */
  sendToConnection(
    connectionId: string, 
    message: WebSocketMessage,
    options: DeliveryOptions = {}
  ): boolean {
    const connInfo = this.connectionMap.get(connectionId);
    
    if (!connInfo || connInfo.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      const messageString = typeof message === 'string' 
        ? message 
        : JSON.stringify(message);
      
      const messageSize = Buffer.byteLength(messageString);
      const useBatching = options.batchingEnabled !== false;
      const priority = options.priority || 'normal';
      
      // Add sequence number for deduplication
      const messageWithSeq = {
        ...message,
        meta: {
          ...(message.meta || {}),
          seq: this.getNextSequence()
        }
      };
      
      if (useBatching) {
        // Use message batcher for optimized delivery
        messageBatcher.queueMessage(
          connInfo.socket, 
          messageWithSeq.type, 
          messageWithSeq.payload,
          priority
        );
      } else {
        // Send immediately
        connInfo.socket.send(messageString);
      }
      
      connInfo.lastActive = new Date(); // Update last active timestamp
      
      // Update metrics
      if (connInfo.perfMetrics) {
        connInfo.perfMetrics.messagesSent++;
        connInfo.perfMetrics.bytesSent += messageSize;
      }
      
      // Report metrics
      monitoringService.recordMetric('websocket.messages.sent', 1);
      monitoringService.recordMetric('websocket.bytes.sent', messageSize);
      
      return true;
    } catch (error) {
      logger.error('Error sending message to connection', { 
        connectionId, 
        userId: connInfo.userId,
        error: error.message 
      });
      
      return false;
    }
  }
  
  /**
   * Get all connection IDs for a user
   * 
   * @param userId User ID
   * @returns Array of connection IDs
   */
  getConnectionIds(userId: string): string[] {
    const userConnections = this.connections.get(userId);
    
    if (!userConnections) {
      return [];
    }
    
    return Array.from(userConnections).map(conn => conn.id);
  }
  
  /**
   * Get connection info
   * 
   * @param connectionId Connection ID
   * @returns Connection info or undefined if not found
   */
  getConnectionInfo(connectionId: string): Omit<ConnectionInfo, 'socket'> | undefined {
    const connInfo = this.connectionMap.get(connectionId);
    
    if (!connInfo) {
      return undefined;
    }
    
    // Return a copy without the socket to prevent external manipulation
    const { socket, ...rest } = connInfo;
    return rest;
  }
  
  /**
   * Check if a user has any active connections
   * 
   * @param userId User ID
   * @returns True if user has active connections
   */
  isUserConnected(userId: string): boolean {
    const userConnections = this.connections.get(userId);
    
    return !!userConnections && userConnections.size > 0;
  }
  
  /**
   * Get the number of active connections
   * 
   * @returns Total number of connections
   */
  getConnectionCount(): number {
    return this.connectionMap.size;
  }
  
  /**
   * Get the number of connections for a specific user
   * 
   * @param userId User ID
   * @returns Number of connections for the user
   */
  getConnectionCount(userId: string): number {
    const userConnections = this.connections.get(userId);
    return userConnections ? userConnections.size : 0;
  }
  
  /**
   * Get the number of unique connected users
   * 
   * @returns Number of unique users
   */
  getUserCount(): number {
    return this.connections.size;
  }
  
  /**
   * Get all connected user IDs
   * 
   * @returns Array of user IDs
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connections.keys());
  }
  
  /**
   * Update connection metadata
   * 
   * @param connectionId Connection ID
   * @param metadata Metadata to update
   * @returns True if update was successful
   */
  updateMetadata(connectionId: string, metadata: Record<string, any>): boolean {
    const connInfo = this.connectionMap.get(connectionId);
    
    if (!connInfo) {
      return false;
    }
    
    connInfo.metadata = {
      ...connInfo.metadata,
      ...metadata
    };
    
    return true;
  }
  
  /**
   * Close all connections
   * 
   * @param code Close code
   * @param reason Close reason
   */
  closeAll(code: number = 1000, reason: string = 'Server shutting down'): void {
    for (const connInfo of this.connectionMap.values()) {
      try {
        // Flush any pending messages before closing
        messageBatcher.flush(connInfo.socket);
        
        // Close connection
        connInfo.socket.close(code, reason);
      } catch (error) {
        logger.error('Error closing connection', { 
          userId: connInfo.userId, 
          connectionId: connInfo.id,
          error: error.message 
        });
      }
    }
    
    // Clear all collections
    this.connections.clear();
    this.connectionMap.clear();
    this.subscriptions.clear();
    
    logger.info('All WebSocket connections closed');
  }
  
  /**
   * Clean up stale connections
   * 
   * @param maxIdleTime Maximum idle time in milliseconds (default: 10 minutes)
   * @returns Number of connections closed
   */
  cleanupStaleConnections(maxIdleTime: number = 10 * 60 * 1000): number {
    const now = new Date();
    let closed = 0;
    
    for (const [connectionId, connInfo] of this.connectionMap.entries()) {
      const idleTime = now.getTime() - connInfo.lastActive.getTime();
      
      if (idleTime > maxIdleTime) {
        // Close the connection
        try {
          // Flush any pending messages before closing
          messageBatcher.flush(connInfo.socket);
          
          // Close connection
          connInfo.socket.close(1000, 'Connection idle timeout');
          closed++;
        } catch (error) {
          logger.error('Error closing stale connection', { 
            userId: connInfo.userId, 
            connectionId,
            error: error.message 
          });
        }
        
        // Remove from registry
        this.remove(connectionId);
      }
    }
    
    return closed;
  }
  
  /**
   * Get detailed statistics about connections
   * 
   * @returns Connection statistics
   */
  getConnectionStats(): ConnectionStats {
    const stats: ConnectionStats = {
      totalConnections: this.connectionMap.size,
      uniqueUsers: this.connections.size,
      connectionsByUserAgent: {},
      connectionsBySource: {},
      connectionsByIp: {},
      averageConnectionAge: 0,
      subscriptionStats: {
        totalSubscriptions: 0,
        topChannels: []
      }
    };
    
    // Calculate connection distributions
    let totalAgeMs = 0;
    const now = Date.now();
    
    for (const connInfo of this.connectionMap.values()) {
      // Age calculation
      const ageMs = now - connInfo.connectedAt.getTime();
      totalAgeMs += ageMs;
      
      // User agent tracking
      if (connInfo.metadata?.userAgent) {
        const userAgent = this.simplifyUserAgent(connInfo.metadata.userAgent);
        stats.connectionsByUserAgent[userAgent] = (stats.connectionsByUserAgent[userAgent] || 0) + 1;
      }
      
      // Source tracking
      if (connInfo.metadata?.source) {
        const source = connInfo.metadata.source;
        stats.connectionsBySource[source] = (stats.connectionsBySource[source] || 0) + 1;
      }
      
      // IP tracking
      if (connInfo.metadata?.ip) {
        const ip = connInfo.metadata.ip;
        stats.connectionsByIp[ip] = (stats.connectionsByIp[ip] || 0) + 1;
      }
    }
    
    // Calculate average age
    stats.averageConnectionAge = Math.round(totalAgeMs / Math.max(1, this.connectionMap.size));
    
    // Calculate subscription stats
    const channelCounts = new Map<string, number>();
    let totalSubscriptions = 0;
    
    for (const [channel, subscribers] of this.subscriptions.entries()) {
      const count = subscribers.size;
      totalSubscriptions += count;
      channelCounts.set(channel, count);
    }
    
    stats.subscriptionStats.totalSubscriptions = totalSubscriptions;
    
    // Get top channels
    stats.subscriptionStats.topChannels = Array.from(channelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([channel, count]) => ({ channel, count }));
    
    return stats;
  }
  
  /**
   * Detect device type from user agent
   * 
   * @param userAgent User agent string
   * @returns Device type
   */
  private detectDeviceType(userAgent: string): string {
    userAgent = userAgent.toLowerCase();
    
    if (/(android|webos|iphone|ipad|ipod|blackberry|windows phone)/i.test(userAgent)) {
      if (/ipad/i.test(userAgent)) {
        return 'tablet';
      } else if (/mobile/i.test(userAgent)) {
        return 'mobile';
      } else if (/tablet/i.test(userAgent)) {
        return 'tablet';
      }
      return 'mobile';
    }
    
    return 'desktop';
  }
  
  /**
   * Simplify user agent for grouping
   * 
   * @param userAgent User agent string
   * @returns Simplified user agent
   */
  private simplifyUserAgent(userAgent: string): string {
    // Extract browser and major version
    if (/chrome/i.test(userAgent)) {
      return 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
      return 'Firefox';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      return 'Safari';
    } else if (/edge/i.test(userAgent)) {
      return 'Edge';
    } else if (/opera/i.test(userAgent) || /opr/i.test(userAgent)) {
      return 'Opera';
    } else if (/msie/i.test(userAgent) || /trident/i.test(userAgent)) {
      return 'Internet Explorer';
    }
    
    return 'Other';
  }
  
  /**
   * Get next sequence number for message deduplication
   * 
   * @returns Sequence number
   */
  private getNextSequence(): number {
    // Increment and wrap around at max safe integer
    this.messageSequence = (this.messageSequence + 1) % Number.MAX_SAFE_INTEGER;
    return this.messageSequence;
  }
}

// Create singleton instance
export const connectionRegistry = new ConnectionRegistry();