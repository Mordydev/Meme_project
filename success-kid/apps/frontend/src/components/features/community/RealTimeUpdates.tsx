/**
 * Real-Time Updates Component
 * 
 * Handles WebSocket connections and real-time updates for forum functionality
 */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { MessageSquare, UserPlus, Bell } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';

interface RealTimeUpdatesProps {
  threadId?: string;
  categoryId?: string;
  forumId?: string;
  onNewReply?: (data: any) => void;
  onThreadCreated?: (data: any) => void;
  onPresenceUpdate?: (data: any) => void;
}

/**
 * Real-Time Updates Component
 * 
 * Subscribes to the appropriate WebSocket channels based on props
 * and handles incoming real-time events
 */
export const RealTimeUpdates: React.FC<RealTimeUpdatesProps> = ({
  threadId,
  categoryId,
  forumId,
  onNewReply,
  onThreadCreated,
  onPresenceUpdate
}) => {
  const { isConnected, sendMessage } = useWebSocket();
  const { isAuthenticated, user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<Record<string, boolean>>({});
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'reply.created':
        // New reply in a thread
        if (onNewReply) {
          onNewReply(message.data);
        } else {
          // Show toast notification if handler not provided
          toast({
            title: "New Reply",
            description: "Someone replied to the thread you're viewing",
            action: message.data.threadId ? (
              <a href={`/forum/thread/${message.data.threadId}#reply-${message.data.replyId}`}>
                View
              </a>
            ) : undefined
          });
        }
        break;
        
      case 'thread.created':
        // New thread in category or forum
        if (onThreadCreated) {
          onThreadCreated(message.data);
        } else {
          // Show toast notification if handler not provided
          toast({
            title: "New Thread",
            description: `${message.data.title || 'A new thread'} was created`,
            action: message.data.threadId ? (
              <a href={`/forum/thread/${message.data.threadId}`}>
                View
              </a>
            ) : undefined
          });
        }
        break;
        
      case 'presence.update':
        // User presence update in thread
        if (onPresenceUpdate) {
          onPresenceUpdate(message.data);
        } else if (message.data.threadId === threadId) {
          // Update active users if in thread view
          setActiveUsers(prev => ({
            ...prev,
            [message.data.userId]: message.data.action === 'enter'
          }));
        }
        break;
        
      case 'notification.new':
        // New notification
        toast({
          title: "New Notification",
          description: message.data.type === 'thread_reply' 
            ? "Someone replied to your thread" 
            : "You have a new notification",
          icon: <Bell className="h-4 w-4" />
        });
        break;
    }
  }, [onNewReply, onThreadCreated, onPresenceUpdate, threadId]);
  
  // Set up WebSocket subscriptions
  useEffect(() => {
    if (isConnected) {
      // Subscribe to thread updates
      if (threadId) {
        sendMessage({
          type: 'subscribe.thread',
          data: { threadId }
        });
        
        // Send presence indicator
        if (isAuthenticated) {
          sendMessage({
            type: 'presence.thread',
            data: {
              threadId,
              action: 'enter'
            }
          });
        }
      }
      
      // Subscribe to category updates
      if (categoryId) {
        sendMessage({
          type: 'subscribe.category',
          data: { categoryId }
        });
      }
      
      // Subscribe to forum updates
      if (forumId) {
        sendMessage({
          type: 'subscribe.forum',
          data: { forumId }
        });
      }
      
      // Clean up subscriptions
      return () => {
        // Send presence leave event if in thread
        if (threadId && isAuthenticated) {
          sendMessage({
            type: 'presence.thread',
            data: {
              threadId,
              action: 'leave'
            }
          });
        }
      };
    }
  }, [isConnected, threadId, categoryId, forumId, sendMessage, isAuthenticated]);
  
  // Register message handler
  useEffect(() => {
    if (isConnected) {
      // Add message listener
      window.addEventListener('websocket-message', (e: any) => {
        handleWebSocketMessage(e.detail);
      });
      
      // Clean up
      return () => {
        window.removeEventListener('websocket-message', (e: any) => {
          handleWebSocketMessage(e.detail);
        });
      };
    }
  }, [isConnected, handleWebSocketMessage]);
  
  // Only in thread view, display active users indicator
  if (threadId && Object.keys(activeUsers).filter(id => activeUsers[id]).length > 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
        <UserPlus size={14} />
        <span className="text-sm font-medium">
          {Object.keys(activeUsers).filter(id => activeUsers[id]).length} active
        </span>
      </div>
    );
  }
  
  // No visible UI otherwise
  return null;
};
