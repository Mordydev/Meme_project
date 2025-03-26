'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing WebSocket connections
 * Handles connection, reconnection, and message sending
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<any[]>([]);
  
  // Maximum reconnection attempts
  const MAX_RECONNECT_ATTEMPTS = 5;
  // Base delay for reconnection (will be multiplied by reconnection attempt)
  const RECONNECT_DELAY = 2000;
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      // In a real implementation, this would use environment variables
      // const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.successkid.community/ws';
      
      // For development, we'll use a mock implementation
      const wsUrl = 'wss://mock-websocket-server.com';
      
      // Connect to WebSocket
      // NOTE: In a real implementation, this would actually connect to the WebSocket server
      // For now, we'll simulate a connection with setTimeout
      setTimeout(() => {
        // Simulate successful connection
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        
        // Process any queued messages
        if (messageQueueRef.current.length > 0) {
          console.log('Processing queued messages:', messageQueueRef.current);
          messageQueueRef.current = [];
        }
        
        // Simulate incoming messages periodically (for development only)
        simulateIncomingMessages();
      }, 1000);
      
      /* 
      // This would be the real implementation
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        webSocketRef.current = ws;
        
        // Process any queued messages
        if (messageQueueRef.current.length > 0) {
          messageQueueRef.current.forEach(message => {
            ws.send(JSON.stringify(message));
          });
          messageQueueRef.current = [];
        }
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        webSocketRef.current = null;
        
        // Attempt to reconnect if not manually closed
        attemptReconnect();
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Dispatch message to listeners
          window.dispatchEvent(new CustomEvent('websocket-message', {
            detail: message
          }));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      */
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnecting(false);
      attemptReconnect();
    }
  }, [isConnected, isConnecting]);
  
  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Maximum WebSocket reconnection attempts reached');
      return;
    }
    
    // Clear any existing reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    
    // Calculate delay with exponential backoff
    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
    
    // Set up reconnect timer
    reconnectTimerRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connect();
    }, delay);
  }, [connect]);
  
  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (!isConnected) {
      // Queue the message to be sent when connection is established
      messageQueueRef.current.push(message);
      
      // Try to connect if not already connecting
      if (!isConnecting) {
        connect();
      }
      
      return;
    }
    
    // In a real implementation, this would send the message to the WebSocket
    // if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
    //   webSocketRef.current.send(JSON.stringify(message));
    // }
    
    // For mock implementation, just log the message
    console.log('WebSocket message sent:', message);
  }, [isConnected, isConnecting, connect]);
  
  // Close the WebSocket connection
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    
    // Use functional updates to avoid dependency on current state
    setIsConnected(() => false);
    setIsConnecting(() => false);
  }, []);
  
  // Simulate incoming messages (for development only)
  const simulateIncomingMessages = () => {
    // Simulate a notification after a delay
    setTimeout(() => {
      if (Math.random() > 0.7) {
        // Simulate a new notification
        window.dispatchEvent(new CustomEvent('websocket-message', {
          detail: {
            type: 'notification.new',
            data: {
              type: Math.random() > 0.5 ? 'thread_reply' : 'mention',
              userId: 'user123',
              message: 'You have a new notification'
            }
          }
        }));
      }
    }, 10000 + Math.random() * 15000);
  };
  
  // Connect when component mounts
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      // Inline cleanup logic instead of using disconnect function
      // to avoid dependency cycle
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, [connect]);
  
  return {
    isConnected,
    isConnecting,
    sendMessage,
    disconnect
  };
}
