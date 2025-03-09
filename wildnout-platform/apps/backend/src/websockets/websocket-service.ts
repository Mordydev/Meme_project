import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { Logger } from 'pino';
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { ConnectionManager } from './connection-manager';
import { EventEmitter, EventType } from '../lib/events';
import { RateLimiter } from '../lib/rate-limiter';
import { AuthError } from '../lib/errors';

/**
 * Available channel prefixes for subscription
 */
enum ChannelPrefix {
  USER = 'user:',
  BATTLE = 'battle:',
  CONTENT = 'content:',
  TOKEN = 'token:',
  SYSTEM = 'system:'
}

/**
 * WebSocket message structure
 */
interface WSMessage {
  action: string;
  channel?: string;
  data?: any;
  id?: string;
}

/**
 * WebSocket service for handling real-time communications
 */
export class WebSocketService {
  private wss: WebSocketServer;
  private connectionManager: ConnectionManager;
  private rateLimiter: RateLimiter;
  private messageHandlers: Map<string, (connectionId: string, userId: string, data: any) => Promise<void>>;
  
  /**
   * Create a new WebSocket service
   */
  constructor(
    server: Server,
    private readonly fastify: FastifyInstance,
    private readonly eventEmitter: EventEmitter,
    private readonly logger: Logger
  ) {
    // Initialize connection manager
    this.connectionManager = new ConnectionManager(
      eventEmitter,
      fastify.metrics,
      logger
    );
    
    // Initialize rate limiter
    this.rateLimiter = new RateLimiter({
      redis: fastify.redis,
      logger
    });
    
    // Initialize message handlers
    this.messageHandlers = new Map();
    this.registerMessageHandlers();
    
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      maxPayload: 1048576 // 1MB
    });
    
    // Set up connection handler
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Set up interval health checks and metrics
    setInterval(() => this.performHealthCheck(), 30000);
    setInterval(() => this.reportMetrics(), 60000);
    
    // Register event listeners
    this.registerEventListeners();
    
    logger.info('WebSocket server initialized');
  }
  
  /**
   * Register WebSocket message handlers
   */
  private registerMessageHandlers(): void {
    // Subscribe to channel
    this.messageHandlers.set('subscribe', async (connectionId, userId, data) => {
      const { channel } = data;
      
      if (!channel || typeof channel !== 'string') {
        this.sendError(connectionId, 'invalid_request', 'Channel is required');
        return;
      }
      
      // Check rate limiting
      const isLimited = await this.rateLimiter.isLimited(userId, 'ws_channel_join');
      if (isLimited) {
        this.sendError(connectionId, 'rate_limited', 'Too many channel subscriptions');
        return;
      }
      
      // Validate channel access permissions
      if (!this.canAccessChannel(userId, channel)) {
        this.sendError(connectionId, 'forbidden', `Cannot subscribe to channel: ${channel}`);
        return;
      }
      
      // Subscribe to channel
      this.connectionManager.subscribeToChannel(connectionId, channel);
      
      // Send success response
      this.connectionManager.sendToConnection(connectionId, 'subscribe_success', {
        channel,
        timestamp: new Date().toISOString()
      });
      
      this.logger.debug({ connectionId, userId, channel }, 'User subscribed to channel');
    });
    
    // Unsubscribe from channel
    this.messageHandlers.set('unsubscribe', async (connectionId, userId, data) => {
      const { channel } = data;
      
      if (!channel || typeof channel !== 'string') {
        this.sendError(connectionId, 'invalid_request', 'Channel is required');
        return;
      }
      
      // Unsubscribe from channel
      this.connectionManager.unsubscribeFromChannel(connectionId, channel);
      
      // Send success response
      this.connectionManager.sendToConnection(connectionId, 'unsubscribe_success', {
        channel,
        timestamp: new Date().toISOString()
      });
      
      this.logger.debug({ connectionId, userId, channel }, 'User unsubscribed from channel');
    });
    
    // Ping for connection health check
    this.messageHandlers.set('ping', async (connectionId) => {
      this.connectionManager.sendToConnection(connectionId, 'pong', {
        timestamp: new Date().toISOString()
      });
    });
  }
  
  /**
   * Register event listeners for broadcasting events
   */
  private registerEventListeners(): void {
    // Notification event listener
    this.eventEmitter.on(EventType.NOTIFICATION_CREATED, async (data) => {
      const { userId, notificationId } = data;
      const userChannel = `${ChannelPrefix.USER}${userId}`;
      
      // Get notification details
      const notificationRepo = this.fastify.notificationRepository;
      const notification = await notificationRepo.findById(notificationId);
      
      if (notification) {
        this.connectionManager.sendToChannel(userChannel, 'notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          createdAt: notification.createdAt
        });
        
        // Also send updated unread count
        const unreadCount = await notificationRepo.count({ 
          userId, 
          read: false 
        });
        
        this.connectionManager.sendToChannel(userChannel, 'notification_count', {
          unreadCount
        });
      }
    });
    
    // Battle events
    this.eventEmitter.on(EventType.BATTLE_ENTRY_SUBMITTED, async (data) => {
      const { battleId, entryId, userId } = data;
      const battleChannel = `${ChannelPrefix.BATTLE}${battleId}`;
      
      this.connectionManager.sendToChannel(battleChannel, 'battle_entry', {
        battleId,
        entryId,
        userId,
        timestamp: data.timestamp
      });
    });
    
    this.eventEmitter.on(EventType.BATTLE_VOTING_STARTED, async (data) => {
      const { battleId } = data;
      const battleChannel = `${ChannelPrefix.BATTLE}${battleId}`;
      
      this.connectionManager.sendToChannel(battleChannel, 'battle_voting_started', {
        battleId,
        timestamp: data.timestamp
      });
    });
    
    this.eventEmitter.on(EventType.BATTLE_COMPLETED, async (data) => {
      const { battleId, winnerId } = data;
      const battleChannel = `${ChannelPrefix.BATTLE}${battleId}`;
      
      this.connectionManager.sendToChannel(battleChannel, 'battle_completed', {
        battleId,
        winnerId,
        timestamp: data.timestamp
      });
    });
    
    // Token price updates
    this.eventEmitter.on(EventType.TOKEN_PRICE_UPDATED, async (data) => {
      const { price, change } = data;
      const tokenChannel = `${ChannelPrefix.TOKEN}price`;
      
      this.connectionManager.sendToChannel(tokenChannel, 'token_price', {
        price,
        change,
        timestamp: data.timestamp
      });
    });
    
    // Token milestones
    this.eventEmitter.on(EventType.TOKEN_MILESTONE_REACHED, async (data) => {
      const { milestone, marketCap } = data;
      const systemChannel = `${ChannelPrefix.SYSTEM}announcements`;
      
      this.connectionManager.sendToChannel(systemChannel, 'token_milestone', {
        milestone,
        marketCap,
        timestamp: data.timestamp
      });
      
      // Broadcast to all users for major milestones
      if (milestone.includes('major')) {
        this.connectionManager.broadcast('token_milestone', {
          milestone,
          marketCap,
          timestamp: data.timestamp
        });
      }
    });
  }
  
  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    try {
      // Parse URL and query parameters
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        this.closeConnection(ws, 1008, 'Authentication required');
        return;
      }
      
      // Verify token and get user ID
      let userId;
      
      try {
        // Use auth service to verify token
        const authService = this.fastify.services.userService;
        const session = await authService.verifyToken(token);
        userId = session.userId;
      } catch (error) {
        this.logger.error({ error }, 'Authentication error');
        this.closeConnection(ws, 1008, 'Invalid authentication');
        return;
      }
      
      if (!userId) {
        this.closeConnection(ws, 1008, 'Invalid authentication');
        return;
      }
      
      // Check connection rate limiting
      const isLimited = await this.rateLimiter.isLimited(userId, 'ws_connection');
      if (isLimited) {
        this.closeConnection(ws, 1008, 'Too many connection attempts');
        return;
      }
      
      // Register connection
      const connectionId = this.connectionManager.registerConnection(userId, ws, {
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
      
      // Set up message handler
      ws.on('message', (message) => this.handleMessage(connectionId, userId, message));
      
      // Set up close handler
      ws.on('close', () => {
        this.connectionManager.removeConnection(connectionId);
      });
      
      // Set up error handler
      ws.on('error', (error) => {
        this.logger.error({ error, connectionId, userId }, 'WebSocket error');
        this.connectionManager.removeConnection(connectionId);
      });
      
      // Send welcome message
      this.connectionManager.sendToConnection(connectionId, 'connection', {
        status: 'connected',
        userId,
        connectionId
      });
      
      // Auto-subscribe user to their user channel
      this.connectionManager.subscribeToChannel(connectionId, `${ChannelPrefix.USER}${userId}`);
      
      // Auto-subscribe to token price channel
      this.connectionManager.subscribeToChannel(connectionId, `${ChannelPrefix.TOKEN}price`);
      
      // Auto-subscribe to system announcements
      this.connectionManager.subscribeToChannel(connectionId, `${ChannelPrefix.SYSTEM}announcements`);
      
    } catch (error) {
      this.logger.error({ error }, 'Error handling WebSocket connection');
      this.closeConnection(ws, 1011, 'Server error');
    }
  }
  
  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(connectionId: string, userId: string, message: WebSocket.RawData): Promise<void> {
    try {
      // Check message rate limiting
      const isLimited = await this.rateLimiter.isLimited(userId, 'ws_message');
      if (isLimited) {
        this.connectionManager.sendToConnection(connectionId, 'error', {
          code: 'rate_limited',
          message: 'Message rate limit exceeded'
        });
        return;
      }
      
      // Update connection activity
      this.connectionManager.updateActivity(connectionId);
      
      // Parse message
      let parsedMessage: WSMessage;
      
      try {
        parsedMessage = JSON.parse(message.toString());
      } catch (error) {
        this.connectionManager.sendToConnection(connectionId, 'error', {
          code: 'invalid_json',
          message: 'Invalid JSON in message'
        });
        return;
      }
      
      // Validate message structure
      if (!parsedMessage.action || typeof parsedMessage.action !== 'string') {
        this.connectionManager.sendToConnection(connectionId, 'error', {
          code: 'invalid_message',
          message: 'Missing or invalid action'
        });
        return;
      }
      
      // Handle message based on action
      const handler = this.messageHandlers.get(parsedMessage.action);
      
      if (handler) {
        await handler(connectionId, userId, parsedMessage.data || {});
      } else {
        this.connectionManager.sendToConnection(connectionId, 'error', {
          code: 'unknown_action',
          message: `Unknown action: ${parsedMessage.action}`
        });
      }
      
      // Update metrics
      this.fastify.metrics?.increment('websocket.messages.received');
      this.fastify.metrics?.increment(`websocket.messages.${parsedMessage.action}`);
      
    } catch (error) {
      this.logger.error({ error, connectionId, userId }, 'Error handling WebSocket message');
      
      this.connectionManager.sendToConnection(connectionId, 'error', {
        code: 'server_error',
        message: 'Server error processing message'
      });
    }
  }
  
  /**
   * Close a WebSocket connection
   */
  private closeConnection(ws: WebSocket, code: number, reason: string): void {
    try {
      ws.close(code, reason);
    } catch (error) {
      this.logger.error({ error }, 'Error closing WebSocket connection');
    }
  }
  
  /**
   * Send error message to a connection
   */
  private sendError(connectionId: string, code: string, message: string): void {
    this.connectionManager.sendToConnection(connectionId, 'error', {
      code,
      message
    });
  }
  
  /**
   * Check if a user can access a channel
   */
  private canAccessChannel(userId: string, channel: string): boolean {
    // Everyone can access system and token channels
    if (channel.startsWith(ChannelPrefix.SYSTEM) || 
        channel.startsWith(ChannelPrefix.TOKEN)) {
      return true;
    }
    
    // User can access their own user channel
    if (channel === `${ChannelPrefix.USER}${userId}`) {
      return true;
    }
    
    // Public battle channels are accessible to everyone
    if (channel.startsWith(ChannelPrefix.BATTLE)) {
      // In a real implementation, we might check if battle is public
      // or if user is a participant
      return true;
    }
    
    // Public content channels are accessible to everyone
    if (channel.startsWith(ChannelPrefix.CONTENT)) {
      // In a real implementation, we might check if content is public
      return true;
    }
    
    // Default: deny access
    return false;
  }
  
  /**
   * Perform a health check on all connections
   */
  private performHealthCheck(): void {
    // Close stale connections (idle for more than 5 minutes)
    const closedCount = this.connectionManager.performHealthCheck(5 * 60 * 1000);
    
    // Log results
    if (closedCount > 0) {
      this.logger.info({ closedCount }, 'Closed stale WebSocket connections');
    }
  }
  
  /**
   * Report connection metrics
   */
  private reportMetrics(): void {
    const stats = this.connectionManager.getStats();
    
    this.logger.info({
      connections: stats.totalConnections,
      users: stats.uniqueUsers,
      channels: Object.keys(stats.channelStats).length
    }, 'WebSocket connection metrics');
    
    // Update metrics
    if (this.fastify.metrics) {
      this.fastify.metrics.gauge('websocket.connections.total', stats.totalConnections);
      this.fastify.metrics.gauge('websocket.users.unique', stats.uniqueUsers);
      this.fastify.metrics.gauge('websocket.channels.total', Object.keys(stats.channelStats).length);
      
      // Channel-specific metrics
      for (const [channel, count] of Object.entries(stats.channelStats)) {
        this.fastify.metrics.gauge(
          `websocket.channels.${channel.replace(/[^a-zA-Z0-9]/g, '_')}.subscribers`, 
          count
        );
      }
    }
  }
  
  /**
   * Send a message to a specific user
   */
  sendToUser(userId: string, type: string, data: any): number {
    return this.connectionManager.sendToUser(userId, type, data);
  }
  
  /**
   * Send a message to a specific channel
   */
  sendToChannel(channel: string, type: string, data: any): number {
    return this.connectionManager.sendToChannel(channel, type, data);
  }
  
  /**
   * Broadcast a message to all connected clients
   */
  broadcast(type: string, data: any): number {
    return this.connectionManager.broadcast(type, data);
  }
  
  /**
   * Get WebSocket service statistics
   */
  getStats(): {
    connections: number;
    users: number;
    channels: number;
    channelStats: Record<string, number>;
  } {
    const stats = this.connectionManager.getStats();
    
    return {
      connections: stats.totalConnections,
      users: stats.uniqueUsers,
      channels: Object.keys(stats.channelStats).length,
      channelStats: stats.channelStats
    };
  }
}
