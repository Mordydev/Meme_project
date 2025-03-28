/**
 * WebSocket client for real-time communication with the server
 */
import { v4 as uuid } from 'uuid';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  type: string;
  payload?: any;
  meta?: {
    timestamp?: string;
    seq?: number;
    [key: string]: any;
  };
}

export type MessageHandler = (message: WebSocketMessage) => void;

/**
 * Connection state enum
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  PERMANENTLY_DISCONNECTED = 'permanently_disconnected' // After all retry attempts
}

/**
 * WebSocket connection event interface
 */
export interface ConnectionEvent {
  state: ConnectionState;
  timestamp: number;
  connectionId?: string;
  error?: Error;
  reconnectAttempt?: number;
}

/**
 * WebSocket client configuration
 */
export interface WebSocketClientConfig {
  url: string;
  reconnect: boolean;
  maxReconnectAttempts: number;
  initialReconnectDelay: number;
  maxReconnectDelay: number;
  reconnectBackoffMultiplier: number;
  connectionTimeout: number;
  heartbeatInterval: number;
  debug: boolean;
  autoConnect: boolean;
  fallbackEnabled: boolean;
  fallbackInterval: number;
  getAuthToken?: () => string | null;
  refreshAuthToken?: () => Promise<string | null>;
}

/**
 * Default WebSocket client configuration
 */
const DEFAULT_CONFIG: WebSocketClientConfig = {
  url: '/ws',
  reconnect: true,
  maxReconnectAttempts: 10,
  initialReconnectDelay: 1000, // 1 second
  maxReconnectDelay: 30000, // 30 seconds
  reconnectBackoffMultiplier: 1.5,
  connectionTimeout: 10000, // 10 seconds
  heartbeatInterval: 30000, // 30 seconds
  debug: false,
  autoConnect: true,
  fallbackEnabled: true,
  fallbackInterval: 10000, // 10 seconds
};

/**
 * WebSocket client class for handling real-time communication
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private connectionTimeoutTimer: number | null = null;
  private heartbeatInterval: number | null = null;
  private fallbackPollInterval: number | null = null;
  private lastMessageTime = 0;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<(event: ConnectionEvent) => void> = new Set();
  private connectionId: string | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private pingInProgress = false;
  private pingStartTime = 0;
  private lastPingLatency = 0;
  private pendingMessages: WebSocketMessage[] = [];
  private processedMessageIds = new Set<string>();
  private lastPollTime = 0;

  /**
   * Create a new WebSocket client
   * @param config WebSocket client configuration
   */
  constructor(config: Partial<WebSocketClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Generate a connection ID
    this.connectionId = uuid();
    
    // Only set up event listeners and auto-connect in browser environment
    if (isBrowser) {
      // Connect automatically if configured
      if (this.config.autoConnect) {
        this.connect();
      }
      
      // Initialize event listeners for offline/online events
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      window.addEventListener('beforeunload', this.handleBeforeUnload);
      window.addEventListener('focus', this.handleWindowFocus);
      
      // Initialize visibility change listener
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
  
  /**
   * Connect to the WebSocket server
   * @param token Authentication token
   */
  connect(token?: string): void {
    // Only attempt connection in browser environment
    if (!isBrowser) return;
    
    this.log('Attempting to connect to WebSocket server');
    
    // Clear any existing reconnect timer
    this.clearReconnectTimer();
    
    // Clear the connection timeout
    this.clearConnectionTimeout();
    
    // Set connection state
    this.updateConnectionState(ConnectionState.CONNECTING);
    
    try {
      // Get token from function if provided
      if (!token && this.config.getAuthToken) {
        token = this.config.getAuthToken();
      }
      
      // Build URL with connection ID and token
      let wsUrl = this.config.url;
      const params = new URLSearchParams();
      
      if (this.connectionId) {
        params.append('connectionId', this.connectionId);
      }
      
      if (token) {
        params.append('token', token);
      }
      
      if (this.reconnectAttempts > 0) {
        params.append('reconnect', 'true');
      }
      
      // Add parameters to URL
      const separator = wsUrl.includes('?') ? '&' : '?';
      wsUrl = `${wsUrl}${separator}${params.toString()}`;
      
      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.ws.onopen = this.handleOpen;
      this.ws.onclose = this.handleClose;
      this.ws.onmessage = this.handleMessage;
      this.ws.onerror = this.handleError;
      
      // Set connection timeout
      this.setConnectionTimeout();
      
      this.log('WebSocket connecting...', wsUrl);
    } catch (error) {
      this.log('Error creating WebSocket connection', error);
      this.handleConnectionError(error);
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    // Only disconnect in browser environment
    if (!isBrowser) return;
    
    this.log('Disconnecting from WebSocket server');
    
    // Clear timers
    this.clearReconnectTimer();
    this.clearConnectionTimeout();
    this.clearHeartbeat();
    this.clearFallbackPolling();
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
    
    // Update state
    this.updateConnectionState(ConnectionState.DISCONNECTED);
  }
  
  /**
   * Send a message to the server
   * @param message Message to send
   * @returns True if sent successfully
   */
  send(message: WebSocketMessage): boolean {
    // Can't send if not in browser environment
    if (!isBrowser) return false;
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        // Add timestamp if not present
        if (!message.meta) {
          message.meta = {};
        }
        if (!message.meta.timestamp) {
          message.meta.timestamp = new Date().toISOString();
        }
        
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        this.log('Error sending WebSocket message', error);
        return false;
      }
    } else {
      // Queue message if WebSocket not ready
      this.log('WebSocket not connected. Queueing message:', message);
      this.queueMessage(message);
      
      // If permanently disconnected but fallback is enabled, send via fallback
      if (this.connectionState === ConnectionState.PERMANENTLY_DISCONNECTED && this.config.fallbackEnabled) {
        this.sendViaFallback(message);
      }
      
      return false;
    }
  }
  
  /**
   * Subscribe to a specific message type
   * @param type Message type to subscribe to
   * @param handler Handler function
   * @returns Unsubscribe function
   */
  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }
  
  /**
   * Subscribe to connection status changes
   * @param handler Handler function
   * @returns Unsubscribe function
   */
  onConnectionChange(handler: (event: ConnectionEvent) => void): () => void {
    this.connectionHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }
  
  /**
   * Get current connection state
   * @returns Connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Check if WebSocket is connected
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }
  
  /**
   * Get connection ID
   * @returns Connection ID
   */
  getConnectionId(): string | null {
    return this.connectionId;
  }
  
  /**
   * Get last ping latency
   * @returns Latency in milliseconds
   */
  getLatency(): number {
    return this.lastPingLatency;
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen = (): void => {
    this.log('WebSocket connected');
    
    // Clear the connection timeout
    this.clearConnectionTimeout();
    
    // Reset reconnect attempts
    this.reconnectAttempts = 0;
    
    // Update state
    this.updateConnectionState(ConnectionState.CONNECTED);
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Cancel fallback polling if running
    this.clearFallbackPolling();
    
    // Send any queued messages
    this.sendQueuedMessages();
    
    // Subscribe to channels
    this.sendSubscriptions();
  };
  
  /**
   * Handle WebSocket close event
   * @param event Close event
   */
  private handleClose = (event: CloseEvent): void => {
    this.log(`WebSocket closed: code=${event.code}, reason=${event.reason || 'No reason provided'}`);
    
    // Stop heartbeat
    this.clearHeartbeat();
    
    // Update state
    if (this.connectionState !== ConnectionState.PERMANENTLY_DISCONNECTED) {
      this.updateConnectionState(ConnectionState.DISCONNECTED);
    }
    
    // Attempt reconnection if not closed normally and reconnection is enabled
    if (event.code !== 1000 && this.config.reconnect) {
      this.attemptReconnect();
    } else if (event.code === 1000) {
      // Normal closure, no reconnection needed
      this.clearReconnectTimer();
    }
  };
  
  /**
   * Handle WebSocket message event
   * @param event Message event
   */
  private handleMessage = (event: MessageEvent): void => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Update last message time
      this.lastMessageTime = Date.now();
      
      // Handle ping/pong for heartbeat
      if (message.type === 'pong') {
        this.handlePongResponse();
        return;
      }
      
      // Handle batch messages
      if (message.type === 'batch' && Array.isArray(message.payload)) {
        for (const batchedMessage of message.payload) {
          this.processIncomingMessage({
            type: batchedMessage.type,
            payload: batchedMessage.payload,
            meta: { timestamp: batchedMessage.timestamp }
          });
        }
        return;
      }
      
      // Handle token refresh requests
      if (message.type === 'auth.refresh' && this.config.refreshAuthToken) {
        this.handleTokenRefresh();
        return;
      }
      
      // Process normal message
      this.processIncomingMessage(message);
    } catch (error) {
      this.log('Error parsing WebSocket message', error);
    }
  };
  
  /**
   * Process an incoming message
   * @param message WebSocket message
   */
  private processIncomingMessage(message: WebSocketMessage): void {
    // Skip duplicates if we have a sequence number
    if (message.meta?.seq) {
      const messageId = `${message.type}_${message.meta.seq}`;
      if (this.processedMessageIds.has(messageId)) {
        return;
      }
      this.processedMessageIds.add(messageId);
      
      // Limit size of processed message IDs set
      if (this.processedMessageIds.size > 1000) {
        // Remove oldest entries (arbitrary cleanup)
        const iterator = this.processedMessageIds.values();
        for (let i = 0; i < 200; i++) {
          iterator.next();
          this.processedMessageIds.delete(iterator.value);
        }
      }
    }
    
    // Notify handlers for this message type
    const typeHandlers = this.messageHandlers.get(message.type);
    if (typeHandlers) {
      typeHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          this.log('Error in message handler', error);
        }
      });
    }
    
    // Notify handlers for all messages
    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          this.log('Error in message handler', error);
        }
      });
    }
  }
  
  /**
   * Handle WebSocket error event
   * @param event Error event
   */
  private handleError = (event: Event): void => {
    this.log('WebSocket error', event);
    this.handleConnectionError(new Error('WebSocket error occurred'));
  };
  
  /**
   * Handle connection error
   * @param error Error
   */
  private handleConnectionError(error: Error): void {
    // Update state
    this.updateConnectionState(ConnectionState.ERROR, { error });
    
    // Attempt reconnection if enabled
    if (this.config.reconnect) {
      this.attemptReconnect();
    }
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    // Can't reconnect if not in browser environment
    if (!isBrowser) return;
    
    // Check if max attempts reached
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log(`Maximum reconnect attempts (${this.config.maxReconnectAttempts}) reached.`);
      this.updateConnectionState(ConnectionState.PERMANENTLY_DISCONNECTED);
      
      // Start fallback polling if enabled
      if (this.config.fallbackEnabled) {
        this.startFallbackPolling();
      }
      
      return;
    }
    
    // Clear any existing reconnect timer
    this.clearReconnectTimer();
    
    // Increment reconnect attempts
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff and jitter
    const baseDelay = Math.min(
      this.config.initialReconnectDelay * Math.pow(this.config.reconnectBackoffMultiplier, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );
    const jitter = 0.5 + Math.random(); // Random factor between 0.5-1.5
    const delay = baseDelay * jitter;
    
    this.log(`Reconnecting in ${Math.round(delay)}ms... (Attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    // Update state
    this.updateConnectionState(ConnectionState.RECONNECTING, { reconnectAttempt: this.reconnectAttempts });
    
    // Set reconnect timer
    if (isBrowser) {
      this.reconnectTimer = window.setTimeout(() => {
        this.connect();
      }, delay);
    }
  }
  
  /**
   * Set connection timeout
   */
  private setConnectionTimeout(): void {
    // Can't set timeout if not in browser environment
    if (!isBrowser) return;
    
    // Clear any existing timeout
    this.clearConnectionTimeout();
    
    // Set new timeout
    this.connectionTimeoutTimer = window.setTimeout(() => {
      if (this.connectionState === ConnectionState.CONNECTING) {
        this.log('WebSocket connection timeout');
        
        // Close socket if it exists
        if (this.ws) {
          this.ws.close(1000, 'Connection timeout');
          this.ws = null;
        }
        
        // Handle as connection error
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, this.config.connectionTimeout);
  }
  
  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (!isBrowser) return;
    
    if (this.connectionTimeoutTimer !== null) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }
  
  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (!isBrowser) return;
    
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (!isBrowser) return;
    
    // Clear any existing interval
    this.clearHeartbeat();
    
    // Start new interval
    this.heartbeatInterval = window.setInterval(() => {
      this.sendPing();
    }, this.config.heartbeatInterval);
    
    // Send initial ping
    this.sendPing();
  }
  
  /**
   * Clear heartbeat interval
   */
  private clearHeartbeat(): void {
    if (!isBrowser) return;
    
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Send ping to server
   */
  private sendPing(): void {
    if (!isBrowser) return;
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Skip if another ping is in progress
    if (this.pingInProgress) {
      return;
    }
    
    try {
      this.pingInProgress = true;
      this.pingStartTime = Date.now();
      
      this.ws.send(JSON.stringify({ 
        type: 'ping',
        meta: { timestamp: new Date().toISOString() }
      }));
    } catch (error) {
      this.log('Error sending ping', error);
      this.pingInProgress = false;
    }
  }
  
  /**
   * Handle pong response from server
   */
  private handlePongResponse(): void {
    const now = Date.now();
    this.lastPingLatency = now - this.pingStartTime;
    this.log(`Received pong response (${this.lastPingLatency}ms)`);
    this.pingInProgress = false;
  }
  
  /**
   * Update connection state
   * @param state New connection state
   * @param extraData Extra data to include in event
   */
  private updateConnectionState(state: ConnectionState, extraData: Record<string, any> = {}): void {
    this.connectionState = state;
    
    // Create event
    const event: ConnectionEvent = {
      state,
      timestamp: Date.now(),
      connectionId: this.connectionId || undefined,
      ...extraData
    };
    
    // Notify handlers
    this.connectionHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        this.log('Error in connection handler', error);
      }
    });
  }
  
  /**
   * Queue a message to be sent when connection is established
   * @param message Message to queue
   */
  private queueMessage(message: WebSocketMessage): void {
    // Don't queue ping messages
    if (message.type === 'ping') {
      return;
    }
    
    // Add to queue
    this.pendingMessages.push(message);
    
    // Limit queue size
    if (this.pendingMessages.length > 100) {
      this.pendingMessages.shift();
    }
  }
  
  /**
   * Send queued messages
   */
  private sendQueuedMessages(): void {
    if (this.pendingMessages.length === 0) {
      return;
    }
    
    this.log(`Sending ${this.pendingMessages.length} queued messages`);
    
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];
    
    for (const message of messages) {
      this.send(message);
    }
  }
  
  /**
   * Send subscriptions to server
   */
  private sendSubscriptions(): void {
    // Get all message types being subscribed to
    const types = Array.from(this.messageHandlers.keys())
      .filter(type => type !== '*' && !type.startsWith('!'));
    
    if (types.length === 0) {
      return;
    }
    
    // Send subscription message
    this.send({
      type: 'subscribe',
      payload: {
        channels: types
      }
    });
  }
  
  /**
   * Handle window online event
   */
  private handleOnline = (): void => {
    this.log('Browser online event detected');
    
    // Try to reconnect if disconnected
    if (
      this.connectionState === ConnectionState.DISCONNECTED ||
      this.connectionState === ConnectionState.ERROR
    ) {
      this.reconnectAttempts = 0; // Reset attempts on network recovery
      this.connect();
    }
  };
  
  /**
   * Handle window offline event
   */
  private handleOffline = (): void => {
    this.log('Browser offline event detected');
    
    // Close connection if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Browser offline');
      this.ws = null;
    }
    
    // Update state
    this.updateConnectionState(ConnectionState.DISCONNECTED);
  };
  
  /**
   * Handle window focus event
   */
  private handleWindowFocus = (): void => {
    // Check if we need to reconnect
    if (
      this.connectionState !== ConnectionState.CONNECTED &&
      this.connectionState !== ConnectionState.CONNECTING &&
      this.connectionState !== ConnectionState.RECONNECTING
    ) {
      this.log('Window focus event - checking connection');
      
      // Reconnect with fresh attempt counter
      this.reconnectAttempts = 0;
      this.connect();
    }
  };
  
  /**
   * Handle visibility change event
   */
  private handleVisibilityChange = (): void => {
    if (!isBrowser) return;
    
    if (document.visibilityState === 'visible') {
      // Check connection status when becoming visible
      const timeSinceLastMessage = Date.now() - this.lastMessageTime;
      
      // If it's been more than heartbeat interval since last message, check connection
      if (
        timeSinceLastMessage > this.config.heartbeatInterval &&
        this.connectionState === ConnectionState.CONNECTED
      ) {
        this.log('Visibility changed to visible - checking connection');
        this.sendPing();
      }
    }
  };
  
  /**
   * Handle beforeunload event
   */
  private handleBeforeUnload = (): void => {
    // Close connection cleanly
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Page unloading');
    }
  };
  
  /**
   * Handle token refresh request
   */
  private async handleTokenRefresh(): Promise<void> {
    if (!this.config.refreshAuthToken) {
      return;
    }
    
    try {
      const newToken = await this.config.refreshAuthToken();
      
      if (newToken) {
        this.log('Reconnecting with refreshed token');
        
        // Reconnect with new token
        this.reconnectAttempts = 0; // Reset attempts for token refresh
        this.connect(newToken);
      }
    } catch (error) {
      this.log('Error refreshing token', error);
    }
  }
  
  /**
   * Start fallback polling for messages when WebSocket is unavailable
   */
  private startFallbackPolling(): void {
    if (!isBrowser) return;
    
    if (!this.config.fallbackEnabled || this.fallbackPollInterval !== null) {
      return;
    }
    
    this.log('Starting fallback polling');
    
    this.fallbackPollInterval = window.setInterval(() => {
      this.pollForMessages();
    }, this.config.fallbackInterval);
    
    // Poll immediately
    this.pollForMessages();
  }
  
  /**
   * Clear fallback polling interval
   */
  private clearFallbackPolling(): void {
    if (!isBrowser) return;
    
    if (this.fallbackPollInterval !== null) {
      clearInterval(this.fallbackPollInterval);
      this.fallbackPollInterval = null;
    }
  }
  
  /**
   * Poll for messages using HTTP fallback
   */
  private async pollForMessages(): Promise<void> {
    if (!isBrowser) return;
    
    if (Date.now() - this.lastPollTime < 1000) {
      return; // Prevent too frequent polling
    }
    
    this.lastPollTime = Date.now();
    
    try {
      // Get auth token if available
      const token = this.config.getAuthToken?.() || null;
      
      if (!token) {
        return; // Can't poll without authentication
      }
      
      // Prepare request
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make request
      const response = await fetch('/api/v1/ws-fallback/poll?since=' + (this.lastMessageTime || 0), {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Fallback polling failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process messages
      if (data.data && Array.isArray(data.data)) {
        for (const message of data.data) {
          this.processIncomingMessage({
            type: message.type,
            payload: message.payload,
            meta: { timestamp: message.timestamp }
          });
        }
      }
      
      // Update connection status if provided
      if (data.meta?.connectionStatus === 'connected' && this.connectionState !== ConnectionState.CONNECTED) {
        // WebSocket is actually connected according to server, reconnect
        this.reconnectAttempts = 0;
        this.connect();
      }
    } catch (error) {
      this.log('Error polling for messages', error);
    }
  }
  
  /**
   * Send a message via HTTP fallback
   * @param message Message to send
   */
  private async sendViaFallback(message: WebSocketMessage): Promise<void> {
    if (!isBrowser) return;
    
    try {
      // Get auth token if available
      const token = this.config.getAuthToken?.() || null;
      
      if (!token) {
        return; // Can't send without authentication
      }
      
      // Prepare request
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make request
      const response = await fetch('/api/v1/ws-fallback/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: message.type,
          payload: message.payload
        })
      });
      
      if (!response.ok) {
        throw new Error(`Fallback send failed: ${response.status}`);
      }
    } catch (error) {
      this.log('Error sending message via fallback', error);
    }
  }
  
  /**
   * Log a message to console if debug is enabled
   * @param message Message
   * @param data Additional data
   */
  private log(message: string, ...data: any[]): void {
    if (this.config.debug) {
      console.log(`[WebSocketClient] ${message}`, ...data);
    }
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (!isBrowser) return;
    
    this.log('Destroying WebSocket client');
    
    // Disconnect WebSocket
    this.disconnect();
    
    // Remove event listeners
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('focus', this.handleWindowFocus);
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Clear all handlers
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
  }
}

/**
 * Create WebSocket URL from current location
 * @returns WebSocket URL
 */
function createWebSocketUrl(): string {
  if (!isBrowser) {
    return '/ws'; // Default for SSR
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  
  return `${protocol}//${host}/ws`;
}

// Create and export singleton instance with environment-aware URL
export const websocketClient = new WebSocketClient({
  url: isBrowser && process.env.NEXT_PUBLIC_WS_URL ? process.env.NEXT_PUBLIC_WS_URL : createWebSocketUrl(),
  debug: process.env.NODE_ENV === 'development'
});