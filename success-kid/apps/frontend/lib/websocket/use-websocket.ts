/**
 * React hooks for WebSocket integration
 * 
 * Provides React hooks for integrating WebSocket functionality
 * into React components with React-specific state management
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getWebSocketClient, WebSocketClient, ConnectionState, WebSocketOptions } from './ws-client';

/**
 * Return type for useWebSocket hook
 */
export interface UseWebSocketReturn {
  /**
   * The WebSocket client instance
   */
  client: WebSocketClient;
  
  /**
   * Current connection state
   */
  connectionState: ConnectionState;
  
  /**
   * Whether WebSocket is connected
   */
  isConnected: boolean;
  
  /**
   * Connect to WebSocket server
   */
  connect: () => void;
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect: () => void;
  
  /**
   * Send a message
   * @param type Message type
   * @param payload Message payload
   * @param options Send options
   * @returns Message ID
   */
  send: (type: string, payload?: any, options?: { id?: string, queueIfDisconnected?: boolean }) => string;
  
  /**
   * Subscribe to a channel
   * @param channel Channel name
   * @returns Success flag
   */
  subscribe: (channel: string) => boolean;
  
  /**
   * Unsubscribe from a channel
   * @param channel Channel name
   * @returns Success flag
   */
  unsubscribe: (channel: string) => boolean;
  
  /**
   * List of active subscriptions
   */
  subscriptions: string[];
  
  /**
   * Last received message
   */
  lastMessage: any | null;
  
  /**
   * Error information if any
   */
  error: Error | null;
  
  /**
   * Last event received, if any
   */
  lastEvent: { type: string; data: any } | null;
}

/**
 * WebSocket hook options
 */
export interface UseWebSocketOptions extends WebSocketOptions {
  /**
   * Automatically connect when hook is mounted
   * Default: true
   */
  autoConnect?: boolean;
  
  /**
   * Channels to subscribe to automatically
   * Default: []
   */
  channels?: string[];
  
  /**
   * Enable dev tools integration
   * Default: true in development, false in production
   */
  devTools?: boolean;
}

/**
 * React hook for WebSocket integration
 * @param url WebSocket URL
 * @param options WebSocket and hook options
 * @returns WebSocket state and methods
 */
export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  // WebSocket client reference
  const clientRef = useRef<WebSocketClient | null>(null);
  
  // Component state
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);
  
  // Get or create client instance
  const client = useMemo(() => {
    // Only create the client once
    if (!clientRef.current) {
      const wsClient = getWebSocketClient(url, options);
      clientRef.current = wsClient;
    }
    return clientRef.current;
  }, [url]);
  
  // Initialize event handlers
  useEffect(() => {
    if (!client) return;
    
    // State change handler
    const handleStateChange = (data: { oldState: ConnectionState; newState: ConnectionState }) => {
      setConnectionState(data.newState);
      setLastEvent({ type: 'state_change', data });
    };
    
    // Message handler
    const handleMessage = (message: any) => {
      setLastMessage(message);
      setLastEvent({ type: 'message', data: message });
    };
    
    // Error handler
    const handleError = (errorData: any) => {
      const err = errorData.error || new Error('WebSocket error');
      setError(err);
      setLastEvent({ type: 'error', data: errorData });
    };
    
    // Subscription update handler
    const updateSubscriptions = () => {
      setSubscriptions(client.getSubscriptions());
    };
    
    // Register event handlers
    client.on('state_change', handleStateChange);
    client.on('message', handleMessage);
    client.on('error', handleError);
    client.on('reconnect', () => setLastEvent({ type: 'reconnect', data: null }));
    
    // Set initial state
    setConnectionState(client.getState());
    updateSubscriptions();
    
    // Auto-connect if enabled
    if (options.autoConnect !== false) {
      client.connect();
    }
    
    // Auto-subscribe to channels if provided
    if (options.channels && options.channels.length > 0) {
      for (const channel of options.channels) {
        client.subscribe(channel);
      }
      updateSubscriptions();
    }
    
    // Cleanup on unmount
    return () => {
      client.off('state_change', handleStateChange);
      client.off('message', handleMessage);
      client.off('error', handleError);
    };
  }, [client, options.autoConnect, options.channels]);
  
  // Connection methods
  const connect = useCallback(() => {
    if (client) {
      client.connect();
    }
  }, [client]);
  
  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
    }
  }, [client]);
  
  // Message methods
  const send = useCallback(
    (type: string, payload?: any, sendOptions?: { id?: string; queueIfDisconnected?: boolean }) => {
      if (!client) {
        throw new Error('WebSocket client not initialized');
      }
      return client.send(type, payload, sendOptions);
    },
    [client]
  );
  
  // Subscription methods
  const subscribe = useCallback(
    (channel: string) => {
      if (!client) return false;
      
      const result = client.subscribe(channel);
      setSubscriptions(client.getSubscriptions());
      return result;
    },
    [client]
  );
  
  const unsubscribe = useCallback(
    (channel: string) => {
      if (!client) return false;
      
      const result = client.unsubscribe(channel);
      setSubscriptions(client.getSubscriptions());
      return result;
    },
    [client]
  );
  
  // Return combined state and methods
  return {
    client,
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    subscriptions,
    lastMessage,
    error,
    lastEvent
  };
}

/**
 * React hook for subscribing to WebSocket messages of a specific type
 * @param messageType WebSocket message type to subscribe to
 * @param handler Message handler function
 * @param deps Dependencies array for handler function
 */
export function useWebSocketMessage<T = any>(
  messageType: string,
  handler: (data: T) => void,
  deps: any[] = []
): void {
  // Memoize handler with dependencies
  const handleMessage = useCallback(handler, deps);
  
  useEffect(() => {
    try {
      const client = getWebSocketClient();
      
      // Add message handler
      client.onMessage(messageType, handleMessage);
      
      // Cleanup
      return () => {
        client.offMessage(messageType, handleMessage);
      };
    } catch (error) {
      console.error('Error in useWebSocketMessage:', error);
    }
  }, [messageType, handleMessage]);
}

/**
 * React hook for subscribing to a WebSocket channel
 * @param channel Channel name to subscribe to
 * @param options Subscription options
 * @returns Subscription state
 */
export function useWebSocketChannel(
  channel: string,
  options: {
    autoSubscribe?: boolean;
  } = {}
): {
  isSubscribed: boolean;
  subscribe: () => boolean;
  unsubscribe: () => boolean;
} {
  const { autoSubscribe = true } = options;
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Get client reference
  const clientRef = useRef<WebSocketClient | null>(null);
  
  useEffect(() => {
    try {
      const client = getWebSocketClient();
      clientRef.current = client;
      
      // Check if already subscribed
      setIsSubscribed(client.getSubscriptions().includes(channel));
      
      // Auto-subscribe if enabled
      if (autoSubscribe) {
        const success = client.subscribe(channel);
        setIsSubscribed(success);
      }
      
      // Cleanup
      return () => {
        if (autoSubscribe && client) {
          client.unsubscribe(channel);
        }
      };
    } catch (error) {
      console.error('Error in useWebSocketChannel:', error);
    }
  }, [channel, autoSubscribe]);
  
  // Subscription methods
  const subscribe = useCallback(() => {
    if (!clientRef.current) return false;
    
    const success = clientRef.current.subscribe(channel);
    setIsSubscribed(success);
    return success;
  }, [channel]);
  
  const unsubscribe = useCallback(() => {
    if (!clientRef.current) return false;
    
    const success = clientRef.current.unsubscribe(channel);
    setIsSubscribed(false);
    return success;
  }, [channel]);
  
  return {
    isSubscribed,
    subscribe,
    unsubscribe
  };
}

/**
 * React hook for WebSocket connection state
 * @returns Connection state information
 */
export function useWebSocketConnectionState(): {
  state: ConnectionState;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
} {
  const [state, setState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  
  useEffect(() => {
    try {
      const client = getWebSocketClient();
      
      // Set initial state
      setState(client.getState());
      
      // Listen for state changes
      const handleStateChange = (data: { newState: ConnectionState }) => {
        setState(data.newState);
      };
      
      client.on('state_change', handleStateChange);
      
      // Cleanup
      return () => {
        client.off('state_change', handleStateChange);
      };
    } catch (error) {
      console.error('Error in useWebSocketConnectionState:', error);
    }
  }, []);
  
  // Connection methods
  const connect = useCallback(() => {
    try {
      const client = getWebSocketClient();
      client.connect();
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  }, []);
  
  const disconnect = useCallback(() => {
    try {
      const client = getWebSocketClient();
      client.disconnect();
    } catch (error) {
      console.error('Error disconnecting WebSocket:', error);
    }
  }, []);
  
  return {
    state,
    isConnected: state === ConnectionState.CONNECTED,
    connect,
    disconnect
  };
}

/**
 * React Context Provider for WebSocket
 * @deprecated Use useWebSocket hook directly instead
 * @param url WebSocket URL
 * @param options WebSocket options
 * @returns WebSocket context provider component
 */
export function WebSocketProvider({
  url,
  options = {},
  children
}: {
  url: string;
  options?: WebSocketOptions;
  children: React.ReactNode;
}) {
  // Initialize WebSocket
  useWebSocket(url, {
    ...options,
    autoConnect: true
  });
  
  // Render children
  return <>{children}</>;
}
