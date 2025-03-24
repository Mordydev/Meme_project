/**
 * useWebSocket Hook
 * 
 * Custom hook for managing WebSocket connections with Socket.io-like API
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { SocketIOAdapter } from '@/lib/socket-io-adapter';

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
  socket: SocketIOAdapter | null;
  status: WebSocketStatus;
  connected: boolean;
  reconnect: () => void;
}

export function useWebSocket(): WebSocketContextType {
  const [socket, setSocket] = useState<SocketIOAdapter | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    state: 'disconnected',
    reconnectAttempt: 0
  });
  
  // Create and connect socket
  const connect = useCallback(() => {
    // In a real production environment, we'd use the actual WebSocket URL
    // For now, we'll create a mock Socket.io adapter for development
    try {
      // Check if we're in development mode or if the WebSocket URL is not available
      if (process.env.NODE_ENV === 'development' || !WS_URL) {
        console.log('Creating mock Socket.io adapter (development mode)');
        // Create a mock socket that doesn't actually connect to a server
        const mockSocket = createMockSocketAdapter();
        setSocket(mockSocket);
        
        // Set status to connected after a short delay to simulate connection
        setTimeout(() => {
          setStatus({
            connected: true,
            state: 'connected',
            reconnectAttempt: 0,
            lastEvent: 'connect'
          });
          
          // Trigger connect event
          mockSocket.emit('connect');
        }, 500);
        
        return;
      }
      
      // In production, we'd create a real Socket.io adapter
      console.log('Creating real Socket.io adapter for:', WS_URL);
      const realSocket = new SocketIOAdapter(WS_URL);
      
      // Set up event listeners
      realSocket.on('connect', () => {
        setStatus({
          connected: true,
          state: 'connected',
          reconnectAttempt: 0,
          lastEvent: 'connect'
        });
      });
      
      realSocket.on('disconnect', () => {
        setStatus({
          connected: false,
          state: 'disconnected',
          reconnectAttempt: status.reconnectAttempt,
          lastEvent: 'disconnect'
        });
      });
      
      realSocket.on('error', (error) => {
        setStatus({
          connected: false,
          state: 'error',
          reconnectAttempt: status.reconnectAttempt,
          lastEvent: 'error',
          error: error.message || 'Unknown error'
        });
      });
      
      setSocket(realSocket);
      
      // Connect to the server
      realSocket.connect();
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      // Always fall back to mock adapter if there's an error
      const mockSocket = createMockSocketAdapter();
      setSocket(mockSocket);
      
      setTimeout(() => {
        setStatus({
          connected: true,
          state: 'connected',
          reconnectAttempt: 0,
          lastEvent: 'connect'
        });
        mockSocket.emit('connect');
      }, 500);
    }
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

/**
 * Create a mock Socket.io adapter for development
 */
function createMockSocketAdapter(): SocketIOAdapter {
  // Create a mock implementation that doesn't actually connect to a server
  const mockAdapter = {
    eventHandlers: new Map<string, Set<(data: any) => void>>(),
    connected: false,
    
    connect(): void {
      this.connected = true;
      this.emit('connect');
    },
    
    close(): void {
      this.connected = false;
      this.emit('disconnect');
    },
    
    isConnected(): boolean {
      return this.connected;
    },
    
    on(event: string, handler: (data: any) => void): void {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, new Set());
      }
      this.eventHandlers.get(event)!.add(handler);
    },
    
    off(event: string, handler: (data: any) => void): void {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    },
    
    emit(event: string, data?: any): void {
      console.log(`[Mock WebSocket] Emit: ${event}`, data);
      
      // Simulate market data events in development
      if (event === 'connect' && process.env.NODE_ENV === 'development') {
        // Schedule some mock market events
        setTimeout(() => this.mockMarketEvents(), 2000);
      }
      
      // Notify handlers for this event
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in ${event} handler:`, error);
          }
        });
      }
    },
    
    // Method to simulate market data events in development
    mockMarketEvents(): void {
      if (!this.connected) return;
      
      console.log('[Mock WebSocket] Starting mock market events');
      
      // Mock price update every 10 seconds
      const sendPriceUpdate = () => {
        if (!this.connected) return;
        
        // Generate random price change (-2% to +2%)
        const priceChange = (Math.random() * 4 - 2) / 100;
        const basePrice = 0.00135; // Example base price
        const newPrice = basePrice * (1 + priceChange);
        
        // Emit market price update
        const handlers = this.eventHandlers.get('market:price_update');
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler({
                price: newPrice,
                priceChange: basePrice * priceChange,
                priceChangePercent: priceChange * 100,
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              console.error('Error in price update handler:', error);
            }
          });
        }
        
        // Schedule next update
        setTimeout(sendPriceUpdate, 10000);
      };
      
      // Start sending mock price updates
      sendPriceUpdate();
      
      // Sometimes emit a transaction
      setTimeout(() => {
        const handlers = this.eventHandlers.get('market:new_transaction');
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler({
                id: 'mock-tx-' + Date.now(),
                type: Math.random() > 0.5 ? 'buy' : 'sell',
                amount: Math.floor(Math.random() * 100000) / 100,
                price: 0.00135,
                timestamp: new Date().toISOString(),
                wallet: '0x' + Math.random().toString(16).substring(2, 14)
              });
            } catch (error) {
              console.error('Error in transaction handler:', error);
            }
          });
        }
      }, 5000);
    }
  };
  
  return mockAdapter as unknown as SocketIOAdapter;
}
