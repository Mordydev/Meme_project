/**
 * React hook for WebSocket/SSE integration
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface UseWebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * Hook for WebSocket/SSE integration in React components
 * @param url The URL to connect to
 * @param options Configuration options
 * @returns WebSocket/SSE utilities
 */
export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const { 
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options;
  
  // Establish connection
  const connect = useCallback(() => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Update status
    setConnectionStatus('connecting');
    
    try {
      // Create new connection
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      
      // Event handlers
      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
      };
      
      eventSource.onmessage = (event) => {
        setLastMessage(event.data);
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if not exceeding maximum attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Error establishing EventSource connection:', error);
      setConnectionStatus('disconnected');
    }
  }, [url, reconnectInterval, maxReconnectAttempts, reconnectAttempts]);
  
  // Connect when component mounts
  useEffect(() => {
    connect();
    
    // Cleanup when component unmounts
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);
  
  // Send a message (not supported in SSE, but included for API compatibility)
  const send = useCallback((message: string | object) => {
    console.warn('Send method is not supported with Server-Sent Events. This is a one-way channel from server to client.');
    return false;
  }, []);
  
  return {
    isConnected,
    connectionStatus,
    lastMessage,
    reconnectAttempts,
    send
  };
}

export default useWebSocket;