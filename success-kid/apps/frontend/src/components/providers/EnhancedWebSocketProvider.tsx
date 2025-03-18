/**
 * Enhanced WebSocket Provider
 * 
 * Provider component for the enhanced WebSocket client with optimized
 * performance, resilient connections, and fallback mechanisms.
 */
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WebSocketEventType, WebSocketMessage } from '@success-kid/types';
import { enhancedWebSocketClient } from '@/lib/enhanced-websocket-client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Context type for WebSocket provider
 */
type EnhancedWebSocketContextType = {
  /** Whether socket is connected */
  connected: boolean;
  
  /** Connection status text */
  status: string;
  
  /** Subscribe to specific message type */
  subscribe: (type: string, handler: (message: any) => void) => () => void;
  
  /** Send a message to the server */
  send: (message: WebSocketMessage, priority?: number) => boolean;
  
  /** Subscribe to a channel */
  subscribeToChannel: (channel: string) => void;
  
  /** Unsubscribe from a channel */
  unsubscribeFromChannel: (channel: string) => void;
  
  /** Whether client is authenticated */
  isAuthenticated: boolean;
  
  /** Whether fallback is active */
  usingFallback: boolean;
  
  /** Get connection information */
  getConnectionInfo: () => any;
};

// Create context with default values
const EnhancedWebSocketContext = createContext<EnhancedWebSocketContextType>({
  connected: false,
  status: 'disconnected',
  subscribe: () => () => {},
  send: () => false,
  subscribeToChannel: () => {},
  unsubscribeFromChannel: () => {},
  isAuthenticated: false,
  usingFallback: false,
  getConnectionInfo: () => ({})
});

// Hook to use the WebSocket context
export const useWebSocket = () => useContext(EnhancedWebSocketContext);

// Provider props interface
export interface EnhancedWebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * Enhanced WebSocket provider component
 * @param props Component props
 * @returns Provider component
 */
export function EnhancedWebSocketProvider({ children }: EnhancedWebSocketProviderProps) {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [usingFallback, setUsingFallback] = useState(false);
  const { user, isLoaded } = useAuth();
  const isAuthenticated = !!enhancedWebSocketClient?.isUserAuthenticated();
  
  // Connect to WebSocket when component mounts and auth state changes
  useEffect(() => {
    if (!enhancedWebSocketClient || !isLoaded) return;
    
    // Connect with authentication if possible
    if (user?.id) {
      enhancedWebSocketClient.connect(user.id);
    } else {
      enhancedWebSocketClient.connect();
    }
    
    // Subscribe to connection changes
    const unsubscribe = enhancedWebSocketClient.onConnectionChange((connected, status) => {
      setConnected(connected);
      setStatus(status || (connected ? 'connected' : 'disconnected'));
      setUsingFallback(enhancedWebSocketClient?.isFallbackActive() || false);
    });
    
    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, [isLoaded, user?.id]);
  
  // Subscribe to a specific message type
  const subscribe = useCallback((type: string, handler: (message: any) => void) => {
    if (!enhancedWebSocketClient) return () => {};
    return enhancedWebSocketClient.on(type, handler);
  }, []);
  
  // Send a message to the server
  const send = useCallback((message: WebSocketMessage, priority: number = 0): boolean => {
    if (!enhancedWebSocketClient) return false;
    return enhancedWebSocketClient.send(message, priority);
  }, []);
  
  // Subscribe to a channel
  const subscribeToChannel = useCallback((channel: string) => {
    if (!enhancedWebSocketClient) return;
    enhancedWebSocketClient.subscribe(channel);
  }, []);
  
  // Unsubscribe from a channel
  const unsubscribeFromChannel = useCallback((channel: string) => {
    if (!enhancedWebSocketClient) return;
    enhancedWebSocketClient.unsubscribe(channel);
  }, []);
  
  // Get connection information
  const getConnectionInfo = useCallback(() => {
    if (!enhancedWebSocketClient) return {};
    return enhancedWebSocketClient.getConnectionInfo();
  }, []);
  
  // Create the value object for the context
  const value: EnhancedWebSocketContextType = {
    connected,
    status,
    subscribe,
    send,
    subscribeToChannel,
    unsubscribeFromChannel,
    isAuthenticated,
    usingFallback,
    getConnectionInfo
  };
  
  // Render the provider with the value
  return (
    <EnhancedWebSocketContext.Provider value={value}>
      {children}
    </EnhancedWebSocketContext.Provider>
  );
}

export default EnhancedWebSocketProvider;
