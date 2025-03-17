/**
 * React hook for WebSocket integration
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  websocketClient, 
  WebSocketMessage, 
  ConnectionState, 
  ConnectionEvent 
} from '@/lib/websocket-client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Connection status with detailed state information
 */
export interface ConnectionStatus {
  connected: boolean;
  state: ConnectionState;
  connectionId: string | null;
  latency: number;
  reconnectAttempt: number | null;
  lastStateChange: number;
  error: Error | null;
}

/**
 * Default connection status
 */
const DEFAULT_STATUS: ConnectionStatus = {
  connected: false,
  state: ConnectionState.DISCONNECTED,
  connectionId: null,
  latency: 0,
  reconnectAttempt: null,
  lastStateChange: Date.now(),
  error: null
};

/**
 * Hook for WebSocket integration in React components
 * @returns WebSocket utilities and connection status
 */
export function useWebSocket() {
  // Track connection status
  const [status, setStatus] = useState<ConnectionStatus>(DEFAULT_STATUS);
  
  // Get authentication state
  const { user, isLoaded, getToken } = useAuth();
  
  // Keep track of subscriptions to prevent memory leaks
  const subscriptions = useRef<Array<() => void>>([]);
  
  // Initialize connection when auth state is loaded
  useEffect(() => {
    if (!isLoaded) return;
    
    // Configure WebSocket client with auth token getter
    websocketClient.config = {
      ...websocketClient.config,
      getAuthToken: getToken,
      refreshAuthToken: async () => {
        try {
          // Trigger token refresh
          await user?.reload();
          return getToken();
        } catch (error) {
          console.error('Error refreshing token:', error);
          return null;
        }
      }
    };
    
    // Connect to WebSocket
    websocketClient.connect();
    
    // Subscribe to connection changes
    const unsubscribe = websocketClient.onConnectionChange(handleConnectionChange);
    subscriptions.current.push(unsubscribe);
    
    // Cleanup on unmount
    return () => {
      // Unsubscribe from all event handlers
      subscriptions.current.forEach(unsub => unsub());
      subscriptions.current = [];
    };
  }, [isLoaded, user, getToken]);
  
  /**
   * Handle connection status changes
   */
  const handleConnectionChange = useCallback((event: ConnectionEvent) => {
    setStatus({
      connected: event.state === ConnectionState.CONNECTED,
      state: event.state,
      connectionId: event.connectionId || null,
      latency: websocketClient.getLatency(),
      reconnectAttempt: event.reconnectAttempt || null,
      lastStateChange: event.timestamp,
      error: event.error || null
    });
  }, []);
  
  /**
   * Subscribe to a specific message type
   */
  const subscribe = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    const unsubscribe = websocketClient.subscribe(type, handler);
    subscriptions.current.push(unsubscribe);
    return unsubscribe;
  }, []);
  
  /**
   * Send a message to the server
   */
  const send = useCallback((message: WebSocketMessage) => {
    return websocketClient.send(message);
  }, []);
  
  /**
   * Force reconnection to the server
   */
  const reconnect = useCallback(() => {
    websocketClient.connect();
  }, []);
  
  /**
   * Update authentication token
   */
  const updateAuthToken = useCallback(() => {
    getToken().then(token => {
      if (token) {
        websocketClient.connect(token);
      }
    });
  }, [getToken]);
  
  return {
    // Connection status
    status,
    
    // Core functionality
    subscribe,
    send,
    reconnect,
    updateAuthToken,
    
    // Authentication status
    isAuthenticated: !!user, 
    userId: user?.id
  };
}

export default useWebSocket;