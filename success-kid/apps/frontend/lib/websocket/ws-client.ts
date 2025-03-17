/**
 * WebSocket Client
 * 
 * Robust client-side WebSocket implementation with reconnection
 * strategies, state management, and message handling
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  type: string;
  payload?: any;
  id?: string;
  timestamp?: number;
}

/**
 * WebSocket connection options
 */
export interface WebSocketOptions {
  /**
   * Authentication token
   */
  token?: string;
  
  /**
   * Reconnection strategy options
   */
  reconnect?: {
    /**
     * Enable automatic reconnection
     * Default: true
     */
    enabled?: boolean;
    
    /**
     * Maximum reconnection attempts
     * Default: 10
     */
    maxAttempts?: number;
    
    /**
     * Initial delay in milliseconds
     * Default: 1000
     */
    initialDelay?: number;
    
    /**
     * Maximum delay in milliseconds
     * Default: 30000
     */
    maxDelay?: number;
    
    /**
     * Backoff factor for exponential backoff
     * Default: 1.5
     */
    factor?: number;
    
    /**
     * Add random jitter to delay (0-1)
     * Default: 0.2 (±20%)
     */
    jitter?: number;
    
    /**
     * Reconnect on browser focus/visibility
     * Default: true
     */
    onFocus?: boolean;
    
    /**
     * Reconnect on network reconnection
     * Default: true
     */
    onNetworkReconnect?: boolean;
  };
  
  /**
   * Automatic subscription recovery
   * Default: true
   */
  autoRecover?: boolean;
  
  /**
   * Logging options
   */
  logging?: {
    /**
     * Enable logging
     * Default: true
     */
    enabled?: boolean;
    
    /**
     * Log level
     * Default: 'warn'
     */
    level?: 'debug' | 'info' | 'warn' | 'error';
  };
  
  /**
   * Heartbeat options
   */
  heartbeat?: {
    /**
     * Enable heartbeat checks
     * Default: true
     */
    enabled?: boolean;
    
    /**
     * Interval in milliseconds
     * Default: 30000 (30 seconds)
     */
    interval?: number;
    
    /**
     * Timeout in milliseconds
     * Default: 10000 (10 seconds)
     */
    timeout?: number;
  };
}

/**
 * WebSocket connection state
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * WebSocket client event types
 */
export type WebSocketEventType = 
  | 'open' 
  | 'close' 
  | 'error' 
  | 'message' 
  | 'reconnect' 
  | 'reconnect_attempt' 
  | 'reconnect_failed' 
  | 'state_change';

/**
 * WebSocket client event handler
 */
export type WebSocketEventHandler = (data?: any) => void;

/**
 * WebSocket client message handler
 */
export type WebSocketMessageHandler = (message: any) => void;

/**
 * Default WebSocket options
 */
const DEFAULT_OPTIONS: Required<WebSocketOptions> = {
  token: '',
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 1.5,
    jitter: 0.2,
    onFocus: true,
    onNetworkReconnect: true
  },
  autoRecover: true,
  logging: {
    enabled: true,
    level: 'warn'
  },
  heartbeat: {
    enabled: true,
    interval: 30000,
    timeout: 10000
  }
};

/**
 * Enhanced WebSocket client with reconnection strategies
 * and state management
 */
export class WebSocketClient {
  /**
   * WebSocket URL
   */
  private url: string;
  
  /**
   * WebSocket instance
   */
  private ws: WebSocket | null = null;
  
  /**
   * WebSocket options
   */
  private options: Required<WebSocketOptions>;
  
  /**
   * Connection state
   */
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  
  /**
   * Connection ID for reconnection
   */
  private connectionId: string | null = null;
  
  /**
   * Reconnection attempt counter
   */
  private reconnectAttempts = 0;
  
  /**
   * Reconnection timer handle
   */
  private reconnectTimer: number | null = null;
  
  /**
   * Heartbeat timer handle
   */
  private heartbeatTimer: number | null = null;
  
  /**
   * Heartbeat timeout handle
   */
  private heartbeatTimeout: number | null = null;
  
  /**
   * Event listeners
   */
  private listeners: Record<WebSocketEventType, Set<WebSocketEventHandler>> = {
    open: new Set(),
    close: new Set(),
    error: new Set(),
    message: new Set(),
    reconnect: new Set(),
    reconnect_attempt: new Set(),
    reconnect_failed: new Set(),
    state_change: new Set()
  };
  
  /**
   * Message type handlers
   */
  private messageHandlers: Record<string, Set<WebSocketMessageHandler>> = {};
  
  /**
   * Active subscriptions
   */
  private subscriptions: Set<string> = new Set();
  
  /**
   * Pending messages while disconnected
   */
  private messageQueue: WebSocketMessage[] = [];
  
  /**
   * Create WebSocket client
   * @param url WebSocket URL
   * @param options Connection options
   */
  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    
    // Merge options with defaults
    this.options = this.mergeOptions(options);
    
    // Register window events for reconnection
    if (typeof window !== 'undefined') {
      if (this.options.reconnect.onFocus) {
        window.addEventListener('focus', this.handleWindowFocus);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
      }
      
      if (this.options.reconnect.onNetworkReconnect) {
        window.addEventListener('online', this.handleNetworkReconnect);
      }
    }
    
    this.log('info', 'WebSocket client created', { url, options: this.options });
  }
  
  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    // If already connected, do nothing
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.log('info', 'Already connected');
      return;
    }
    
    // Update state
    this.updateState(ConnectionState.CONNECTING);
    
    // Build connection URL with parameters
    const connectionUrl = this.buildConnectionUrl();
    
    // Create WebSocket
    try {
      this.ws = new WebSocket(connectionUrl);
      
      // Setup event handlers
      this.ws.onopen = this.handleOpen;
      this.ws.onclose = this.handleClose;
      this.ws.onerror = this.handleError;
      this.ws.onmessage = this.handleMessage;
      
      this.log('info', 'Connecting to WebSocket', { url: connectionUrl });
    } catch (error) {
      this.log('error', 'Failed to create WebSocket', { error, url: connectionUrl });
      this.updateState(ConnectionState.ERROR);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   * @param code Close code
   * @param reason Close reason
   */
  disconnect(code: number = 1000, reason: string = 'Normal closure'): void {
    // Cancel any reconnection attempt
    this.cancelReconnect();
    
    // Clear heartbeat
    this.clearHeartbeat();
    
    // Close WebSocket if it exists
    if (this.ws) {
      try {
        // Only try to close if socket is open or connecting
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close(code, reason);
        }
      } catch (error) {
        this.log('error', 'Error closing WebSocket', { error });
      }
      
      this.ws = null;
    }
    
    // Update state
    this.updateState(ConnectionState.DISCONNECTED);
    
    this.log('info', 'Disconnected from WebSocket', { code, reason });
  }
  
  /**
   * Reconnect to the WebSocket server
   */
  reconnect(): void {
    this.log('info', 'Manually reconnecting');
    
    // Disconnect first
    this.disconnect(1000, 'Manual reconnection');
    
    // Reset reconnection attempts
    this.reconnectAttempts = 0;
    
    // Connect again
    this.connect();
  }
  
  /**
   * Send a message to the WebSocket server
   * @param type Message type
   * @param payload Message payload
   * @param options Send options
   * @returns Message ID
   */
  send(
    type: string, 
    payload?: any, 
    options?: { 
      id?: string;
      queueIfDisconnected?: boolean;
    }
  ): string {
    const id = options?.id || uuidv4();
    
    // Create message
    const message: WebSocketMessage = {
      type,
      payload,
      id,
      timestamp: Date.now()
    };
    
    // Check if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.log('debug', 'Message sent', { type, id });
      } catch (error) {
        this.log('error', 'Error sending message', { error, message });
        
        // Queue message if requested
        if (options?.queueIfDisconnected !== false) {
          this.queueMessage(message);
        }
      }
    } else {
      this.log('info', 'WebSocket not connected, cannot send message', { type, id });
      
      // Queue message if requested
      if (options?.queueIfDisconnected !== false) {
        this.queueMessage(message);
      }
    }
    
    return id;
  }
  
  /**
   * Subscribe to a channel
   * @param channel Channel name
   * @returns Success flag
   */
  subscribe(channel: string): boolean {
    // Check if already subscribed
    if (this.subscriptions.has(channel)) {
      return true;
    }
    
    // Add to subscriptions
    this.subscriptions.add(channel);
    
    // If connected, send subscribe message
    if (this.isConnected()) {
      this.send('subscribe', { channels: [channel] });
      this.log('debug', 'Subscribed to channel', { channel });
      return true;
    } else {
      this.log('info', 'WebSocket not connected, channel will be subscribed on reconnect', { channel });
      return false;
    }
  }
  
  /**
   * Unsubscribe from a channel
   * @param channel Channel name
   * @returns Success flag
   */
  unsubscribe(channel: string): boolean {
    // Check if subscribed
    if (!this.subscriptions.has(channel)) {
      return false;
    }
    
    // Remove from subscriptions
    this.subscriptions.delete(channel);
    
    // If connected, send unsubscribe message
    if (this.isConnected()) {
      this.send('unsubscribe', { channels: [channel] });
      this.log('debug', 'Unsubscribed from channel', { channel });
      return true;
    }
    
    return false;
  }
  
  /**
   * Get active subscriptions
   * @returns Array of channel names
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
  
  /**
   * Add event listener
   * @param event Event type
   * @param handler Event handler
   * @returns This instance for chaining
   */
  on(event: WebSocketEventType, handler: WebSocketEventHandler): this {
    if (this.listeners[event]) {
      this.listeners[event].add(handler);
    }
    return this;
  }
  
  /**
   * Remove event listener
   * @param event Event type
   * @param handler Event handler
   * @returns This instance for chaining
   */
  off(event: WebSocketEventType, handler: WebSocketEventHandler): this {
    if (this.listeners[event]) {
      this.listeners[event].delete(handler);
    }
    return this;
  }
  
  /**
   * Add message type handler
   * @param messageType Message type to handle
   * @param handler Message handler
   * @returns This instance for chaining
   */
  onMessage(messageType: string, handler: WebSocketMessageHandler): this {
    if (!this.messageHandlers[messageType]) {
      this.messageHandlers[messageType] = new Set();
    }
    
    this.messageHandlers[messageType].add(handler);
    return this;
  }
  
  /**
   * Remove message type handler
   * @param messageType Message type
   * @param handler Message handler
   * @returns This instance for chaining
   */
  offMessage(messageType: string, handler: WebSocketMessageHandler): this {
    if (this.messageHandlers[messageType]) {
      this.messageHandlers[messageType].delete(handler);
    }
    return this;
  }
  
  /**
   * Check if WebSocket is connected
   * @returns Whether WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get current connection state
   * @returns Connection state
   */
  getState(): ConnectionState {
    return this.state;
  }
  
  /**
   * Set authentication token
   * @param token Authentication token
   */
  setToken(token: string): void {
    this.options.token = token;
    
    // If connected, reconnect to apply new token
    if (this.isConnected()) {
      this.reconnect();
    }
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.log('info', 'Destroying WebSocket client');
    
    // Disconnect
    this.disconnect(1000, 'Client destroyed');
    
    // Remove window event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.handleWindowFocus);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('online', this.handleNetworkReconnect);
    }
    
    // Clear all event listeners
    Object.keys(this.listeners).forEach(event => {
      this.listeners[event as WebSocketEventType].clear();
    });
    
    // Clear message handlers
    Object.keys(this.messageHandlers).forEach(type => {
      this.messageHandlers[type].clear();
    });
    
    // Clear subscriptions
    this.subscriptions.clear();
    
    // Clear message queue
    this.messageQueue = [];
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen = (): void => {
    this.log('info', 'WebSocket connected');
    
    // Update state
    this.updateState(ConnectionState.CONNECTED);
    
    // Reset reconnection attempts
    this.reconnectAttempts = 0;
    
    // Send any queued messages
    this.flushMessageQueue();
    
    // Restore subscriptions if needed
    this.restoreSubscriptions();
    
    // Start heartbeat
    if (this.options.heartbeat.enabled) {
      this.startHeartbeat();
    }
    
    // Notify listeners
    this.emit('open');
  };
  
  /**
   * Handle WebSocket close event
   */
  private handleClose = (event: CloseEvent): void => {
    this.log('info', 'WebSocket closed', { 
      code: event.code, 
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    // Clear heartbeat
    this.clearHeartbeat();
    
    // Update state
    this.updateState(ConnectionState.DISCONNECTED);
    
    // Notify listeners
    this.emit('close', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    // Schedule reconnect if appropriate
    if (this.shouldReconnect(event)) {
      this.scheduleReconnect();
    }
  };
  
  /**
   * Handle WebSocket error event
   */
  private handleError = (event: Event): void => {
    this.log('error', 'WebSocket error', { event });
    
    // Update state
    this.updateState(ConnectionState.ERROR);
    
    // Notify listeners
    this.emit('error', { event });
  };
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage = (event: MessageEvent): void => {
    let data: any;
    
    // Parse message
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      this.log('error', 'Error parsing message', { error, data: event.data });
      return;
    }
    
    this.log('debug', 'Message received', { type: data.type });
    
    // Handle system messages
    this.handleSystemMessage(data);
    
    // Notify message listeners
    this.emit('message', data);
    
    // Call type-specific handlers
    if (data.type && this.messageHandlers[data.type]) {
      this.messageHandlers[data.type].forEach(handler => {
        try {
          handler(data.data || data.payload);
        } catch (error) {
          this.log('error', 'Error in message handler', { error, type: data.type });
        }
      });
    }
  };
  
  /**
   * Handle system messages
   * @param message Message data
   */
  private handleSystemMessage(message: any): void {
    // Connection response with connection ID
    if (message.type === 'connected' && message.data?.connectionId) {
      this.connectionId = message.data.connectionId;
      this.log('info', 'Connection ID received', { connectionId: this.connectionId });
    }
    
    // Pong response for heartbeat
    if (message.type === 'pong') {
      this.handlePong();
    }
    
    // Reconnection success
    if (message.type === 'reconnect:success') {
      this.emit('reconnect', message.data);
    }
    
    // Reconnection failure
    if (message.type === 'reconnect:failed') {
      this.log('warn', 'Reconnection failed', message.data);
    }
    
    // Error message
    if (message.type === 'error') {
      this.log('warn', 'Error message received', message.data || message.payload);
    }
  }
  
  /**
   * Handle reconnection on window focus
   */
  private handleWindowFocus = (): void => {
    if (!this.isConnected() && this.options.reconnect.enabled) {
      this.log('info', 'Window focused, attempting reconnect');
      this.reconnect();
    }
  };
  
  /**
   * Handle visibility change for reconnection
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && !this.isConnected() && this.options.reconnect.enabled) {
      this.log('info', 'Page visible, attempting reconnect');
      this.reconnect();
    }
  };
  
  /**
   * Handle network reconnection
   */
  private handleNetworkReconnect = (): void => {
    if (!this.isConnected() && this.options.reconnect.enabled) {
      this.log('info', 'Network reconnected, attempting reconnect');
      this.reconnect();
    }
  };
  
  /**
   * Determine if reconnection should be attempted
   * @param event Close event
   * @returns Whether to reconnect
   */
  private shouldReconnect(event: CloseEvent): boolean {
    // Don't reconnect if option is disabled
    if (!this.options.reconnect.enabled) {
      return false;
    }
    
    // Don't reconnect for normal closures
    if (event.code === 1000) {
      return false;
    }
    
    // Always reconnect for abnormal closures
    if (event.code === 1006) {
      return true;
    }
    
    // Don't reconnect for authentication issues
    if (event.code === 1008 && event.reason === 'Authentication failed') {
      return false;
    }
    
    // Don't reconnect if max attempts reached
    if (this.reconnectAttempts >= this.options.reconnect.maxAttempts) {
      this.log('warn', 'Maximum reconnection attempts reached');
      this.emit('reconnect_failed');
      return false;
    }
    
    // Default to reconnect
    return true;
  }
  
  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    // Cancel any existing reconnect timer
    this.cancelReconnect();
    
    // Increment attempt counter
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff and jitter
    const delay = this.calculateReconnectDelay();
    
    this.log('info', 'Scheduling reconnection attempt', { 
      attempt: this.reconnectAttempts, 
      delay,
      maxAttempts: this.options.reconnect.maxAttempts
    });
    
    // Update state
    this.updateState(ConnectionState.RECONNECTING);
    
    // Notify listeners
    this.emit('reconnect_attempt', { 
      attempt: this.reconnectAttempts,
      delay
    });
    
    // Schedule reconnect
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  
  /**
   * Cancel reconnection attempt
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Calculate reconnection delay with exponential backoff and jitter
   * @returns Delay in milliseconds
   */
  private calculateReconnectDelay(): number {
    const { initialDelay, maxDelay, factor, jitter } = this.options.reconnect;
    
    // Calculate base delay with exponential backoff
    const baseDelay = Math.min(
      initialDelay * Math.pow(factor, this.reconnectAttempts - 1),
      maxDelay
    );
    
    // Add jitter to prevent reconnection storms
    // Random value between (1 - jitter) and (1 + jitter)
    const jitterFactor = 1 + jitter * (2 * Math.random() - 1);
    
    return Math.floor(baseDelay * jitterFactor);
  }
  
  /**
   * Restore subscriptions after reconnection
   */
  private restoreSubscriptions(): void {
    if (this.subscriptions.size === 0) {
      return;
    }
    
    this.log('info', 'Restoring subscriptions', { count: this.subscriptions.size });
    
    // Send subscription message with all channels
    const channels = Array.from(this.subscriptions);
    if (channels.length > 0) {
      this.send('subscribe', { channels });
    }
  }
  
  /**
   * Queue message to send when connected
   * @param message Message to queue
   */
  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
    this.log('debug', 'Message queued', { type: message.type, id: message.id });
  }
  
  /**
   * Send queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }
    
    this.log('info', 'Sending queued messages', { count: this.messageQueue.length });
    
    // Clone and clear queue
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    // Send messages
    for (const message of queue) {
      try {
        this.ws?.send(JSON.stringify(message));
        this.log('debug', 'Queued message sent', { type: message.type, id: message.id });
      } catch (error) {
        this.log('error', 'Error sending queued message', { error, message });
        
        // Re-queue message
        this.messageQueue.push(message);
      }
    }
  }
  
  /**
   * Build WebSocket connection URL with parameters
   * @returns Complete WebSocket URL
   */
  private buildConnectionUrl(): string {
    const url = new URL(this.url);
    
    // Add connection ID for reconnection
    if (this.connectionId) {
      url.searchParams.set('connectionId', this.connectionId);
    }
    
    // Add authentication token
    if (this.options.token) {
      url.searchParams.set('token', this.options.token);
    }
    
    return url.toString();
  }
  
  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    // Clear any existing heartbeat
    this.clearHeartbeat();
    
    // Start heartbeat interval
    this.heartbeatTimer = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.options.heartbeat.interval);
    
    this.log('debug', 'Heartbeat started', {
      interval: this.options.heartbeat.interval
    });
  }
  
  /**
   * Send heartbeat ping
   */
  private sendHeartbeat(): void {
    if (!this.isConnected()) {
      return;
    }
    
    try {
      // Send ping message
      this.send('ping');
      
      // Set timeout for pong response
      this.heartbeatTimeout = window.setTimeout(() => {
        this.log('warn', 'Heartbeat timeout - no pong received');
        
        // Force reconnection
        this.reconnect();
      }, this.options.heartbeat.timeout);
    } catch (error) {
      this.log('error', 'Error sending heartbeat', { error });
    }
  }
  
  /**
   * Handle pong response
   */
  private handlePong(): void {
    // Clear heartbeat timeout
    if (this.heartbeatTimeout !== null) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    
    this.log('debug', 'Heartbeat pong received');
  }
  
  /**
   * Clear heartbeat timers
   */
  private clearHeartbeat(): void {
    // Clear interval
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    // Clear timeout
    if (this.heartbeatTimeout !== null) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }
  
  /**
   * Update connection state
   * @param state New state
   */
  private updateState(state: ConnectionState): void {
    if (this.state === state) {
      return;
    }
    
    const oldState = this.state;
    this.state = state;
    
    this.log('info', 'Connection state changed', { 
      from: oldState, 
      to: state 
    });
    
    // Notify listeners
    this.emit('state_change', { 
      oldState, 
      newState: state 
    });
  }
  
  /**
   * Emit event to listeners
   * @param event Event type
   * @param data Event data
   */
  private emit(event: WebSocketEventType, data?: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.log('error', `Error in ${event} event handler`, { error });
        }
      });
    }
  }
  
  /**
   * Merge options with defaults
   * @param options User options
   * @returns Merged options
   */
  private mergeOptions(options: WebSocketOptions): Required<WebSocketOptions> {
    // Deep merge reconnect options
    const reconnect = {
      ...DEFAULT_OPTIONS.reconnect,
      ...(options.reconnect || {})
    };
    
    // Deep merge logging options
    const logging = {
      ...DEFAULT_OPTIONS.logging,
      ...(options.logging || {})
    };
    
    // Deep merge heartbeat options
    const heartbeat = {
      ...DEFAULT_OPTIONS.heartbeat,
      ...(options.heartbeat || {})
    };
    
    return {
      ...DEFAULT_OPTIONS,
      ...options,
      reconnect,
      logging,
      heartbeat
    };
  }
  
  /**
   * Log message
   * @param level Log level
   * @param message Message
   * @param data Additional data
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.options.logging.enabled) {
      return;
    }
    
    const levelValue = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    // Skip if level is below configured level
    if (levelValue[level] < levelValue[this.options.logging.level]) {
      return;
    }
    
    // Log to console
    const logData = data ? { message, ...data } : message;
    
    switch (level) {
      case 'debug':
        console.debug('[WebSocket]', logData);
        break;
      case 'info':
        console.info('[WebSocket]', logData);
        break;
      case 'warn':
        console.warn('[WebSocket]', logData);
        break;
      case 'error':
        console.error('[WebSocket]', logData);
        break;
    }
  }
}

// Global WebSocket client instance
let globalClient: WebSocketClient | null = null;

/**
 * Get global WebSocket client instance
 * @param url WebSocket URL
 * @param options Connection options
 * @returns WebSocket client instance
 */
export function getWebSocketClient(url?: string, options?: WebSocketOptions): WebSocketClient {
  if (!globalClient && url) {
    globalClient = new WebSocketClient(url, options);
  } else if (!globalClient) {
    throw new Error('WebSocket client not initialized. Please provide URL for first call.');
  }
  
  return globalClient;
}

/**
 * Close global WebSocket client
 */
export function closeWebSocketClient(): void {
  if (globalClient) {
    globalClient.destroy();
    globalClient = null;
  }
}
