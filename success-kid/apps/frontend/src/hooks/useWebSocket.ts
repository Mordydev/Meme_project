/**
 * React hook for WebSocket integration
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { websocketClient, WebSocketMessage } from '@/lib/websocket-client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook for WebSocket integration in React components
 * @returns WebSocket utilities
 */
export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const { user, isLoaded } = useAuth();
  const token = user?.id; // Use user ID as token for authenticated connections
  
  // Connect to WebSocket when component mounts or auth state changes
  useEffect(() => {
    if (!isLoaded) return;
    
    // Connect with or without authentication
    if (token) {
      websocketClient.connect(token);
    } else {
      websocketClient.connect();
    }
    
    // Subscribe to connection changes
    const unsubscribe = websocketClient.onConnectionChange(setConnected);
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [isLoaded, token]);
  
  // Subscribe to a specific message type
  const subscribe = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    return websocketClient.subscribe(type, handler);
  }, []);
  
  // Send a message to the server
  const send = useCallback((message: WebSocketMessage) => {
    websocketClient.send(message);
  }, []);
  
  return {
    connected,
    subscribe,
    send,
    isAuthenticated: !!token // Indicate if the connection is authenticated
  };
}

export default useWebSocket;