/**
 * WebSocket client for real-time communication with the server
 */

export interface WebSocketMessage {
  type: string;
  data?: any;
}

export type MessageHandler = (message: WebSocketMessage) => void;

/**
 * WebSocket client class for handling real-time communication
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();
  private heartbeatInterval: number | null = null;
  
  /**
   * Create a new WebSocket client
   * @param url WebSocket URL
   */
  constructor(url: string) {
    this.url = url;
  }
  
  /**
   * Connect to the WebSocket server
   * @param token Authentication token
   */
  connect(token?: string): void {
    // Close existing connection if any
    if (this.ws) {
      this.ws.close();
    }
    
    // Create URL with token if provided
    const wsUrl = token ? `${this.url}?token=${token}` : this.url;
    
    try {
      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
      console.log('WebSocket connecting...');
    } catch (error) {
      console.error('Error creating WebSocket connection', error);
      this.attemptReconnect();
    }
  }
  
  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      this.notifyConnectionHandlers(false);
    }
  }
  
  /**
   * Send a message to the server
   * @param message Message to send
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Cannot send message:', message);
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
  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.notifyConnectionHandlers(true);
    
    // Start heartbeat
    this.startHeartbeat();
  }
  
  /**
   * Handle WebSocket close event
   * @param event Close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: code=${event.code}, reason=${event.reason || 'No reason provided'}`);
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.notifyConnectionHandlers(false);
    
    // Attempt reconnection if not closed cleanly
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }
  
  /**
   * Handle WebSocket message event
   * @param event Message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Handle ping/pong for heartbeat
      if (message.type === 'pong') {
        return;
      }
      
      // Notify handlers for this message type
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Error in message handler', error);
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
            console.error('Error in message handler', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message', error);
    }
  }
  
  /**
   * Handle WebSocket error event
   * @param event Error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error', event);
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const jitter = Math.random() * 0.3 + 0.85; // Random factor between 0.85-1.15
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1) * jitter;
    
    console.log(`Reconnecting in ${Math.round(delay)}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => this.connect(), delay);
    
    // Increase delay for next attempt (capped at 30 seconds)
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
  }
  
  /**
   * Send periodic heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    // Send ping every 30 seconds
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      } else {
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
      }
    }, 30000);
  }
  
  /**
   * Notify connection status handlers
   * @param connected Connection status
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler', error);
      }
    });
  }
}

// Create singleton instance with smart URL detection
export const websocketClient = new WebSocketClient(
  // Use environment variable if available, otherwise construct from window location
  process.env.NEXT_PUBLIC_WS_URL || 
  `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}/ws`
);