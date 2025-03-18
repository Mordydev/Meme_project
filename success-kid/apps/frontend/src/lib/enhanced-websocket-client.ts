/**
 * Enhanced WebSocket Client
 * 
 * Client for real-time communication with optimized performance,
 * resilient connections, and fallback mechanisms.
 */
import { WebSocketEventType, WebSocketMessage } from '@success-kid/types';
import { realtimeFallback } from './realtime-fallback';

/**
 * Reconnection status
 */
enum ReconnectionStatus {
  /** Not attempting to reconnect */
  NONE = 'none',
  
  /** Actively reconnecting */
  CONNECTING = 'connecting',
  
  /** Backing off before next attempt */
  WAITING = 'waiting',
  
  /** Reached maximum attempts */
  FAILED = 'failed'
}

/**
 * WebSocket connection options
 */
export interface EnhancedWebSocketOptions {
  /** WebSocket URL */
  url?: string;
  
  /** Auto-connect when created */
  autoConnect?: boolean;
  
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  
  /** Initial reconnection delay in ms */
  reconnectDelay?: number;
  
  /** Maximum reconnection delay in ms */
  maxReconnectDelay?: number;
  
  /** Use exponential backoff for reconnection */
  useExponentialBackoff?: boolean;
  
  /** Function to get authentication token */
  getAuthToken?: () => string | null;
  
  /** Enable message batching */
  enableBatching?: boolean;
  
  /** Batch interval in ms */
  batchInterval?: number;
  
  /** Enable polling fallback when WebSockets fail */
  enablePollingFallback?: boolean;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Maximum WebSocket message size in bytes */
  maxMessageSize?: number;
}

/**
 * Default WebSocket options
 */
const DEFAULT_OPTIONS: Required<EnhancedWebSocketOptions> = {
  url: process.env.NEXT_PUBLIC_WS_URL || '/ws',
  autoConnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  useExponentialBackoff: true,
  getAuthToken: () => localStorage.getItem('auth_token'),
  enableBatching: true,
  batchInterval: 50, // 50ms
  enablePollingFallback: true,
  debug: false,
  maxMessageSize: 100 * 1024 // 100KB
};

/**
 * WebSocket event handler function
 */
export type WebSocketEventHandler = (data: any) => void;

/**
 * Connection change handler
 */
export type ConnectionChangeHandler = (connected: boolean, status?: string) => void;

/**
 * Enhanced WebSocket client with optimized performance and resilience
 */
export class EnhancedWebSocketClient {
  private socket: WebSocket | null = null;
  private options: Required<EnhancedWebSocketOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectStatus: ReconnectionStatus = ReconnectionStatus.NONE;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private connectionChangeHandlers: Set<ConnectionChangeHandler> = new Set();
  private connectionId: string | null = null;
  private subscriptions: Set<string> = new Set();
  private messageQueue: WebSocketMessage[] = [];
  private sendTimer: NodeJS.Timeout | null = null;
  private isAuthenticated: boolean = false;
  private userId: string | null = null;
  private lastActivity: number = Date.now();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastMessageId: number = 0;
  
  /**
   * Create a new enhanced WebSocket client
   * @param options WebSocket options
   */
  constructor(options: EnhancedWebSocketOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    if (this.options.autoConnect && typeof window !== 'undefined') {
      // Only auto-connect in browser environment
      this.connect();
    }
  }
  
  /**
   * Connect to the WebSocket server
   * @param userId Optional user ID for reconnection
   */
  connect(userId?: string): void {
    this.userId = userId || this.userId;
    
    // Don't connect if already connected or connecting
    if (this.socket && (
      this.socket.readyState === WebSocket.OPEN || 
      this.socket.readyState === WebSocket.CONNECTING
    )) {
      return;
    }
    
    // Update reconnection status
    this.reconnectStatus = ReconnectionStatus.CONNECTING;
    this.notifyConnectionChange(false, 'connecting');
    
    try {
      // Build the connection URL with query parameters
      let wsUrl = this.options.url;
      const queryParams = new URLSearchParams();
      
      // Add connection ID for reconnection if available
      if (this.connectionId) {
        queryParams.set('connectionId', this.connectionId);
      }
      
      // Add auth token if available
      const token = this.options.getAuthToken();
      if (token) {
        queryParams.set('token', token);
      }
      
      // Append query parameters to URL
      const queryString = queryParams.toString();
      if (queryString) {
        wsUrl += `?${queryString}`;
      }
      
      // Create WebSocket connection
      this.socket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
      this.debugLog('WebSocket connecting...');
    } catch (error) {
      this.debugLog('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Close the WebSocket connection
   */
  close(): void {
    this.stopHeartbeat();
    
    if (this.socket) {
      // Remove event handlers to prevent reconnection
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Clear message queue timer
    if (this.sendTimer) {
      clearTimeout(this.sendTimer);
      this.sendTimer = null;
    }
    
    // Update status
    this.reconnectStatus = ReconnectionStatus.NONE;
    this.notifyConnectionChange(false, 'closed');
    
    this.debugLog('WebSocket closed');
  }
  
  /**
   * Subscribe to a channel
   * @param channel Channel to subscribe to
   */
  subscribe(channel: string): void {
    // Add to local subscriptions set
    this.subscriptions.add(channel);
    
    // If connected, send subscription message
    if (this.isConnected()) {
      this.send({
        type: WebSocketEventType.SUBSCRIBE,
        payload: {
          channels: [channel]
        }
      }, 5); // Higher priority for subscriptions
    }
  }
  
  /**
   * Unsubscribe from a channel
   * @param channel Channel to unsubscribe from
   */
  unsubscribe(channel: string): void {
    // Remove from local subscriptions set
    this.subscriptions.delete(channel);
    
    // If connected, send unsubscription message
    if (this.isConnected()) {
      this.send({
        type: WebSocketEventType.UNSUBSCRIBE,
        payload: {
          channels: [channel]
        }
      });
    }
  }
  
  /**
   * Send a message to the server
   * @param message Message to send
   * @param priority Message priority (0-10, higher = more important)
   * @returns Whether message was queued
   */
  send(message: WebSocketMessage, priority: number = 0): boolean {
    // Add message ID if not present
    const fullMessage = {
      ...message,
      id: message.id || this.generateMessageId()
    };
    
    // Queue the message if batching is enabled
    if (this.options.enableBatching) {
      return this.queueMessage(fullMessage, priority);
    } else {
      // Send immediately otherwise
      return this.sendImmediately(fullMessage);
    }
  }
  
  /**
   * Add event handler for a specific event type
   * @param eventType Event type to listen for
   * @param handler Event handler function
   * @returns Function to remove the handler
   */
  on(eventType: WebSocketEventType | string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);
    
    // Return function to remove the handler
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
    };
  }
  
  /**
   * Add handler for connection state changes
   * @param handler Connection change handler
   * @returns Function to remove the handler
   */
  onConnectionChange(handler: ConnectionChangeHandler): () => void {
    this.connectionChangeHandlers.add(handler);
    
    // Call handler immediately with current state
    handler(this.isConnected(), this.getConnectionStatus());
    
    // Return function to remove the handler
    return () => {
      this.connectionChangeHandlers.delete(handler);
    };
  }
  
  /**
   * Check if WebSocket is connected
   * @returns Whether WebSocket is connected
   */
  isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Check if client is authenticated
   * @returns Whether client is authenticated
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }
  
  /**
   * Get current user ID
   * @returns User ID or null if not authenticated
   */
  getUserId(): string | null {
    return this.userId;
  }
  
  /**
   * Get current connection ID
   * @returns Connection ID or null if not connected
   */
  getConnectionId(): string | null {
    return this.connectionId;
  }
  
  /**
   * Get connection status text
   * @returns Connection status
   */
  getConnectionStatus(): string {
    if (this.isConnected()) {
      return 'connected';
    }
    
    switch (this.reconnectStatus) {
      case ReconnectionStatus.CONNECTING:
        return 'connecting';
      case ReconnectionStatus.WAITING:
        return `reconnecting`;
      case ReconnectionStatus.FAILED:
        return 'reconnection_failed';
      default:
        return 'disconnected';
    }
  }
  
  /**
   * Get information about the connection
   * @returns Connection information
   */
  getConnectionInfo(): {
    connected: boolean;
    status: string;
    connectionId: string | null;
    authenticated: boolean;
    userId: string | null;
    subscriptions: string[];
    reconnectAttempts: number;
    usingFallback: boolean;
  } {
    return {
      connected: this.isConnected(),
      status: this.getConnectionStatus(),
      connectionId: this.connectionId,
      authenticated: this.isAuthenticated,
      userId: this.userId,
      subscriptions: Array.from(this.subscriptions),
      reconnectAttempts: this.reconnectAttempts,
      usingFallback: this.isFallbackActive()
    };
  }
  
  /**
   * Check if we're using the fallback mechanism
   * @returns Whether fallback is active
   */
  isFallbackActive(): boolean {
    return !this.isConnected() && 
      this.options.enablePollingFallback && 
      !!realtimeFallback &&
      realtimeFallback.isActive();
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.debugLog('WebSocket connected');
    
    // Reset reconnect attempts on successful connection
    this.reconnectAttempts = 0;
    this.reconnectStatus = ReconnectionStatus.NONE;
    
    // Start heartbeat to keep connection alive
    this.startHeartbeat();
    
    // Restore subscriptions
    if (this.subscriptions.size > 0) {
      this.send({
        type: WebSocketEventType.SUBSCRIBE,
        payload: {
          channels: Array.from(this.subscriptions)
        }
      }, 10); // High priority for initial subscriptions
    }
    
    // Update connection state
    this.notifyConnectionChange(true, 'connected');
    
    // Stop fallback if it's running
    if (this.options.enablePollingFallback && realtimeFallback?.isActive()) {
      realtimeFallback.stopPolling();
    }
    
    // Flush message queue
    this.flushMessageQueue();
    
    // Notify any registered open handlers
    this.notifyEventHandlers('open', { type: 'open' });
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      // Update last activity time
      this.lastActivity = Date.now();
      
      // Parse message
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Store connection ID for reconnection
      if (message.type === WebSocketEventType.CONNECTED && message.data?.connectionId) {
        this.connectionId = message.data.connectionId;
        this.isAuthenticated = message.data.authenticated || false;
        this.userId = message.data.userId || null;
        
        this.debugLog('Connection established', {
          connectionId: this.connectionId,
          authenticated: this.isAuthenticated
        });
      }
      
      // Handle subscription confirmation
      if (message.type === WebSocketEventType.SUBSCRIBE_CONFIRMATION && message.payload?.channels) {
        const channels = message.payload.channels;
        this.debugLog(`Subscribed to channels: ${channels.join(', ')}`);
      }
      
      // Handle reconnection success
      if (message.type === WebSocketEventType.RECONNECT_SUCCESS) {
        this.debugLog('Reconnection successful', message.data);
      }
      
      // Respond to ping with pong
      if (message.type === WebSocketEventType.PING) {
        this.send({
          type: WebSocketEventType.PONG,
          id: message.id,
          payload: { timestamp: Date.now() }
        });
      }
      
      // Handle batch messages
      if (message.type === WebSocketEventType.BATCH && Array.isArray(message.messages)) {
        // Process each message in the batch
        for (const msg of message.messages) {
          this.processMessage(msg);
        }
      } else {
        // Process single message
        this.processMessage(message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }
  
  /**
   * Process a single message
   * @param message WebSocket message
   */
  private processMessage(message: WebSocketMessage): void {
    try {
      // Skip if no type
      if (!message.type) return;
      
      // Notify handlers for this event type
      this.notifyEventHandlers(message.type, message.data || message.payload);
    } catch (error) {
      console.error('Error processing message:', error, message);
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.stopHeartbeat();
    
    this.debugLog(`WebSocket closed: code=${event.code}, reason=${event.reason || 'none'}`);
    
    this.socket = null;
    
    // Schedule reconnection
    this.scheduleReconnect();
    
    // Update connection state
    this.notifyConnectionChange(false, this.reconnectStatus === ReconnectionStatus.FAILED ? 
      'reconnection_failed' : 'reconnecting');
    
    // Start fallback if enabled
    if (this.options.enablePollingFallback && 
        realtimeFallback && 
        !realtimeFallback.isActive() && 
        this.userId) {
      realtimeFallback.startPolling(this.userId);
      
      // Subscribe to the same channels in the fallback
      this.subscriptions.forEach(channel => {
        realtimeFallback.subscribe(channel, data => {
          this.notifyEventHandlers(data.type, data);
        });
      });
    }
    
    // Notify any registered close handlers
    this.notifyEventHandlers('close', { 
      code: event.code, 
      reason: event.reason,
      wasClean: event.wasClean
    });
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.debugLog('WebSocket error:', event);
    
    // Notify any registered error handlers
    this.notifyEventHandlers('error', { type: 'error', event });
  }
  
  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Check if max reconnect attempts reached
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.debugLog('Maximum reconnection attempts reached');
      
      this.reconnectStatus = ReconnectionStatus.FAILED;
      this.notifyConnectionChange(false, 'reconnection_failed');
      
      // Notify disconnected handlers
      this.notifyEventHandlers('maxReconnectAttemptsReached', {
        attempts: this.reconnectAttempts
      });
      
      return;
    }
    
    this.reconnectStatus = ReconnectionStatus.WAITING;
    
    // Calculate reconnect delay with exponential backoff and jitter
    let delay = this.options.reconnectDelay;
    
    if (this.options.useExponentialBackoff && this.reconnectAttempts > 0) {
      delay = Math.min(
        delay * Math.pow(1.5, this.reconnectAttempts),
        this.options.maxReconnectDelay
      );
    }
    
    // Add jitter to prevent all clients reconnecting simultaneously
    const jitter = 0.5 + Math.random();
    delay = Math.floor(delay * jitter);
    
    this.debugLog(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1} of ${this.options.maxReconnectAttempts})`);
    
    // Schedule reconnection
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    // Send ping every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        // Check for inactivity
        const inactiveTime = Date.now() - this.lastActivity;
        
        // If inactive for more than 70 seconds (default WS timeout is 60s)
        if (inactiveTime > 70000) {
          this.debugLog('Connection seems inactive, reconnecting...');
          this.reconnect();
          return;
        }
        
        this.send({
          type: WebSocketEventType.PING,
          payload: { timestamp: Date.now() }
        });
      }
    }, 30000);
  }
  
  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Force reconnection
   */
  private reconnect(): void {
    if (this.socket) {
      // Close current connection without reconnect
      const oldSocket = this.socket;
      this.socket = null;
      
      // Remove handlers to prevent reconnection
      oldSocket.onclose = null;
      oldSocket.close();
    }
    
    // Connect again
    this.connect();
  }
  
  /**
   * Queue a message for batched sending
   * @param message Message to queue
   * @param priority Message priority
   * @returns Whether message was queued
   */
  private queueMessage(message: WebSocketMessage, priority: number = 0): boolean {
    // Skip queueing if message exceeds size limit
    const messageSize = JSON.stringify(message).length;
    if (messageSize > this.options.maxMessageSize) {
      console.error(`Message exceeds size limit (${messageSize} > ${this.options.maxMessageSize} bytes)`);
      return false;
    }
    
    // Add priority as metadata
    this.messageQueue.push({
      ...message,
      _priority: priority
    });
    
    // Schedule processing if not already scheduled
    if (!this.sendTimer) {
      this.sendTimer = setTimeout(() => this.flushMessageQueue(), this.options.batchInterval);
    }
    
    return true;
  }
  
  /**
   * Send all queued messages
   * @returns Number of messages sent
   */
  private flushMessageQueue(): number {
    // Clear timer
    if (this.sendTimer) {
      clearTimeout(this.sendTimer);
      this.sendTimer = null;
    }
    
    // Skip if queue is empty or not connected
    if (this.messageQueue.length === 0 || !this.isConnected()) {
      return 0;
    }
    
    try {
      const messages = [...this.messageQueue];
      this.messageQueue = [];
      
      // Sort by priority if any have priority set
      if (messages.some(m => m._priority !== undefined)) {
        messages.sort((a, b) => (b._priority || 0) - (a._priority || 0));
      }
      
      // If only one message, send directly
      if (messages.length === 1) {
        const message = messages[0];
        // Remove priority metadata
        delete message._priority;
        
        // Send the message
        this.sendImmediately(message);
        return 1;
      }
      
      // Otherwise, send as a batch
      const batch = {
        type: WebSocketEventType.BATCH,
        id: this.generateMessageId(),
        messages: messages.map(m => {
          // Remove priority metadata
          const { _priority, ...cleanMessage } = m;
          return cleanMessage;
        }),
        timestamp: Date.now()
      };
      
      // Send the batch
      this.sendImmediately(batch);
      return messages.length;
    } catch (error) {
      console.error('Error flushing message queue:', error);
      return 0;
    }
  }
  
  /**
   * Send a message immediately
   * @param message Message to send
   * @returns Whether message was sent
   */
  private sendImmediately(message: any): boolean {
    if (!this.isConnected()) {
      // Queue for later if not connected
      this.debugLog('Queueing message for when connection is restored', message.type || message);
      
      // If fallback is active, try to send through fallback
      if (this.options.enablePollingFallback && realtimeFallback?.isActive()) {
        realtimeFallback.queueEvent(message);
      }
      
      return false;
    }
    
    try {
      this.socket!.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }
  
  /**
   * Notify event handlers for a specific event type
   * @param eventType Event type
   * @param data Event data
   */
  private notifyEventHandlers(eventType: string, data: any): void {
    // Notify specific event handlers
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${eventType}:`, error);
        }
      });
    }
    
    // Notify wildcard handlers that receive all events
    const wildcardHandlers = this.eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler({ type: eventType, data });
        } catch (error) {
          console.error(`Error in WebSocket wildcard handler for ${eventType}:`, error);
        }
      });
    }
  }
  
  /**
   * Notify connection change handlers
   * @param connected Whether socket is connected
   * @param status Connection status text
   */
  private notifyConnectionChange(connected: boolean, status: string = ''): void {
    this.connectionChangeHandlers.forEach(handler => {
      try {
        handler(connected, status);
      } catch (error) {
        console.error('Error in connection change handler:', error);
      }
    });
  }
  
  /**
   * Generate a unique message ID
   * @returns Unique message ID
   */
  private generateMessageId(): string {
    this.lastMessageId++;
    return `${Date.now()}-${this.lastMessageId}-${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Log debug message if debug is enabled
   * @param message Debug message
   * @param args Additional arguments
   */
  private debugLog(message: string, ...args: any[]): void {
    if (this.options.debug) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }
}

// Create and export singleton instance
export const enhancedWebSocketClient = typeof window !== 'undefined' 
  ? new EnhancedWebSocketClient() 
  : null;
