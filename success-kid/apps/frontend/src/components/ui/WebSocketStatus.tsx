/**
 * WebSocket Status Indicator
 * 
 * Displays the current WebSocket connection status and provides
 * controls for reconnection.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocket, ConnectionStatus } from '@/hooks/useWebSocket';
import { ConnectionState } from '@/lib/websocket-client';
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Loader2
} from 'lucide-react';

type StatusVariant = 'minimal' | 'compact' | 'full';

interface WebSocketStatusProps {
  variant?: StatusVariant;
  showControls?: boolean;
  className?: string;
}

/**
 * WebSocket Status Indicator Component
 */
export function WebSocketStatus({
  variant = 'compact',
  showControls = true,
  className = ''
}: WebSocketStatusProps) {
  const { status, reconnect } = useWebSocket();
  const [visible, setVisible] = useState(false);
  
  // Show status briefly when it changes
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      // Only hide when connected
      if (status.connected) {
        setVisible(false);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [status.connected, status.state]);
  
  // Always show for non-connected states
  useEffect(() => {
    if (!status.connected) {
      setVisible(true);
    }
  }, [status.connected]);
  
  // Hide after manual reconnect attempt
  const handleReconnect = () => {
    reconnect();
    
    // Show "reconnecting" feedback
    setVisible(true);
  };
  
  if (variant === 'minimal' && !visible) {
    return null;
  }
  
  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${getStatusColorClass(status.state)} ${className}`}
    >
      {getStatusIcon(status.state)}
      
      {(variant === 'compact' || variant === 'full') && (
        <span className="whitespace-nowrap">{getStatusText(status.state)}</span>
      )}
      
      {variant === 'full' && !status.connected && status.error && (
        <span className="text-xs ml-1 max-w-xs truncate">
          {status.error.message}
        </span>
      )}
      
      {showControls && !status.connected && (
        <button 
          onClick={handleReconnect}
          className="ml-2 p-1 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/30"
          aria-label="Reconnect"
          title="Reconnect"
        >
          <RefreshCw size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * Get status icon based on connection state
 */
function getStatusIcon(state: ConnectionState) {
  switch (state) {
    case ConnectionState.CONNECTED:
      return <CheckCircle2 size={16} />;
    
    case ConnectionState.CONNECTING:
    case ConnectionState.RECONNECTING:
      return <Loader2 size={16} className="animate-spin" />;
    
    case ConnectionState.ERROR:
      return <AlertCircle size={16} />;
    
    case ConnectionState.PERMANENTLY_DISCONNECTED:
      return <WifiOff size={16} />;
    
    case ConnectionState.DISCONNECTED:
      return <Wifi size={16} className="opacity-50" />;
    
    default:
      return <AlertTriangle size={16} />;
  }
}

/**
 * Get status text based on connection state
 */
function getStatusText(state: ConnectionState): string {
  switch (state) {
    case ConnectionState.CONNECTED:
      return 'Connected';
    
    case ConnectionState.CONNECTING:
      return 'Connecting...';
    
    case ConnectionState.RECONNECTING:
      return 'Reconnecting...';
    
    case ConnectionState.ERROR:
      return 'Connection error';
    
    case ConnectionState.PERMANENTLY_DISCONNECTED:
      return 'Connection failed';
    
    case ConnectionState.DISCONNECTED:
      return 'Disconnected';
    
    default:
      return 'Unknown state';
  }
}

/**
 * Get status color class based on connection state
 */
function getStatusColorClass(state: ConnectionState): string {
  switch (state) {
    case ConnectionState.CONNECTED:
      return 'bg-green-600/20 text-green-400 border border-green-500/20';
    
    case ConnectionState.CONNECTING:
    case ConnectionState.RECONNECTING:
      return 'bg-blue-600/20 text-blue-400 border border-blue-500/20';
    
    case ConnectionState.ERROR:
      return 'bg-red-600/20 text-red-400 border border-red-500/20';
    
    case ConnectionState.PERMANENTLY_DISCONNECTED:
      return 'bg-amber-600/20 text-amber-400 border border-amber-500/20';
    
    case ConnectionState.DISCONNECTED:
      return 'bg-neutral-600/20 text-neutral-400 border border-neutral-500/20';
    
    default:
      return 'bg-neutral-600/20 text-neutral-400 border border-neutral-500/20';
  }
}
