/**
 * WebSocket Service
 * 
 * Enhanced WebSocket service with connection state management,
 * authentication, and message handling
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
import { EventBus, EventType } from '../lib/event-bus';

/**
 * WebSocket authentication result
 */
interface AuthResult {
  authenticated: boolean;
  userId?: string;
  displayName?: string;
}

/**
 * Enhanced WebSocket service with advanced features
 */
export class WebSocketService {
  private connectionRegistry: ConnectionRegistry;
  private connectionStateRepository: ConnectionStateRepository;
  private presenceService?: PresenceService;
  private eventBus: EventBus;
  private channelSubscribers: Map<string, Set<WebSocket>> = new Map();
  
  /**
   * Create WebSocket service
   * @param db Database connection
   * @param eventBus Event bus instance
   * @param presenceService Optional presence service
   */
  constructor(
    db: Pool,
    eventBus: EventBus,
    presenceService?: PresenceService
  ) {
    this.connectionRegistry = new ConnectionRegistry();
    this.connectionStateRepository = new ConnectionStateRepository(db);
    this.presenceService = presenceService;
    this.eventBus = eventBus;
    
    // Set up global event subscriptions
    this.setupEventSubscriptions();
  }
  
  /**
   * Initialize WebSocket server
   * @param fastify Fastify instance
   */
  initialize(fastify: FastifyInstance): void {
    // Register WebSocket route
    fastify.get('/ws', { websocket: true }, (connection, request) => {
      this.handleConnection(connection.socket, request);
    });
    
    // Log connection stats periodically
    setInterval(() => {
      const stats = this.getStats();
      logger.debug('WebSocket stats', stats);
    }, 60000);
    
    // Clean up stale presence data periodically
    if (this.presenceService) {
      setInterval(() => {
        const threshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
        this.presenceService?.cleanupStalePresence(threshold)
          .catch(error => logger.error('Failed to clean up stale presence', { error }));
      }, 5 * 60 * 1000); // Every 5 minutes
    }
    
    logger.info('WebSocket service initialized');
  }
  
  /**
   * Handle new WebSocket connection
   * @param socket WebSocket connection
   * @param request HTTP request
   */
  private handleConnection(socket: WebSocket, request: any): void {
    let connectionId: string = '';
    let userId: string | null = null;
    
    // Extract connection ID for reconnection
    const existingConnectionId = this.getQueryParam(request, 'connectionId');
    const authToken = this.getAuthToken(request);
    
    // Generate new connection ID if none provided
    connectionId = existingConnectionId || uuidv4();
    
    // Add connection ID to socket for tracking
    socket.connectionId = connectionId;
    
    // Authenticate connection
    this.authenticateConnection(socket, authToken, existingConnectionId)
      .then(auth => {
        userId = auth.userId || null;
        
        // Send welcome message with connection info
        socket.send(JSON.stringify({
          type: 'connected',
          data: {
            connectionId,
            userId,
            authenticated: auth.authenticated,
            timestamp: new Date().toISOString()
          }
        }));
        
        // If authenticated, register the connection
        if (auth.authenticated && userId) {
          this.connectionRegistry.add(userId, socket);
          logger.info(`WebSocket connected: ${connectionId} for user ${userId}`);
          
          // Update user's presence to online
          if (this.presenceService) {
            this.presenceService.updatePresence(userId, { status: PresenceStatus.ONLINE })
              .catch(error => logger.error('Failed to update presence status', { error, userId }));
          }
        } else {
          logger.info(`Anonymous WebSocket connected: ${connectionId}`);
        }
        
        // Handle reconnection if requested
        if (existingConnectionId && userId) {
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
        const messageStr = data.toString();
        const message = JSON.parse(messageStr) as WebSocketMessage;
        this.handleMessage(socket, userId, message);
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
      logger.info(`WebSocket closed: ${connectionId}, code: ${code}, reason: ${reason || 'none'}`);
      
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
      logger.error('WebSocket error', { error, connectionId, userId });
    });
  }
  
  /**
   * Authenticate WebSocket connection
   * @param socket WebSocket connection
   * @param authToken Authentication token
   * @param connectionId Existing connection ID for reconnection
   * @returns Authentication result
   */
  private async authenticateConnection(
    socket: WebSocket,
    authToken: string | null,
    connectionId?: string
  ): Promise<AuthResult> {
    // In a real implementation, this would validate the auth token
    // For now, we'll use a simple token validation
    
    if (!authToken) {
      return { authenticated: false };
    }
    
    try {
      // This is a simplified example - in production, verify JWT token
      if (authToken.startsWith('Bearer ')) {
        const token = authToken.replace('Bearer ', '');
        
        // In a real implementation, this would decode and validate the JWT
        // For example, using the Clerk service or a JWT library
        
        // Simplified user extraction from token
        const isValid = token && token !== 'invalid';
        
        if (isValid) {
          // Extract user ID from token
          // This is a simplified example
          const userId = token.includes('user_') ? token : `user_${Math.floor(Math.random() * 1000)}`;
          const displayName = `User ${userId.replace('user_', '')}`;
          
          return { 
            authenticated: true,
            userId,
            displayName
          };
        }
      }
      
      return { authenticated: false };
    } catch (error) {
      logger.error('WebSocket authentication error', { error, authToken });
      return { authenticated: false };
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
      let missedEvents = 0;
      
      for (const channel of subscriptions) {
        this.subscribeToChannel(socket, channel);
      }
      
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
   * @param userId User ID (null if not authenticated)
   * @param message WebSocket message
   */
  private handleMessage(
    socket: WebSocket,
    userId: string | null,
    message: WebSocketMessage
  ): void {
    try {
      switch (message.type) {
        case 'ping':
          // Simple ping-pong for connection health checks
          socket.send(JSON.stringify({ 
            type: 'pong',
            id: message.id,
            timestamp: Date.now()
          }));
          break;
          
        case 'subscribe':
          // Handle channel subscription
          if (userId && message.payload?.channels && Array.isArray(message.payload.channels)) {
            const channels = message.payload.channels;
            const subscribed = this.handleSubscription(socket, userId, channels);
            
            socket.send(JSON.stringify({
              type: 'subscribe:confirmation',
              id: message.id,
              payload: {
                channels: subscribed,
                timestamp: new Date().toISOString()
              }
            }));
          } else {
            socket.send(JSON.stringify({
              type: 'error',
              id: message.id,
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
            this.handleUnsubscription(socket, channels);
            
            socket.send(JSON.stringify({
              type: 'unsubscribe:confirmation',
              id: message.id,
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
            this.presenceService.updatePresence(userId, { 
              status,
              metadata: message.payload.metadata
            })
              .then(() => {
                socket.send(JSON.stringify({
                  type: 'presence:updated',
                  id: message.id,
                  payload: {
                    status,
                    timestamp: new Date().toISOString()
                  }
                }));
              })
              .catch(error => {
                logger.error('Error updating presence', { error, userId });
                socket.send(JSON.stringify({
                  type: 'error',
                  id: message.id,
                  payload: {
                    message: 'Failed to update presence',
                    code: 'PRESENCE_UPDATE_FAILED'
                  }
                }));
              });
          } else {
            socket.send(JSON.stringify({
              type: 'error',
              id: message.id,
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
            id: message.id,
            payload: {
              message: 'Unknown message type',
              code: 'UNKNOWN_MESSAGE_TYPE'
            }
          }));
      }
      
      // Save connection state if authenticated
      if (userId && socket.connectionId) {
        this.saveConnectionState(socket, userId)
          .catch(error => logger.error('Failed to save connection state', { 
            error, 
            connectionId: socket.connectionId,
            userId 
          }));
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
  private handleSubscription(
    socket: WebSocket,
    userId: string,
    channels: string[]
  ): string[] {
    const allowedChannels: string[] = [];
    
    for (const channel of channels) {
      // Check if user is allowed to subscribe to this channel
      if (this.canSubscribeToChannel(userId, channel)) {
        this.subscribeToChannel(socket, channel);
        allowedChannels.push(channel);
      } else {
        logger.warn(`User ${userId} not allowed to subscribe to channel ${channel}`);
      }
    }
    
    if (socket.connectionId) {
      // Save subscription to connection state
      this.connectionStateRepository.updateConnectionState(socket.connectionId, {
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
  private handleUnsubscription(socket: WebSocket, channels: string[]): void {
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
      this.connectionStateRepository.getConnectionState(socket.connectionId)
        .then(state => {
          if (state) {
            const currentSubscriptions = state.subscriptions || [];
            const updatedSubscriptions = currentSubscriptions.filter(
              channel => !channels.includes(channel)
            );
            
            return this.connectionStateRepository.updateConnectionState(
              socket.connectionId,
              { subscriptions: updatedSubscriptions }
            );
          }
        })
        .catch(error => {
          logger.error('Failed to update subscription state', { error, channels });
        });
    }
  }
  
  /**
   * Check if user can subscribe to channel
   * @param userId User ID
   * @param channel Channel name
   * @returns Whether user can subscribe
   */
  private canSubscribeToChannel(userId: string, channel: string): boolean {
    // Implement channel access control here
    // For example, check if channel is for specific user
    
    // Allow user-specific channels
    if (channel === `user:${userId}`) {
      return true;
    }
    
    // Allow user notification channel
    if (channel === `user:${userId}:notifications`) {
      return true;
    }
    
    // Allow public channels
    if (channel === 'public:announcements' || 
        channel === 'market:updates' ||
        channel === 'content:new') {
      return true;
    }
    
    // Disallow other private channels
    if (channel.startsWith('user:') && !channel.startsWith(`user:${userId}`)) {
      return false;
    }
    
    // By default, allow subscription
    return true;
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
      // Additional metadata can be added here
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
}
