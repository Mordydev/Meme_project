/**
 * WebSocket Provider Component
 * 
 * Provides WebSocket functionality to the application with real-time notifications
 * and connection status monitoring.
 */
'use client';

import React, { createContext, useContext } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

// Define the WebSocket context type based on our hook
interface WebSocketContextType {
  socket: WebSocket | null;
  status: {
    connected: boolean;
    state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
    lastEvent?: string;
    reconnectAttempt: number;
    error?: string;
  };
  connected: boolean;
  reconnect: () => void;
}

// Create WebSocket context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * WebSocket Provider Component for application-wide WebSocket support
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  // Use our WebSocket hook
  const websocket = useWebSocket();
  
  return (
    <WebSocketContext.Provider value={websocket}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom hook to use WebSocket context
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
}
