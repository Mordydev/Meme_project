/**
 * WebSocket Client
 * Client for real-time communication with the backend
 */
import { WebSocketEventType, WebSocketMessage } from '@success-kid/types';

/**
 * WebSocket connection options
 */
export interface WebSocketOptions {
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
}

/**
 * Default WebSocket options
 */
const DEFAULT_OPTIONS: Required<WebSocketOptions> = {
  url: process.env.NEXT_PUBLIC_WS_URL || '/ws',
  autoConnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  useExponentialBackoff: true,
  getAuthToken: () => localStorage.getItem('auth_token'),
};

/**
 * WebSocket event handler function
 */
export type WebSocketEventHandler = (data: any) => void;

/**
 * WebSocket client for real-time communication
 */
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private connectionId: string | null = null;
  private subscriptions: Set<string> = new Set();
  
  /**
   * Create a new WebSocket client
   * @param options WebSocket options
   */
  constructor(options: WebSocketOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    if (this.options.autoConnect && typeof window !== 'undefined') {
      // Only auto-connect in browser environment
      this.connect();
    }
  }
  
  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    // Don't connect if already connected or connecting
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
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
      
      console.log('WebSocket connecting...');
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Close the WebSocket connection
   */
  close(): void {
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
      });
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
   * @returns Whether message was sent
   */
  send(message: WebSocketMessage): boolean {
    if (!this.isConnected()) {
      console.warn('Cannot send message, WebSocket not connected');
      return false;
    }
    
    try {
      // Add message ID if not present
      const fullMessage = {
        ...message,
        id: message.id || this.generateMessageId()
      };
      
      this.socket!.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
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
   * Check if WebSocket is connected
   * @returns Whether WebSocket is connected
   */
  isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get current connection ID
   * @returns Connection ID or null if not connected
   */
  getConnectionId(): string | null {
    return this.connectionId;
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    console.log('WebSocket connected');
    
    // Reset reconnect attempts on successful connection
    this.reconnectAttempts = 0;
    
    // Start heartbeat to keep connection alive
    this.startHeartbeat();
    
    // Restore subscriptions
    if (this.subscriptions.size > 0) {
      this.send({
        type: WebSocketEventType.SUBSCRIBE,
        payload: {
          channels: Array.from(this.subscriptions)
        }
      });
    }
    
    // Notify any registered open handlers
    this.notifyEventHandlers('open', { type: 'open' });
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Store connection ID for reconnection
      if (message.type === WebSocketEventType.CONNECTED && message.payload?.connectionId) {
        this.connectionId = message.payload.connectionId;
      }
      
      // Handle subscription confirmation
      if (message.type === WebSocketEventType.SUBSCRIBE_CONFIRMATION && message.payload?.channels) {
        const channels = message.payload.channels;
        console.log(`Subscribed to channels: ${channels.join(', ')}`);
      }
      
      // Handle reconnection success
      if (message.type === WebSocketEventType.RECONNECT_SUCCESS) {
        console.log('Reconnection successful', message.payload);
      }
      
      // Respond to ping with pong
      if (message.type === WebSocketEventType.PING) {
        this.send({
          type: WebSocketEventType.PONG,
          id: message.id,
          payload: { timestamp: Date.now() }
        });
      }
      
      // Notify all handlers for this event type
      this.notifyEventHandlers(message.type, message.payload);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: code=${event.code}, reason=${event.reason || 'none'}`);
    
    this.socket = null;
    
    // Schedule reconnection
    this.scheduleReconnect();
    
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
    console.error('WebSocket error:', event);
    
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
      console.log('Maximum reconnection attempts reached');
      
      // Notify disconnected handlers
      this.notifyEventHandlers('maxReconnectAttemptsReached', {
        attempts: this.reconnectAttempts
      });
      
      return;
    }
    
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
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1} of ${this.options.maxReconnectAttempts})`);
    
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
    // Send ping every 30 seconds to keep connection alive
    setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: WebSocketEventType.PING,
          payload: { timestamp: Date.now() }
        });
      }
    }, 30000);
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
   * Generate a unique message ID
   * @returns Unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }
}

// Create and export singleton instance
export const webSocketClient = typeof window !== 'undefined' ? new WebSocketClient() : null;
