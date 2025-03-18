/**
 * WebSocket Status Indicator
 * 
 * Visual indicator for the current WebSocket connection status.
 */
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/components/providers/EnhancedWebSocketProvider';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  ArrowUpRight, 
  Loader2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Status indicator props
 */
export interface WebSocketStatusIndicatorProps {
  /** Show status text */
  showText?: boolean;
  
  /** Show detailed info on hover */
  showTooltip?: boolean;
  
  /** Component size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional class names */
  className?: string;
}

/**
 * Status map for styling
 */
const STATUS_MAP = {
  connected: {
    icon: Wifi,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    label: 'Connected',
    description: 'Real-time updates are active'
  },
  connecting: {
    icon: Loader2,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    label: 'Connecting',
    description: 'Establishing connection...'
  },
  reconnecting: {
    icon: Loader2,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    label: 'Reconnecting',
    description: 'Attempting to reconnect...'
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-neutral-500',
    bgColor: 'bg-neutral-500',
    label: 'Disconnected',
    description: 'No real-time connection'
  },
  reconnection_failed: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    label: 'Connection Failed',
    description: 'Could not establish a real-time connection'
  },
  fallback: {
    icon: ArrowUpRight,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    label: 'Using Fallback',
    description: 'Using polling for updates instead of WebSocket'
  }
};

/**
 * WebSocket status indicator component
 * @param props Component props
 * @returns React component
 */
export function WebSocketStatusIndicator({
  showText = false,
  showTooltip = true,
  size = 'md',
  className
}: WebSocketStatusIndicatorProps) {
  const { connected, status, usingFallback, getConnectionInfo } = useWebSocket();
  
  // Determine display status
  const displayStatus = usingFallback ? 'fallback' : status;
  
  // Get status display info
  const statusInfo = STATUS_MAP[displayStatus as keyof typeof STATUS_MAP] || STATUS_MAP.disconnected;
  const StatusIcon = statusInfo.icon;
  
  // Size classes
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };
  
  // Get detailed connection info
  const connectionInfo = getConnectionInfo();
  
  // Indicator component
  const indicator = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <StatusIcon 
          className={cn(
            statusInfo.color, 
            sizeClasses[size],
            (status === 'connecting' || status === 'reconnecting') && 'animate-spin'
          )} 
        />
        <span 
          className={cn(
            'absolute -bottom-1 -right-1 rounded-full',
            statusInfo.bgColor,
            size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
          )}
        />
      </div>
      
      {showText && (
        <span className={cn(
          'text-sm font-medium',
          connected ? 'text-green-600 dark:text-green-400' : 
            (usingFallback ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400')
        )}>
          {statusInfo.label}
        </span>
      )}
    </div>
  );
  
  // Wrap in tooltip if needed
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <div className="space-y-2">
              <div className="font-medium">{statusInfo.label}</div>
              <p className="text-sm text-neutral-500">{statusInfo.description}</p>
              
              {/* Show detailed info */}
              {(connected || usingFallback) && (
                <div className="mt-2 text-xs space-y-1">
                  {usingFallback && (
                    <p className="text-blue-500">Using fallback polling mechanism</p>
                  )}
                  {connectionInfo.authenticated && (
                    <p>Authenticated as user: {connectionInfo.userId}</p>
                  )}
                  {connectionInfo.subscriptions?.length > 0 && (
                    <p>Active subscriptions: {connectionInfo.subscriptions.length}</p>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return indicator;
}

export default WebSocketStatusIndicator;
