/**
 * WebSocket Provider Component
 * 
 * Provides WebSocket functionality to the application with real-time notifications
 * and connection status monitoring.
 */
'use client';

import React, { useEffect } from 'react';
import { NotificationSystem } from '../features/NotificationSystem';
import { WebSocketStatus } from '../ui/WebSocketStatus';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WebSocketProviderProps {
  children: React.ReactNode;
  showConnectionStatus?: boolean;
  showNotifications?: boolean;
}

/**
 * WebSocket Provider Component for application-wide WebSocket support
 */
export function WebSocketProvider({
  children,
  showConnectionStatus = true,
  showNotifications = true
}: WebSocketProviderProps) {
  const { status, reconnect } = useWebSocket();
  
  // Reconnect when app regains focus
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleFocus = () => {
      // If not connected and not currently reconnecting, attempt reconnect
      if (
        status.state !== 'connected' && 
        status.state !== 'connecting' && 
        status.state !== 'reconnecting'
      ) {
        reconnect();
      }
    };
    
    // Add event listeners
    window.addEventListener('focus', handleFocus);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [status.state, reconnect]);
  
  return (
    <>
      {children}
      
      {showNotifications && <NotificationSystem />}
      
      {showConnectionStatus && !status.connected && (
        <div className="fixed bottom-4 left-4 z-50">
          <WebSocketStatus />
        </div>
      )}
    </>
  );
}
