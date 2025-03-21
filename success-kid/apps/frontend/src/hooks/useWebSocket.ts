/**
 * useWebSocket Hook
 * 
 * Custom hook for managing WebSocket connections
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

// Set the WebSocket URL based on environment
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws` : '');

interface WebSocketStatus {
  connected: boolean;
  state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lastEvent?: string;
  reconnectAttempt: number;
  error?: string;
}

interface WebSocketContextType {
  socket: WebSocket | null;
  status: WebSocketStatus;
  connected: boolean;
  reconnect: () => void;
}

export function useWebSocket(): WebSocketContextType {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    state: 'disconnected',
    reconnectAttempt: 0
  });
  
  // For now, we'll create a dummy WebSocket implementation
  // This can be replaced with actual WebSocket connection in production
  const connect = useCallback(() => {
    // In production, this would create a real WebSocket connection
    console.log('WebSocket: Creating mock connection');
    
    // Update status to connecting
    setStatus({
      connected: false,
      state: 'connecting',
      reconnectAttempt: status.reconnectAttempt
    });
    
    // Simulate connection
    setTimeout(() => {
      // Create a mock socket
      // In production, this would be a real WebSocket
      const mockSocket = {
        send: (data: string) => {
          console.log('WebSocket sent:', data);
        },
        close: () => {
          console.log('WebSocket closed');
          setStatus({
            connected: false,
            state: 'disconnected',
            reconnectAttempt: 0
          });
          setSocket(null);
        }
      } as unknown as WebSocket;
      
      setSocket(mockSocket);
      setStatus({
        connected: true,
        state: 'connected',
        reconnectAttempt: 0
      });
    }, 500);
  }, [status.reconnectAttempt]);
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      // Cleanup
      if (socket) {
        socket.close();
      }
    };
  }, []);
  
  // Reconnect function
  const reconnect = useCallback(() => {
    if (socket) {
      socket.close();
    }
    
    setStatus(prev => ({
      ...prev,
      state: 'reconnecting',
      reconnectAttempt: prev.reconnectAttempt + 1
    }));
    
    connect();
  }, [socket, connect]);
  
  return {
    socket,
    status,
    connected: status.connected,
    reconnect
  };
}
