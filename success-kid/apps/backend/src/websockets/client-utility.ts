/**
 * WebSocket Client Utility
 * 
 * Provides client-side code and utilities for WebSocket integration.
 * This file contains implementation examples to share with frontend developers.
 */

/**
 * WebSocket Client with reconnection and authentication
 * Example implementation for frontend code
 */
export const websocketClientExample = `
/**
 * WebSocket Client for Success Kid Platform
 * 
 * Provides WebSocket connectivity with authentication, reconnection,
 * and message handling.
 */
class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000; // 1 second initial delay
  private connectionId: string | null = null;
  private eventHandlers = new Map();
  private heartbeatInterval: any = null;
  private reconnectTimeout: any = null;
  
  /**
   * Create a WebSocket client instance
   * 
   * @param url WebSocket server URL
   * @param authToken Authentication token
   */
  constructor(
    private url: string,
    private authToken: string
  ) {}
  
  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Build connection URL with authentication
    const params = new URLSearchParams();
    params.append('token', this.authToken);
    
    // Add connection ID for reconnection if available
    if (this.connectionId) {
      params.append('connectionId', this.connectionId);
    }
    
    const connUrl = \`\${this.url}?\${params.toString()}\`;
    
    // Create WebSocket
    this.socket = new WebSocket(connUrl);
    
    // Set up event handlers
    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
    this.socket.onerror = this.handleError.bind(this);
    
    // Log connection attempt
    console.log('WebSocket connecting...');
  }
  
  /**
   * Send a message to the server
   * 
   * @param type Message type
   * @param payload Message payload
   * @returns Whether the message was sent
   */
  send(type: string, payload: any = {}): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message, WebSocket not connected');
      return false;
    }
    
    try {
      const message = {
        type,
        payload,
        id: Math.random().toString(36).substring(2, 9), // Simple random ID
        timestamp: Date.now()
      };
      
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message', error);
      return false;
    }
  }
  
  /**
   * Close the WebSocket connection
   * 
   * @param code Close code
   * @param reason Close reason
   */
  close(code: number = 1000, reason: string = 'Client closed connection'): void {
    if (this.socket) {
      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      // Close the connection
      this.socket.close(code, reason);
      this.socket = null;
    }
  }
  
  /**
   * Register an event handler
   * 
   * @param event Event type
   * @param handler Handler function
   * @returns Function to remove the handler
   */
  on(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event).push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
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
    
    // Subscribe to relevant channels and events
    this.subscribeToChannels();
    
    // Emit open event
    this.emit('open', { timestamp: Date.now() });
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(\`WebSocket closed: \${event.code} \${event.reason}\`);
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Emit close event
    this.emit('close', { 
      code: event.code, 
      reason: event.reason, 
      wasClean: event.wasClean 
    });
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      // Handle system messages
      if (message.type === 'system') {
        // Handle connectionId for reconnection
        if (message.payload.connectionId) {
          this.connectionId = message.payload.connectionId;
        }
        
        // Emit system event
        this.emit('system', message.payload);
        return;
      }
      
      // Handle pong responses
      if (message.type === 'pong') {
        this.emit('pong', message.payload);
        return;
      }
      
      // Handle other messages by type
      if (message.type) {
        this.emit(message.type, message.payload);
        // Also emit a generic 'message' event
        this.emit('message', message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message', error);
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error', event);
    
    // Emit error event
    this.emit('error', { event, timestamp: Date.now() });
  }
  
  /**
   * Emit an event to registered handlers
   * 
   * @param event Event type
   * @param data Event data
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler: Function) => {
        try {
          handler(data);
        } catch (error) {
          console.error(\`Error in WebSocket \${event} handler\`, error);
        }
      });
    }
  }
  
  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket reconnection failed after maximum attempts');
      
      // Emit reconnect_failed event
      this.emit('reconnect_failed', { 
        attempts: this.reconnectAttempts,
        timestamp: Date.now()
      });
      
      return;
    }
    
    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(
      30000, // Max 30 seconds
      this.baseDelay * Math.pow(1.5, this.reconnectAttempts) * 
      (0.9 + Math.random() * 0.2) // Add jitter (±10%)
    );
    
    this.reconnectAttempts++;
    
    console.log(\`WebSocket reconnecting in \${Math.round(delay)}ms... (Attempt \${this.reconnectAttempts})\`);
    
    // Schedule reconnection
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
    
    // Emit reconnecting event
    this.emit('reconnecting', { 
      attempt: this.reconnectAttempts,
      delay: delay,
      timestamp: Date.now()
    });
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    // Clean up existing interval if any
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Start new heartbeat interval (30 seconds)
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send('ping');
      } else {
        // Stop heartbeat if connection is not open
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }, 30000);
  }
  
  /**
   * Subscribe to channels after connection
   */
  private subscribeToChannels(): void {
    // Subscribe to user's notification channel
    this.send('subscribe', {
      channels: ['user:notifications', 'presence:updates']
    });
  }
}

// Example usage:
const ws = new WebSocketClient('wss://api.successkid.com/ws', 'auth-token-here');

// Connect to WebSocket server
ws.connect();

// Register event handlers
ws.on('notification', (data) => {
  console.log('New notification:', data);
  // Update UI with new notification
});

ws.on('presence.update', (data) => {
  console.log('Presence update:', data);
  // Update user presence indicator
});

ws.on('reconnecting', (data) => {
  console.log(\`Reconnecting... Attempt \${data.attempt}\`);
  // Show reconnecting indicator
});

// Close connection when done
// ws.close();
`;

/**
 * React Hook for WebSocket integration
 * Example implementation for frontend code
 */
export const websocketReactHookExample = `
/**
 * React Hook for Success Kid WebSocket Integration
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * WebSocket connection state
 */
export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  RECONNECTING = 4  // Custom state for reconnection
}

/**
 * Hook options
 */
interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onReconnect?: (attempt: number) => void;
  shouldReconnect?: boolean;
}

/**
 * Hook return type
 */
interface UseWebSocketReturn {
  sendMessage: (data: any) => void;
  sendJsonMessage: (data: any) => void;
  lastMessage: MessageEvent | null;
  readyState: WebSocketState;
  reconnectAttempt: number;
  connect: () => void;
  disconnect: () => void;
}

/**
 * React hook for WebSocket integration
 * 
 * @param url WebSocket URL
 * @param options Hook options
 * @returns WebSocket utilities
 */
export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  // Extract options with defaults
  const {
    reconnectAttempts = 5,
    reconnectInterval = 1000,
    protocols = [],
    onOpen,
    onClose,
    onMessage,
    onError,
    onReconnect,
    shouldReconnect = true
  } = options;
  
  // State for WebSocket
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<WebSocketState>(WebSocketState.CLOSED);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  
  // Refs for stable values
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef<number>(0);
  
  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    // Close existing connection if any
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    
    // Update state
    setReadyState(WebSocketState.CONNECTING);
    
    // Create new WebSocket
    socketRef.current = new WebSocket(url, protocols);
    
    // Set up event handlers
    socketRef.current.onopen = (event) => {
      console.log('WebSocket connected');
      setReadyState(WebSocketState.OPEN);
      reconnectCountRef.current = 0;
      
      if (onOpen) onOpen(event);
    };
    
    socketRef.current.onclose = (event) => {
      console.log(\`WebSocket closed: \${event.code} \${event.reason}\`);
      setReadyState(WebSocketState.CLOSED);
      
      // Try to reconnect if enabled
      if (shouldReconnect && event.code !== 1000) {
        handleReconnect();
      }
      
      if (onClose) onClose(event);
    };
    
    socketRef.current.onmessage = (event) => {
      setLastMessage(event);
      
      if (onMessage) onMessage(event);
    };
    
    socketRef.current.onerror = (event) => {
      console.error('WebSocket error', event);
      
      if (onError) onError(event);
    };
  }, [url, protocols, onOpen, onClose, onMessage, onError, shouldReconnect]);
  
  /**
   * Handle reconnection
   */
  const handleReconnect = useCallback(() => {
    // Check if we've exceeded max reconnect attempts
    if (reconnectCountRef.current >= reconnectAttempts) {
      console.error('WebSocket reconnection failed after maximum attempts');
      setReadyState(WebSocketState.CLOSED);
      return;
    }
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Increment reconnect count
    reconnectCountRef.current++;
    setReconnectAttempt(reconnectCountRef.current);
    setReadyState(WebSocketState.RECONNECTING);
    
    // Calculate reconnect delay with exponential backoff and jitter
    const delay = Math.min(
      30000, // Max 30 seconds
      reconnectInterval * Math.pow(1.5, reconnectCountRef.current - 1) * 
      (0.9 + Math.random() * 0.2) // Add jitter (±10%)
    );
    
    console.log(\`WebSocket reconnecting in \${Math.round(delay)}ms... (Attempt \${reconnectCountRef.current})\`);
    
    // Notify about reconnection
    if (onReconnect) onReconnect(reconnectCountRef.current);
    
    // Schedule reconnection
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, reconnectAttempts, reconnectInterval, onReconnect]);
  
  /**
   * Send raw message
   */
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);
  
  /**
   * Send JSON message
   */
  const sendJsonMessage = useCallback((data: any) => {
    sendMessage(JSON.stringify(data));
  }, [sendMessage]);
  
  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close socket if open
    if (socketRef.current) {
      socketRef.current.close(1000, 'Client disconnected');
      socketRef.current = null;
    }
    
    setReadyState(WebSocketState.CLOSED);
  }, []);
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Return hook interface
  return {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    readyState,
    reconnectAttempt,
    connect,
    disconnect
  };
}

// Example usage:
function NotificationComponent() {
  const {
    sendJsonMessage,
    lastMessage,
    readyState,
    reconnectAttempt,
  } = useWebSocket('wss://api.successkid.com/ws', {
    onOpen: () => {
      console.log('WebSocket connected');
      // Send authentication
      sendJsonMessage({
        type: 'auth',
        payload: { token: 'user-auth-token' }
      });
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          // Handle notification
          console.log('New notification:', data.payload);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message', error);
      }
    }
  });
  
  // Subscribe to notifications when connected
  useEffect(() => {
    if (readyState === WebSocketState.OPEN) {
      sendJsonMessage({
        type: 'subscribe',
        payload: {
          channels: ['user:notifications', 'presence:updates']
        }
      });
    }
  }, [readyState, sendJsonMessage]);
  
  return (
    <div>
      <div>WebSocket Status: {WebSocketState[readyState]}</div>
      {readyState === WebSocketState.RECONNECTING && (
        <div>Reconnecting... Attempt {reconnectAttempt}</div>
      )}
      {lastMessage && (
        <div>
          <h3>Last Message:</h3>
          <pre>{JSON.stringify(JSON.parse(lastMessage.data), null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
`;

/**
 * Example of how to handle specific notification types
 */
export const notificationHandlersExample = `
/**
 * Notification Handlers for Success Kid Platform
 */

/**
 * Format notification timestamp
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

/**
 * Handle points awarded notification
 */
function handlePointsAwardedNotification(notification) {
  const { amount, source, total, timestamp } = notification;
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    title: 'Points Awarded!',
    message: \`You earned \${amount} points for \${source}.\`,
    icon: 'coins',
    color: 'success',
    time: formatTimestamp(timestamp),
    action: () => navigateToPoints()
  };
}

/**
 * Handle achievement unlocked notification
 */
function handleAchievementNotification(notification) {
  const { achievement, pointsAwarded, timestamp } = notification;
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    title: 'Achievement Unlocked!',
    message: \`You unlocked "\${achievement.name}" and earned \${pointsAwarded} points!\`,
    icon: 'award',
    color: 'primary',
    time: formatTimestamp(timestamp),
    action: () => navigateToAchievement(achievement.id)
  };
}

/**
 * Handle content comment notification
 */
function handleCommentNotification(notification) {
  const { author, contentTitle, comment, timestamp } = notification;
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    title: 'New Comment',
    message: \`\${author.name} commented on "\${contentTitle}"\`,
    icon: 'message-circle',
    color: 'info',
    time: formatTimestamp(timestamp),
    action: () => navigateToContent(notification.contentId)
  };
}

/**
 * Handle milestone reached notification
 */
function handleMilestoneNotification(notification) {
  const { milestone, marketCap, timestamp } = notification;
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    title: 'Milestone Reached!',
    message: \`The \${milestone} milestone has been reached! Market cap: \${formatCurrency(marketCap)}\`,
    icon: 'flag',
    color: 'warning',
    time: formatTimestamp(timestamp),
    action: () => navigateToMarket()
  };
}

/**
 * Process notification based on type
 */
function processNotification(data) {
  // Determine handler based on notification type
  switch (data.type) {
    case 'points.awarded':
      return handlePointsAwardedNotification(data.payload);
    
    case 'achievement.unlocked':
      return handleAchievementNotification(data.payload);
    
    case 'content.commented':
      return handleCommentNotification(data.payload);
    
    case 'milestone.reached':
      return handleMilestoneNotification(data.payload);
    
    default:
      // Generic handler for unknown types
      return {
        id: Math.random().toString(36).substring(2, 9),
        title: data.payload.title || 'Notification',
        message: data.payload.body || JSON.stringify(data.payload),
        icon: 'bell',
        color: 'default',
        time: formatTimestamp(data.payload.timestamp),
        action: () => console.log('Notification clicked', data)
      };
  }
}

// Example WebSocket message handler
function handleWebSocketMessage(message) {
  if (message.type === 'notification') {
    const notification = processNotification(message);
    displayNotification(notification);
  }
}

// Example notification display function
function displayNotification(notification) {
  // Add to notification store/state
  notificationStore.add(notification);
  
  // Show toast notification if appropriate
  if (userPreferences.showToasts) {
    showToast(notification);
  }
  
  // Update notification badge count
  updateNotificationBadge();
}
`;
