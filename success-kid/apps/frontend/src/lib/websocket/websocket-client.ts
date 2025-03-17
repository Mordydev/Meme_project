/**
 * Enhanced WebSocket client for the Success Kid platform
 * 
 * Provides a robust WebSocket implementation with reconnection logic,
 * event-based subscription, and standardized message formats.
 */
import { WebSocketEventType, WebSocketMessage } from '@success-kid/api-types';
import { getAuthToken } from '@/lib/auth/auth-utils';

// Define callback types
export type MessageHandler = (message: WebSocketMessage) => void;
export type ConnectionHandler = (connected: boolean) => void;
export type ErrorHandler = (error: Error) => void;

// WebSocket client configuration
export interface WebSocketClientConfig {
  url: string;
  autoConnect: boolean;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  reconnectBackoffFactor: number;
  maxReconnectDelay: number;
  pingInterval: number;
  debug: boolean;
}

// Default configuration
const defaultConfig: WebSocketClientConfig = {
  url: typeof window !== 'undefined' 
    ? `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}/ws`
    : 'ws://localhost:3000/ws',
  autoConnect: true,
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  reconnectBackoffFactor: 1.5,
  maxReconnectDelay: 30000,
  pingInterval: 30000,
  debug: false
};

/**
 * Enhanced WebSocket client with reconnection and subscription capabilities
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private reconnectAttempts = 0;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private pingIntervalId: number | null = null;
  private isConnected = false;
  private connectionId: string | null = null;
  private pendingMessages: WebSocketMessage[] = [];
  private subscriptions: Set<string> = new Set();
  
  /**
   * Create a new WebSocket client
   * 
   * @param config Configuration options
   */
  constructor(config: Partial<WebSocketClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // Automatically connect if configured
    if (this.config.autoConnect && typeof window !== 'undefined') {
      // Connect after the initial render
      setTimeout(() => this.connect(), 0);
    }
  }
  
  /**
   * Connect to the WebSocket server
   * 
   * @param token Optional token for authentication
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<boolean> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('WebSocket already connected');
      return true;
    }
    
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      this.log('WebSocket already connecting');
      return new Promise<boolean>((resolve) => {
        const handler = (connected: boolean) => {
          this.unsubscribeFromConnection(handler);
          resolve(connected);
        };
        this.subscribeToConnection(handler);
      });
    }
    
    try {
      // Close existing connection if any
      this.disconnect();
      
      // Get auth token if available
      const token = await getAuthToken();
      
      // Build WebSocket URL with query parameters
      let wsUrl = this.config.url;
      const params = new URLSearchParams();
      
      if (token) {
        params.append('token', token);
      }
      
      if (this.connectionId) {
        params.append('connectionId', this.connectionId);
      }
      
      if (params.toString()) {
        wsUrl += `?${params.toString()}`;
      }
      
      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl);
      
      return new Promise<boolean>((resolve) => {
        if (!this.ws) {
          resolve(false);
          return;
        }
        
        // Set up event handlers
        this.ws.onopen = () => {
          this.handleOpen();
          resolve(true);
        };
        
        this.ws.onclose = this.handleClose.bind(this);
        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onerror = (event) => {
          this.handleError(event);
          resolve(false);
        };
        
        this.log('WebSocket connecting...');
      });
    } catch (error) {
      this.log('Error creating WebSocket connection', error);
      this.notifyErrorHandlers(error as Error);
      
      if (this.config.autoReconnect) {
        this.attemptReconnect();
      }
      
      return false;
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
      
      if (this.pingIntervalId) {
        clearInterval(this.pingIntervalId);
        this.pingIntervalId = null;
      }
      
      if (this.isConnected) {
        this.isConnected = false;
        this.notifyConnectionHandlers(false);
      }
    }
  }
  
  /**
   * Send a message to the server
   * 
   * @param message The message to send
   * @returns True if message was sent, false otherwise
   */
  send(message: WebSocketMessage | Partial<WebSocketMessage>): boolean {
    // Ensure message has type and meta
    const fullMessage: WebSocketMessage = {
      type: message.type || WebSocketEventType.ERROR,
      payload: message.payload,
      meta: {
        timestamp: new Date().toISOString(),
        ...(message.meta || {})
      }
    };
    
    // Check if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(fullMessage));
        return true;
      } catch (error) {
        this.log('Error sending message', error);
        this.notifyErrorHandlers(error as Error);
        return false;
      }
    } else {
      this.log('WebSocket not connected. Queueing message:', fullMessage);
      
      // Queue message for later sending
      this.pendingMessages.push(fullMessage);
      
      // Try to connect if not connected and auto-reconnect is enabled
      if (this.config.autoReconnect && (!this.ws || this.ws.readyState !== WebSocket.CONNECTING)) {
        this.connect();
      }
      
      return false;
    }
  }
  
  /**
   * Subscribe to a specific message type
   * 
   * @param type Message type to subscribe to
   * @param handler Handler function for the message
   * @returns A function to unsubscribe
   */
  subscribe(type: WebSocketEventType | string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);
    
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
   * Subscribe to all messages
   * 
   * @param handler Handler function for all messages
   * @returns A function to unsubscribe
   */
  subscribeToAll(handler: MessageHandler): () => void {
    return this.subscribe('*', handler);
  }
  
  /**
   * Subscribe to connection state changes
   * 
   * @param handler Handler function for connection state
   * @returns A function to unsubscribe
   */
  subscribeToConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    
    // Immediately notify handler of current state
    handler(this.isConnected);
    
    return () => this.unsubscribeFromConnection(handler);
  }
  
  /**
   * Unsubscribe from connection state changes
   * 
   * @param handler Handler function to remove
   */
  unsubscribeFromConnection(handler: ConnectionHandler): void {
    this.connectionHandlers.delete(handler);
  }
  
  /**
   * Subscribe to WebSocket errors
   * 
   * @param handler Handler function for errors
   * @returns A function to unsubscribe
   */
  subscribeToErrors(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    
    return () => {
      this.errorHandlers.delete(handler);
    };
  }
  
  /**
   * Subscribe to a channel
   * 
   * @param channel Channel to subscribe to
   * @returns True if subscription was successful
   */
  subscribeToChannel(channel: string): boolean {
    // Store subscription locally
    this.subscriptions.add(channel);
    
    // Send subscription to server if connected
    const success = this.send({
      type: WebSocketEventType.CONNECT,
      payload: {
        channels: [channel]
      }
    });
    
    return success;
  }
  
  /**
   * Unsubscribe from a channel
   * 
   * @param channel Channel to unsubscribe from
   * @returns True if unsubscription was successful
   */
  unsubscribeFromChannel(channel: string): boolean {
    // Remove from local subscriptions
    this.subscriptions.delete(channel);
    
    // Send unsubscription to server if connected
    const success = this.send({
      type: 'unsubscribe',
      payload: {
        channels: [channel]
      }
    });
    
    return success;
  }
  
  /**
   * Check if client is connected
   * 
   * @returns True if connected, false otherwise
   */
  isConnectedToServer(): boolean {
    return this.isConnected;
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.log('WebSocket connected');
    
    this.reconnectAttempts = 0;
    this.isConnected = true;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Process any connection response
    // Re-subscribe to channels
    if (this.subscriptions.size > 0) {
      this.send({
        type: WebSocketEventType.CONNECT,
        payload: {
          channels: Array.from(this.subscriptions)
        }
      });
    }
    
    // Send any queued messages
    this.sendQueuedMessages();
    
    // Notify connection handlers
    this.notifyConnectionHandlers(true);
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log(`WebSocket closed: code=${event.code}, reason=${event.reason || 'No reason provided'}`);
    
    // Stop heartbeat
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
    
    // Update connection state
    if (this.isConnected) {
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
    }
    
    // Attempt reconnection if appropriate
    if (
      this.config.autoReconnect && 
      event.code !== 1000 && // Normal closure
      event.code !== 1001 && // Going away
      event.code !== 1008 && // Policy violation (usually auth)
      this.reconnectAttempts < this.config.maxReconnectAttempts
    ) {
      this.attemptReconnect();
    }
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Store connection ID if present
      if (message.type === WebSocketEventType.CONNECT && message.payload?.connectionId) {
        this.connectionId = message.payload.connectionId;
        this.log('Connection ID received:', this.connectionId);
      }
      
      // Reset heartbeat on any message
      if (this.pingIntervalId) {
        clearInterval(this.pingIntervalId);
        this.startHeartbeat();
      }
      
      // Notify type-specific handlers
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            this.log('Error in message handler', error);
            this.notifyErrorHandlers(error as Error);
          }
        });
      }
      
      // Notify wildcard handlers
      const wildcardHandlers = this.messageHandlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            this.log('Error in wildcard message handler', error);
            this.notifyErrorHandlers(error as Error);
          }
        });
      }
    } catch (error) {
      this.log('Error parsing WebSocket message', error);
      this.notifyErrorHandlers(error as Error);
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    const error = new Error('WebSocket error');
    this.log('WebSocket error', event);
    this.notifyErrorHandlers(error);
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff and jitter
    const jitter = Math.random() * 0.3 + 0.85; // Random factor between 0.85-1.15
    let delay = this.config.reconnectDelay * 
                Math.pow(this.config.reconnectBackoffFactor, this.reconnectAttempts - 1) * 
                jitter;
    
    // Cap delay at maximum
    delay = Math.min(delay, this.config.maxReconnectDelay);
    
    this.log(`Reconnecting in ${Math.round(delay)}ms... (Attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    setTimeout(() => this.connect(), delay);
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (typeof window === 'undefined') return;
    
    this.pingIntervalId = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: WebSocketEventType.PING
        });
      } else {
        if (this.pingIntervalId) {
          clearInterval(this.pingIntervalId);
          this.pingIntervalId = null;
        }
      }
    }, this.config.pingInterval);
  }
  
  /**
   * Send any queued messages
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
   * Notify connection handler of connection status
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        this.log('Error in connection handler', error);
      }
    });
  }
  
  /**
   * Notify error handlers of errors
   */
  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        this.log('Error in error handler', handlerError);
      }
    });
  }
  
  /**
   * Log debug messages
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[WebSocketClient] ${message}`, ...args);
    }
  }
}

// Create and export a singleton instance with default config
export const createWebSocketClient = () => {
  if (typeof window !== 'undefined') {
    return new WebSocketClient({
      url: process.env.NEXT_PUBLIC_WS_URL || 
           `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}/ws`,
      debug: process.env.NODE_ENV !== 'production',
      autoConnect: true
    });
  }
  return null;
};

// Use dynamic import for client-side only
let websocketClient: WebSocketClient | null = null;
if (typeof window !== 'undefined') {
  websocketClient = createWebSocketClient();
}

export { websocketClient };
