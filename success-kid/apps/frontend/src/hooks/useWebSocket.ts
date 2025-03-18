/**
 * useWebSocket Hook
 * 
 * Custom hook for managing WebSocket connections
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

// Set the WebSocket URL based on environment
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws` : '');

interface WebSocketMessage {
  type: string;
  data: any;
}

/**
 * Custom hook for managing WebSocket connections
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const { isAuthenticated, getAuthToken } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get auth token if authenticated
      let url = WS_URL;
      if (isAuthenticated) {
        const token = await getAuthToken();
        if (token) {
          url = `${WS_URL}?token=${token}`;
        }
      }
      
      // Create WebSocket connection
      const ws = new WebSocket(url);
      wsRef.current = ws;
      
      // Connection established
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
        
        // Ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };
      
      // Connection closed
      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        
        // Attempt to reconnect
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          reconnectAttemptRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current - 1), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`);
          
          setTimeout(() => {
            connect();
          }, delay);
        }
      };
      
      // Error
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      // Receive message
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle pong response
          if (message.type === 'pong') {
            return;
          }
          
          // Set last message received
          setLastMessage(message);
          
          // Dispatch event for other components to listen to
          window.dispatchEvent(
            new CustomEvent('websocket-message', { detail: message })
          );
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [isAuthenticated, getAuthToken]);
  
  // Send message to WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, unable to send message');
    }
  }, []);
  
  // Connect on mount or when auth changes
  useEffect(() => {
    connect();
    
    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
  
  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}
