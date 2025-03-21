'use client';

import React from 'react';
import { useWebSocketContext } from '../providers/WebSocketProvider';
import { motion } from 'framer-motion';

/**
 * WebSocket Status Indicator
 * Shows the current status of the WebSocket connection
 */
export function WebSocketStatus() {
  const { status, reconnect } = useWebSocketContext();
  
  // Status colors
  const statusColors = {
    'disconnected': 'bg-amber-500',
    'connecting': 'bg-blue-500',
    'connected': 'bg-green-500',
    'reconnecting': 'bg-blue-500',
    'error': 'bg-red-500'
  };
  
  // Status messages
  const statusMessages = {
    'disconnected': 'Connection lost',
    'connecting': 'Connecting...',
    'connected': 'Connected',
    'reconnecting': 'Reconnecting...',
    'error': 'Connection error'
  };
  
  // If connected, don't show anything
  if (status.connected) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow-lg p-3 flex items-center space-x-3"
    >
      <div className={`h-3 w-3 rounded-full ${statusColors[status.state]}`} />
      <span className="text-sm">{statusMessages[status.state]}</span>
      
      {(status.state === 'disconnected' || status.state === 'error') && (
        <button
          onClick={reconnect}
          className="text-sm text-primary hover:underline"
        >
          Reconnect
        </button>
      )}
    </motion.div>
  );
}
