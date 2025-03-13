/**
 * WebSocket provider for global WebSocket state
 */
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { websocketClient, WebSocketMessage } from '@/lib/websocket-client';
import { useAuth } from '@/hooks/useAuth';
import { initializeEvents } from '@/lib/events';

// Define the context type
type WebSocketContextType = {
  connected: boolean;
  subscribe: (type: string, handler: (message: WebSocketMessage) => void) => () => void;
  send: (message: WebSocketMessage) => void;
  isAuthenticated: boolean;
};

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  subscribe: () => () => {},
  send: () => {},
  isAuthenticated: false
});

// Hook to use the WebSocket context
export const useWebSocketContext = () => useContext(WebSocketContext);

// Provider component properties
export interface WebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * WebSocket provider component
 * @param props Component properties
 * @returns Provider component
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [connected, setConnected] = useState(false);
  const { user, isLoaded } = useAuth();
  const isAuthenticated = !!user?.id;
  
  // Connect to WebSocket when component mounts and auth state changes
  useEffect(() => {
    if (!isLoaded) return;
    
    // Connect with authentication if possible
    if (user?.id) {
      websocketClient.connect(user.id);
    } else {
      websocketClient.connect();
    }
    
    // Subscribe to connection changes
    const unsubscribe = websocketClient.onConnectionChange(setConnected);
    
    // Initialize event system
    initializeEvents();
    
    // Disconnect on unmount (though this is a root provider, so rarely unmounts)
    return () => {
      unsubscribe();
    };
  }, [isLoaded, user?.id]);
  
  // Subscribe to a specific message type
  const subscribe = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    return websocketClient.subscribe(type, handler);
  }, []);
  
  // Send a message to the server
  const send = useCallback((message: WebSocketMessage) => {
    websocketClient.send(message);
  }, []);
  
  // Create the value object for the context
  const value: WebSocketContextType = {
    connected,
    subscribe,
    send,
    isAuthenticated
  };
  
  // Render the provider with the value
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketProvider;