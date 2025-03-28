/**
 * Socket.io API Adapter for WebSocket
 * 
 * This adapter provides a Socket.io-like API on top of standard WebSockets
 * to enable easier migration and compatibility with Socket.io patterns.
 */

// Event handler type
export type EventHandler = (data: any) => void;

// Message format
interface SocketMessage {
  event: string;
  data: any;
}

/**
 * Socket.io API adapter for WebSocket
 */
export class SocketIOAdapter {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private connected: boolean = false;
  private url: string;
  private autoReconnect: boolean;
  private connectionAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private reconnectTimer: number | null = null;
  
  /**
   * Create a new Socket.io adapter
   * 
   * @param url WebSocket URL
   * @param autoReconnect Whether to automatically reconnect
   */
  constructor(url: string, autoReconnect: boolean = true) {
    this.url = url;
    this.autoReconnect = autoReconnect;
  }
  
  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws) {
      this.ws.close();
    }
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.connectionAttempts = 0;
        
        // Emit connect event
        this.emit('connect');
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.connected = false;
        
        // Emit disconnect event
        this.emit('disconnect');
        
        // Auto reconnect if enabled
        if (this.autoReconnect && this.connectionAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Emit error event
        this.emit('error', error);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as SocketMessage;
          
          // Handle the message based on event type
          if (message.event) {
            this.handleEvent(message.event, message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      
      if (this.autoReconnect && this.connectionAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    }
  }
  
  /**
   * Close the WebSocket connection
   */
  close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  /**
   * Check if connected to the server
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Subscribe to an event
   * 
   * @param event Event name
   * @param handler Event handler function
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)!.add(handler);
  }
  
  /**
   * Unsubscribe from an event
   * 
   * @param event Event name
   * @param handler Event handler function
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }
  
  /**
   * Emit an event to the server
   * 
   * @param event Event name
   * @param data Data to send
   */
  emit(event: string, data?: any): void {
    // Special case for local events
    if (event === 'connect' || event === 'disconnect' || event === 'error') {
      this.handleEvent(event, data);
      return;
    }
    
    // Send to server if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: SocketMessage = {
        event,
        data
      };
      
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn(`Cannot emit event '${event}': WebSocket not connected`);
    }
  }
  
  /**
   * Handle an incoming event
   * 
   * @param event Event name
   * @param data Event data
   */
  private handleEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      });
    }
  }
  
  /**
   * Attempt to reconnect to the server
   */
  private reconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.connectionAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = this.reconnectDelay * Math.pow(1.5, this.connectionAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms... (Attempt ${this.connectionAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }
}

/**
 * Create a Socket.io-like interface from a WebSocket
 * 
 * @param url WebSocket URL
 * @returns Socket.io-like interface
 */
export function createSocketIOAdapter(url: string): SocketIOAdapter {
  return new SocketIOAdapter(url);
}
