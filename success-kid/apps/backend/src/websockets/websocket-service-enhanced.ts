/**
 * Enhanced WebSocket Service
 * 
 * Improved WebSocket service with better performance, reliability,
 * and error handling for robust real-time communication
 */
import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { ConnectionRegistry } from './connection-registry';
import { ConnectionStateRepository } from '../repositories/connection-state-repository';
import { CreateConnectionStateDto, WebSocketMessage } from '../models/connection-state';
import { PresenceService } from '../services/presence/presence-service';
import { PresenceStatus } from '../models/presence';
import { logger } from '../lib/logger';
import { Pool } from 'pg';
import { EnhancedEventBus, EventType } from '../lib/enhanced-event-bus';
import { Redis } from 'ioredis';
import { JwtService } from '../auth/jwt';

// Extend WebSocket to include our custom properties
declare module 'ws' {
  interface WebSocket {
    connectionId?: string;
    userId?: string;
    metadata?: Record<string, any>;
    lastActivity?: number;
    isAlive?: boolean;
  }
}

/**
 * Options for WebSocket service
 */
interface WebSocketServiceOptions {
  /**
   * Maximum message size in bytes
   * Default: 1MB
   */
  maxPayload?: number;
  
  /**
   * Enable client tracking
   * Default: true
   */
  clientTracking?: boolean;
  
  /**
   * Ping interval in milliseconds
   * Default: 30000ms (30 seconds)
   */
  pingInterval?: number;
  
  /**
   * Ping timeout in milliseconds
   * Default: 10000ms (10 seconds)
   */
  pingTimeout?: number;
  
  /**
   * Maximum connections per user
   * Default: 5
   */
  maxConnectionsPerUser?: number;
  
  /**
   * Path for WebSocket endpoint
   * Default: /ws
   */
  path?: string;
}

/**
 * Enhanced WebSocket service with improved features
 */
export class EnhancedWebSocketService {
  private connectionRegistry: ConnectionRegistry;
  private connectionStateRepository: ConnectionStateRepository;
  private presenceService?: PresenceService;
  private eventBus: EnhancedEventBus;
  private jwtService: JwtService;
  private channelSubscribers: Map<string, Set<WebSocket>> = new Map();
  private options: Required<WebSocketServiceOptions>;
  private heartbeatInterval?: NodeJS.Timeout;
  private redis: Redis;
  
  // Default options
  private readonly DEFAULT_OPTIONS: Required<WebSocketServiceOptions> = {
    maxPayload: 1048576, // 1MB
    clientTracking: true,
    pingInterval: 30000, // 30 seconds
    pingTimeout: 10000, // 10 seconds
    maxConnectionsPerUser: 5,
    path: '/ws'
  };
  
  /**
   * Create enhanced WebSocket service
   * @param db Database connection
   * @param eventBus Enhanced event bus
   * @param redis Redis client
   * @param jwtService JWT service for authentication
   * @param presenceService Optional presence service
   * @param options Service options
   */
  constructor(
    db: Pool,
    eventBus: EnhancedEventBus,
    redis: Redis,
    jwtService: JwtService,
    presenceService?: PresenceService,
    options: WebSocketServiceOptions = {}
  ) {
    this.connectionRegistry = new ConnectionRegistry();
    this.connectionStateRepository = new ConnectionStateRepository(db);
    this.presenceService = presenceService;
    this.eventBus = eventBus;
    this.jwtService = jwtService;
    this.redis = redis;
    
    // Merge options with defaults
    this.options = {
      ...this.DEFAULT_OPTIONS,
      ...options
    };
    
    // Set up global event subscriptions
    this.setupEventSubscriptions();
    
    logger.info('Enhanced WebSocket service created', {
      options: this.options
    });
  }
  
  /**
   * Initialize WebSocket server
   * @param fastify Fastify instance
   */
  initialize(fastify: FastifyInstance): void {
    // Register WebSocket plugin
    fastify.register(require('@fastify/websocket'), {
      options: {
        maxPayload: this.options.maxPayload,
        clientTracking: this.options.clientTracking,
      },
    });
    
    // Register WebSocket route
    fastify.get(this.options.path, { websocket: true }, (connection, request) => {
      this.handleConnection(connection.socket, request);
    });
    
    // Start heartbeat interval
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, this.options.pingInterval);
    
    // Log connection stats periodically
    setInterval(() => {
      const stats = this.getStats();
      logger.debug('WebSocket stats', stats);
    }, 60000); // Every minute
    
    // Clean up stale presence and connection data periodically
    setInterval(() => {
      this.cleanupStaleData();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    logger.info('Enhanced WebSocket service initialized', {
      path: this.options.path
    });
  }
  
  /**
   * Perform heartbeat check on all connections
   */
  private performHeartbeat(): void {
    const terminalStates = [WebSocket.CLOSING, WebSocket.CLOSED];
    
    // Get all connections
    const allSockets = this.connectionRegistry.getAllConnections();
    
    for (const socket of allSockets) {
      // Skip sockets that are already closing or closed
      if (terminalStates.includes(socket.readyState)) {
        continue;
      }
      
      // Check if socket responded to previous ping
      if (socket.isAlive === false) {
        logger.debug('Terminating non-responsive connection', {
          connectionId: socket.connectionId,
          userId: socket.userId
        });
        
        socket.terminate();
        continue;
      }
      
      // Mark as not alive until pong response
      socket.isAlive = false;
      
      // Send ping
      try {
        socket.ping();
      } catch (error) {
        logger.error('Error sending ping', {
          error,
          connectionId: socket.connectionId
        });
        
        // Terminate if ping fails
        socket.terminate();
      }
    }
  }
  
  /**
   * Clean up stale data (presence, connection states)
   */
  private async cleanupStaleData(): Promise<void> {
    try {
      // Calculate threshold time
      const presenceThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const connectionThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      // Clean up stale presence
      if (this.presenceService) {
        const cleanedPresence = await this.presenceService.cleanupStalePresence(presenceThreshold);
        if (cleanedPresence > 0) {
          logger.info(`Cleaned up ${cleanedPresence} stale presence records`);
        }
      }
      
      // Clean up stale connection states
      const cleanedConnections = await this.connectionStateRepository.deleteStaleConnectionStates(connectionThreshold);
      if (cleanedConnections > 0) {
        logger.info(`Cleaned up ${cleanedConnections} stale connection states`);
      }
    } catch (error) {
      logger.error('Error cleaning up stale data', { error });
    }
  }
  
  /**
   * Handle new WebSocket connection
   * @param socket WebSocket connection
   * @param request HTTP request
   */
  private handleConnection(socket: WebSocket, request: any): void {
    // Initialize socket properties
    socket.isAlive = true;
    socket.lastActivity = Date.now();
    
    // Extract connection ID for reconnection
    const existingConnectionId = this.getQueryParam(request, 'connectionId');
    const authToken = this.getAuthToken(request);
    
    // Generate new connection ID if none provided
    const connectionId = existingConnectionId || uuidv4();
    socket.connectionId = connectionId;
    
    // Set up ping/pong handling
    socket.on('pong', () => {
      socket.isAlive = true;
      socket.lastActivity = Date.now();
    });
    
    // Authenticate connection
    this.authenticateConnection(socket, authToken, existingConnectionId)
      .then(userId => {
        if (!userId) {
          // Anonymous connection
          logger.info(`Anonymous WebSocket connected: ${connectionId}`);
          
          socket.send(JSON.stringify({
            type: 'connected',
            data: {
              connectionId,
              authenticated: false,
              timestamp: new Date().toISOString()
            }
          }));
          return;
        }
        
        // Check connection limit per user
        const userConnections = this.connectionRegistry.getUserConnections(userId);
        if (userConnections && userConnections.size >= this.options.maxConnectionsPerUser) {
          logger.warn(`Connection limit reached for user ${userId}`);
          
          socket.send(JSON.stringify({
            type: 'error',
            data: {
              message: 'Connection limit reached',
              code: 'CONNECTION_LIMIT_REACHED'
            }
          }));
          socket.close(1013, 'Connection limit reached');
          return;
        }
        
        // Authenticated connection
        socket.userId = userId;
        this.connectionRegistry.add(userId, socket);
        
        logger.info(`WebSocket connected: ${connectionId} for user ${userId}`);
        
        // Send welcome message
        socket.send(JSON.stringify({
          type: 'connected',
          data: {
            connectionId,
            userId,
            authenticated: true,
            timestamp: new Date().toISOString()
          }
        }));
        
        // Update presence status
        if (this.presenceService) {
          this.presenceService.updatePresence(userId, { status: PresenceStatus.ONLINE })
            .catch(error => logger.error('Failed to update presence status', { error, userId }));
        }
        
        // Handle reconnection if requested
        if (existingConnectionId) {
          this.handleReconnection(socket, existingConnectionId, userId)
            .catch(error => logger.error('Failed to handle reconnection', { 
              error, 
              connectionId: existingConnectionId,
              userId 
            }));
        }
      })
      .catch(error => {
        logger.error('Authentication error', { error, connectionId });
        
        socket.send(JSON.stringify({
          type: 'error',
          data: {
            message: 'Authentication failed',
            code: 'AUTH_FAILED'
          }
        }));
        socket.close(1008, 'Authentication failed');
      });
    
    // Set up message handling
    socket.on('message', (data: WebSocket.Data) => {
      try {
        socket.lastActivity = Date.now();
        const messageStr = data.toString();
        const message = JSON.parse(messageStr) as WebSocketMessage;
        
        this.handleMessage(socket, message)
          .catch(error => logger.error('Error handling message', { error, message }));
      } catch (error) {
        logger.error('Error parsing WebSocket message', { error });
        
        socket.send(JSON.stringify({
          type: 'error',
          data: {
            message: 'Invalid message format',
            code: 'INVALID_FORMAT'
          }
        }));
      }
    });
    
    // Handle connection close
    socket.on('close', (code, reason) => {
      const userId = socket.userId;
      logger.info(`WebSocket closed: ${connectionId}, code: ${code}, reason: ${reason || 'none'}, userId: ${userId || 'anonymous'}`);
      
      // Remove from registry
      if (userId) {
        this.connectionRegistry.remove(userId, socket);
        
        // Update presence status if no connections remain
        if (this.presenceService && !this.connectionRegistry.hasConnections(userId)) {
          this.presenceService.updatePresence(userId, { status: PresenceStatus.OFFLINE })
            .catch(error => logger.error('Failed to update presence status', { error, userId }));
        }
      }
      
      // Remove from channel subscriptions
      this.channelSubscribers.forEach((subscribers, channel) => {
        subscribers.delete(socket);
        if (subscribers.size === 0) {
          this.channelSubscribers.delete(channel);
        }
      });
    });
    
    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error', { error, connectionId, userId: socket.userId });
    });
  }
  
  /**
   * Authenticate WebSocket connection
   * @param socket WebSocket connection
   * @param authToken Authentication token
   * @param connectionId Existing connection ID for reconnection
   * @returns User ID if authenticated, null otherwise
   */
  private async authenticateConnection(
    socket: WebSocket,
    authToken: string | null,
    connectionId?: string
  ): Promise<string | null> {
    if (!authToken) {
      return null;
    }
    
    try {
      // Extract token from Bearer format
      const token = authToken.startsWith('Bearer ') 
        ? authToken.replace('Bearer ', '') 
        : authToken;
      
      // Verify token with JWT service
      const decodedToken = await this.jwtService.verify(token);
      
      if (decodedToken && decodedToken.sub) {
        // Successfully authenticated
        return decodedToken.sub;
      }
      
      return null;
    } catch (error) {
      logger.error('WebSocket authentication error', { error, authToken });
      return null;
    }
  }
  
  /**
   * Handle WebSocket reconnection
   * @param socket WebSocket connection
   * @param connectionId Connection ID
   * @param userId User ID
   */
  private async handleReconnection(
    socket: WebSocket,
    connectionId: string,
    userId: string
  ): Promise<void> {
    try {
      // Get saved connection state
      const state = await this.connectionStateRepository.getConnectionState(connectionId);
      
      if (!state) {
        socket.send(JSON.stringify({
          type: 'reconnect:failed',
          data: {
            reason: 'state_not_found',
            message: 'No connection state found for reconnection'
          }
        }));
        return;
      }
      
      // Verify user ID matches
      if (state.userId !== userId) {
        socket.send(JSON.stringify({
          type: 'reconnect:failed',
          data: {
            reason: 'user_mismatch',
            message: 'User ID mismatch for reconnection'
          }
        }));
        return;
      }
      
      // Restore subscriptions
      const subscriptions = state.subscriptions || [];
      
      for (const channel of subscriptions) {
        this.subscribeToChannel(socket, channel);
      }
      
      // Calculate approximate number of missed events
      // This is a simplified approach - in production, use event IDs for accurate counting
      const missedEvents = 0; // To be implemented with event ID tracking
      
      // Send success response
      socket.send(JSON.stringify({
        type: 'reconnect:success',
        data: {
          connectionId,
          restoredSubscriptions: subscriptions.length,
          missedEvents,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Update last seen
      await this.connectionStateRepository.updateConnectionState(connectionId, {
        lastSeen: new Date()
      });
      
      logger.info(`Reconnection successful: ${connectionId} for user ${userId}`);
    } catch (error) {
      logger.error('Reconnection error', { error, connectionId, userId });
      
      socket.send(JSON.stringify({
        type: 'reconnect:failed',
        data: {
          reason: 'internal_error',
          message: 'Internal error during reconnection'
        }
      }));
    }
  }
  
  /**
   * Handle WebSocket message
   * @param socket WebSocket connection
   * @param message WebSocket message
   */
  private async handleMessage(
    socket: WebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    try {
      const userId = socket.userId;
      
      // Default response ID
      const responseId = message.id || uuidv4();
      
      switch (message.type) {
        case 'ping':
          // Simple ping-pong for connection health checks
          socket.send(JSON.stringify({ 
            type: 'pong',
            id: responseId,
            timestamp: Date.now()
          }));
          break;
          
        case 'subscribe':
          // Handle channel subscription
          if (userId && message.payload?.channels && Array.isArray(message.payload.channels)) {
            const channels = message.payload.channels;
            const subscribed = await this.handleSubscription(socket, userId, channels);
            
            socket.send(JSON.stringify({
              type: 'subscribe:confirmation',
              id: responseId,
              payload: {
                channels: subscribed,
                timestamp: new Date().toISOString()
              }
            }));
          } else {
            socket.send(JSON.stringify({
              type: 'error',
              id: responseId,
              payload: {
                message: 'Authentication required for subscription',
                code: 'AUTH_REQUIRED'
              }
            }));
          }
          break;
          
        case 'unsubscribe':
          // Handle channel unsubscription
          if (message.payload?.channels && Array.isArray(message.payload.channels)) {
            const channels = message.payload.channels;
            await this.handleUnsubscription(socket, channels);
            
            socket.send(JSON.stringify({
              type: 'unsubscribe:confirmation',
              id: responseId,
              payload: {
                channels,
                timestamp: new Date().toISOString()
              }
            }));
          }
          break;
          
        case 'presence:update':
          // Handle presence update
          if (userId && this.presenceService && message.payload?.status) {
            const status = message.payload.status;
            await this.presenceService.updatePresence(userId, { 
              status,
              metadata: message.payload.metadata
            });
            
            socket.send(JSON.stringify({
              type: 'presence:updated',
              id: responseId,
              payload: {
                status,
                timestamp: new Date().toISOString()
              }
            }));
          } else {
            socket.send(JSON.stringify({
              type: 'error',
              id: responseId,
              payload: {
                message: 'Authentication required for presence updates',
                code: 'AUTH_REQUIRED'
              }
            }));
          }
          break;
          
        default:
          logger.warn(`Unknown message type: ${message.type}`);
          
          socket.send(JSON.stringify({
            type: 'error',
            id: responseId,
            payload: {
              message: 'Unknown message type',
              code: 'UNKNOWN_MESSAGE_TYPE'
            }
          }));
      }
      
      // Save connection state if authenticated
      if (userId && socket.connectionId) {
        await this.saveConnectionState(socket, userId);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message', { error, message });
      
      socket.send(JSON.stringify({
        type: 'error',
        id: message.id,
        payload: { 
          message: 'Error processing message',
          code: 'PROCESSING_ERROR' 
        }
      }));
    }
  }
  
  /**
   * Handle channel subscription
   * @param socket WebSocket connection
   * @param userId User ID
   * @param channels Channels to subscribe to
   * @returns Successfully subscribed channels
   */
  private async handleSubscription(
    socket: WebSocket,
    userId: string,
    channels: string[]
  ): Promise<string[]> {
    const allowedChannels: string[] = [];
    
    for (const channel of channels) {
      // Check if user is allowed to subscribe to this channel
      if (await this.canSubscribeToChannel(userId, channel)) {
        this.subscribeToChannel(socket, channel);
        allowedChannels.push(channel);
      } else {
        logger.warn(`User ${userId} not allowed to subscribe to channel ${channel}`);
      }
    }
    
    if (socket.connectionId) {
      // Save subscription to connection state
      await this.connectionStateRepository.updateConnectionState(socket.connectionId, {
        subscriptions: allowedChannels
      }).catch(error => {
        logger.error('Failed to save subscription state', { error, userId, channels });
      });
    }
    
    return allowedChannels;
  }
  
  /**
   * Subscribe socket to channel
   * @param socket WebSocket connection
   * @param channel Channel name
   */
  private subscribeToChannel(socket: WebSocket, channel: string): void {
    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set());
    }
    
    this.channelSubscribers.get(channel)!.add(socket);
    logger.debug(`Socket subscribed to channel: ${channel}`);
  }
  
  /**
   * Handle channel unsubscription
   * @param socket WebSocket connection
   * @param channels Channels to unsubscribe from
   */
  private async handleUnsubscription(socket: WebSocket, channels: string[]): Promise<void> {
    for (const channel of channels) {
      if (this.channelSubscribers.has(channel)) {
        this.channelSubscribers.get(channel)!.delete(socket);
        
        // Clean up empty channel
        if (this.channelSubscribers.get(channel)!.size === 0) {
          this.channelSubscribers.delete(channel);
        }
        
        logger.debug(`Socket unsubscribed from channel: ${channel}`);
      }
    }
    
    // Update connection state
    if (socket.connectionId) {
      // Get current subscriptions
      const state = await this.connectionStateRepository.getConnectionState(socket.connectionId);
      if (state) {
        const currentSubscriptions = state.subscriptions || [];
        const updatedSubscriptions = currentSubscriptions.filter(
          channel => !channels.includes(channel)
        );
        
        await this.connectionStateRepository.updateConnectionState(
          socket.connectionId,
          { subscriptions: updatedSubscriptions }
        );
      }
    }
  }
  
  /**
   * Check if user can subscribe to channel
   * @param userId User ID
   * @param channel Channel name
   * @returns Whether user can subscribe
   */
  private async canSubscribeToChannel(userId: string, channel: string): Promise<boolean> {
    // Allow user-specific channels
    if (channel === `user:${userId}` || channel.startsWith(`user:${userId}:`)) {
      return true;
    }
    
    // Allow public channels
    if (channel === 'public:announcements' || 
        channel === 'market:updates' ||
        channel === 'content:new' ||
        channel === 'feed:updates') {
      return true;
    }
    
    // Check Redis for dynamic channel permissions
    if (channel.includes(':')) {
      const [channelType, channelId] = channel.split(':', 2);
      
      if (channelType === 'room' || channelType === 'chat') {
        // Check if user is member of this room/chat
        const isMember = await this.redis.sismember(`${channelType}:${channelId}:members`, userId);
        return isMember === 1;
      }
    }
    
    // Disallow other private channels
    if (channel.startsWith('user:') && !channel.startsWith(`user:${userId}`)) {
      return false;
    }
    
    // By default, deny subscription
    return false;
  }
  
  /**
   * Save connection state for reconnection
   * @param socket WebSocket connection
   * @param userId User ID
   */
  private async saveConnectionState(socket: WebSocket, userId: string): Promise<void> {
    if (!socket.connectionId) {
      return;
    }
    
    // Get current subscriptions
    const subscriptions: string[] = [];
    this.channelSubscribers.forEach((subscribers, channel) => {
      if (subscribers.has(socket)) {
        subscriptions.push(channel);
      }
    });
    
    // Save state
    const stateData: CreateConnectionStateDto = {
      connectionId: socket.connectionId,
      userId,
      subscriptions,
      metadata: socket.metadata
    };
    
    await this.connectionStateRepository.saveConnectionState(stateData);
  }
  
  /**
   * Send message to a specific user
   * @param userId User ID
   * @param message Message to send
   * @returns Number of connections message was sent to
   */
  sendToUser(userId: string, message: any): number {
    return this.connectionRegistry.sendToUser(userId, message);
  }
  
  /**
   * Send message to all connections
   * @param message Message to send
   * @returns Number of connections message was sent to
   */
  sendToAll(message: any): number {
    return this.connectionRegistry.sendToAll(message);
  }
  
  /**
   * Send message to a specific channel
   * @param channel Channel name
   * @param message Message to send
   * @returns Number of connections message was sent to
   */
  sendToChannel(channel: string, message: any): number {
    if (!this.channelSubscribers.has(channel)) {
      return 0;
    }
    
    const subscribers = this.channelSubscribers.get(channel)!;
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    let sentCount = 0;
    
    subscribers.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(messageString);
        sentCount++;
      }
    });
    
    return sentCount;
  }
  
  /**
   * Send message to multiple channels
   * @param channels Channel names
   * @param message Message to send
   * @returns Number of connections message was sent to
   */
  sendToChannels(channels: string[], message: any): number {
    let sentCount = 0;
    
    for (const channel of channels) {
      sentCount += this.sendToChannel(channel, message);
    }
    
    return sentCount;
  }
  
  /**
   * Get connection statistics
   * @returns Connection statistics
   */
  getStats(): {
    totalConnections: number;
    authenticatedUsers: number;
    channelStats: Record<string, number>;
  } {
    const totalConnections = this.connectionRegistry.getConnectionCount();
    const authenticatedUsers = this.connectionRegistry.getUserCount();
    
    const channelStats: Record<string, number> = {};
    this.channelSubscribers.forEach((subscribers, channel) => {
      channelStats[channel] = subscribers.size;
    });
    
    return {
      totalConnections,
      authenticatedUsers,
      channelStats
    };
  }
  
  /**
   * Set up event subscriptions for broadcasting
   */
  private setupEventSubscriptions(): void {
    // Points awarded events
    this.eventBus.subscribe(EventType.POINTS_AWARDED, data => {
      const { userId, amount, source } = data;
      this.sendToUser(userId, {
        type: 'points.awarded',
        data: {
          amount,
          source,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    // Achievement unlocked events
    this.eventBus.subscribe(EventType.ACHIEVEMENT_UNLOCKED, data => {
      const { userId, achievement } = data;
      this.sendToUser(userId, {
        type: 'achievement.unlocked',
        data: {
          achievement,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    // Content created events
    this.eventBus.subscribe(EventType.CONTENT_CREATED, data => {
      this.sendToChannel('content:new', {
        type: 'content.created',
        data: {
          id: data.id,
          author: data.author,
          preview: data.preview,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    // Milestone reached events
    this.eventBus.subscribe(EventType.MILESTONE_REACHED, data => {
      this.sendToAll({
        type: 'milestone.reached',
        data: {
          milestone: data.milestone,
          value: data.value,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    // Notification events
    this.eventBus.subscribe(EventType.NOTIFICATION_CREATED, data => {
      const { userId, notification } = data;
      this.sendToUser(userId, {
        type: 'notification.new',
        data: {
          notification,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    // Market data updates
    this.eventBus.subscribe(EventType.PRICE_UPDATED, data => {
      this.sendToChannel('market:updates', {
        type: 'price.updated',
        data: {
          price: data.price,
          change: data.change,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    // Transaction events
    this.eventBus.subscribe(EventType.TRANSACTION_DETECTED, data => {
      this.sendToChannel('market:updates', {
        type: 'transaction.detected',
        data: {
          transaction: data.transaction,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    // Activity feed updates
    this.eventBus.subscribe(EventType.FEED_UPDATED, data => {
      if (data.userId) {
        // If targeted to specific user
        this.sendToUser(data.userId, {
          type: 'feed.updated',
          data: {
            items: data.items,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        // If global feed update
        this.sendToChannel('feed:updates', {
          type: 'feed.updated',
          data: {
            items: data.items,
            timestamp: new Date().toISOString()
          }
        });
      }
    });
    
    // Presence updates
    this.eventBus.subscribe(EventType.PRESENCE_UPDATED, data => {
      // If user is in a room, notify room members
      if (data.roomId) {
        this.sendToChannel(`room:${data.roomId}`, {
          type: 'presence.updated',
          data: {
            userId: data.userId,
            status: data.status,
            timestamp: new Date().toISOString()
          }
        });
      }
    });
  }
  
  /**
   * Extract authentication token from request
   * @param request HTTP request
   * @returns Authentication token
   */
  private getAuthToken(request: any): string | null {
    // Try different auth token locations
    
    // From query parameter
    const queryToken = this.getQueryParam(request, 'token');
    if (queryToken) {
      return `Bearer ${queryToken}`;
    }
    
    // From authorization header
    const authHeader = request.headers && request.headers.authorization;
    if (authHeader) {
      return authHeader;
    }
    
    // No token found
    return null;
  }
  
  /**
   * Get query parameter from request
   * @param request HTTP request
   * @param param Parameter name
   * @returns Parameter value
   */
  private getQueryParam(request: any, param: string): string | null {
    const url = new URL(
      request.url,
      `http://${request.headers.host || 'localhost'}`
    );
    return url.searchParams.get(param);
  }
  
  /**
   * Shutdown websocket service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket service...');
    
    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    
    // Close all connections with proper code
    const allSockets = this.connectionRegistry.getAllConnections();
    for (const socket of allSockets) {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.close(1001, 'Service shutting down');
        } catch (error) {
          logger.error('Error closing socket during shutdown', {
            error,
            connectionId: socket.connectionId
          });
        }
      }
    }
    
    logger.info('WebSocket service shutdown complete');
  }
}
