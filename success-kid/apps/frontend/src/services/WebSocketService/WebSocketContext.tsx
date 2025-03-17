'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WebSocketClient, webSocketClient, WebSocketEventHandler } from '@/lib/websocket-client';
import { WebSocketEventType } from '@success-kid/types';
import { useNetwork } from '@/services/NetworkService';

/**
 * WebSocket context properties
 */
interface WebSocketContextProps {
  /** Whether WebSocket is connected */
  isConnected: boolean;
  /** Whether WebSocket is reconnecting */
  isReconnecting: boolean;
  /** WebSocket connection ID */
  connectionId: string | null;
  /** Subscribe to a channel */
  subscribe: (channel: string) => void;
  /** Unsubscribe from a channel */
  unsubscribe: (channel: string) => void;
  /** Send a message */
  send: (message: any) => boolean;
  /** Add event listener */
  addEventListener: (event: WebSocketEventType | string, handler: WebSocketEventHandler) => () => void;
  /** Connection error, if any */
  error: Error | null;
}

// Create context for WebSocket service
const WebSocketContext = createContext<WebSocketContextProps | null>(null);

/**
 * WebSocket provider props
 */
interface WebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * WebSocket provider component
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { network } = useNetwork();
  
  // Monitor connection state
  useEffect(() => {
    if (!webSocketClient) return;
    
    const handleOpen = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      setError(null);
    };
    
    const handleClose = () => {
      setIsConnected(false);
      setIsReconnecting(true);
    };
    
    const handleError = (event: any) => {
      setError(new Error('WebSocket connection error'));
    };
    
    const handleConnected = (data: any) => {
      if (data.connectionId) {
        setConnectionId(data.connectionId);
      }
    };
    
    const handleMaxReconnect = () => {
      setIsReconnecting(false);
      setError(new Error('Maximum reconnection attempts reached'));
    };
    
    // Add event listeners
    const removeOpenListener = webSocketClient.on('open', handleOpen);
    const removeCloseListener = webSocketClient.on('close', handleClose);
    const removeErrorListener = webSocketClient.on('error', handleError);
    const removeConnectedListener = webSocketClient.on(WebSocketEventType.CONNECTED, handleConnected);
    const removeMaxReconnectListener = webSocketClient.on('maxReconnectAttemptsReached', handleMaxReconnect);
    
    // Initial state
    setIsConnected(webSocketClient.isConnected());
    setConnectionId(webSocketClient.getConnectionId());
    
    // Connect if not connected
    if (!webSocketClient.isConnected()) {
      webSocketClient.connect();
    }
    
    return () => {
      // Remove event listeners
      removeOpenListener();
      removeCloseListener();
      removeErrorListener();
      removeConnectedListener();
      removeMaxReconnectListener();
    };
  }, []);
  
  // Reconnect when network status changes to online
  useEffect(() => {
    if (!webSocketClient) return;
    
    // If network comes online and WebSocket is not connected, reconnect
    if (network.isOnline && !isConnected && !isReconnecting) {
      webSocketClient.connect();
    }
  }, [network.isOnline, isConnected, isReconnecting]);
  
  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    if (webSocketClient) {
      webSocketClient.subscribe(channel);
    }
  }, []);
  
  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    if (webSocketClient) {
      webSocketClient.unsubscribe(channel);
    }
  }, []);
  
  // Send a message
  const send = useCallback((message: any) => {
    if (webSocketClient) {
      return webSocketClient.send(message);
    }
    return false;
  }, []);
  
  // Add event listener
  const addEventListener = useCallback((event: WebSocketEventType | string, handler: WebSocketEventHandler) => {
    if (webSocketClient) {
      return webSocketClient.on(event, handler);
    }
    // Return no-op if no WebSocket client
    return () => {};
  }, []);
  
  const value: WebSocketContextProps = {
    isConnected,
    isReconnecting,
    connectionId,
    subscribe,
    unsubscribe,
    send,
    addEventListener,
    error,
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use WebSocket service
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
}
