/**
 * WebSocket Status Component
 * Displays the current status of the WebSocket connection and allows testing
 */
'use client';

import React, { useState } from 'react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WebSocketStatus() {
  const { connected, isAuthenticated, send } = useWebSocketContext();
  const [pingResponse, setPingResponse] = useState<string | null>(null);
  
  // Send a ping message to test the connection
  const handlePing = () => {
    setPingResponse('Waiting for response...');
    
    // Send ping message
    send({ type: 'ping' });
    
    // Set up listener for pong response
    const unsubscribe = useWebSocketContext().subscribe('pong', () => {
      setPingResponse('Received pong response! Connection is working properly.');
      
      // Clean up listener after receiving response
      setTimeout(() => {
        unsubscribe();
      }, 100);
    });
    
    // Timeout in case no response is received
    setTimeout(() => {
      if (pingResponse === 'Waiting for response...') {
        setPingResponse('No response received. Connection might be having issues.');
      }
    }, 5000);
  };
  
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">WebSocket Status</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>
            {connected ? 'Connected' : 'Disconnected'}
            {connected && isAuthenticated && ' (Authenticated)'}
          </span>
        </div>
        
        {pingResponse && (
          <div className="text-sm mt-2 p-2 bg-gray-100 rounded">
            {pingResponse}
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <Button 
          onClick={handlePing}
          disabled={!connected}
          size="sm"
        >
          Test Connection
        </Button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>This component demonstrates the real-time WebSocket functionality.</p>
        <p className="mt-1">The WebSocket connection is used for real-time notifications, updates, and interactive features.</p>
      </div>
    </Card>
  );
}

export default WebSocketStatus;