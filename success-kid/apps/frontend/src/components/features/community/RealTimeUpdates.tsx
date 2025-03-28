/**
 * Real-Time Updates Component
 * 
 * Handles WebSocket connections and real-time updates for community functionality
 */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, UserPlus, Bell, ThumbsUp } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';

interface RealTimeUpdatesProps {
  postId?: string;
  categoryId?: string;
  onNewComment?: (data: any) => void;
  onPostCreated?: (data: any) => void;
  onEngagementUpdate?: (data: any) => void;
  onPointsEarned?: (data: any) => void;
}

/**
 * Real-Time Updates Component
 * 
 * Subscribes to the appropriate WebSocket channels based on props
 * and handles incoming real-time events for the community page
 */
export function RealTimeUpdates({
  postId,
  categoryId,
  onNewComment,
  onPostCreated,
  onEngagementUpdate,
  onPointsEarned
}: RealTimeUpdatesProps) {
  const { toast } = useToast();
  const { isConnected, sendMessage } = useWebSocket();
  const { isAuthenticated, user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<Record<string, boolean>>({});
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'comment.created':
        // New comment on a post
        if (onNewComment) {
          onNewComment(message.data);
        } else {
          // Show toast notification if handler not provided
          toast({
            title: "New Comment",
            description: "Someone commented on the post you're viewing",
            action: message.data.postId ? (
              <a href={`/community/post/${message.data.postId}#comment-${message.data.commentId}`}>
                View
              </a>
            ) : undefined
          });
        }
        break;
        
      case 'post.created':
        // New post in category
        if (onPostCreated) {
          onPostCreated(message.data);
        } else {
          // Show toast notification if handler not provided
          toast({
            title: "New Post",
            description: `${message.data.title || 'A new post'} was created`,
            action: message.data.postId ? (
              <a href={`/community/post/${message.data.postId}`}>
                View
              </a>
            ) : undefined
          });
        }
        break;
        
      case 'engagement.update':
        // Engagement update (votes, comments, etc.)
        if (onEngagementUpdate) {
          onEngagementUpdate(message.data);
        }
        break;
        
      case 'points.earned':
        // Points earned notification
        if (onPointsEarned) {
          onPointsEarned(message.data);
        } else {
          toast({
            title: "Points Earned!",
            description: `You earned ${message.data.points} Success Points for ${message.data.action}`,
            icon: <ThumbsUp className="h-4 w-4" />
          });
        }
        break;
        
      case 'presence.update':
        // User presence update in post view
        if (message.data.postId === postId) {
          // Update active users if in post view
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
          description: message.data.type === 'post_comment' 
            ? "Someone commented on your post" 
            : "You have a new notification",
          icon: <Bell className="h-4 w-4" />
        });
        break;
    }
  }, [onNewComment, onPostCreated, onEngagementUpdate, onPointsEarned, postId, toast]);
  
  // Set up WebSocket subscriptions
  useEffect(() => {
    if (isConnected) {
      // Subscribe to post updates
      if (postId) {
        sendMessage({
          type: 'subscribe.post',
          data: { postId }
        });
        
        // Send presence indicator
        if (isAuthenticated) {
          sendMessage({
            type: 'presence.post',
            data: {
              postId,
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
      
      // Subscribe to community feed updates
      sendMessage({
        type: 'subscribe.community',
        data: {}
      });
      
      // Clean up subscriptions
      return () => {
        // Send presence leave event if in post view
        if (postId && isAuthenticated) {
          sendMessage({
            type: 'presence.post',
            data: {
              postId,
              action: 'leave'
            }
          });
        }
      };
    }
  }, [isConnected, postId, categoryId, sendMessage, isAuthenticated]);
  
  // Register message handler
  useEffect(() => {
    if (isConnected) {
      // Create a stable reference to the handler function
      const messageListener = (e: any) => {
        handleWebSocketMessage(e.detail);
      };
      
      // Add message listener
      window.addEventListener('websocket-message', messageListener);
      
      // Clean up
      return () => {
        window.removeEventListener('websocket-message', messageListener);
      };
    }
  }, [isConnected, handleWebSocketMessage]);
  
  // Only in post view, display active users indicator
  if (postId && Object.keys(activeUsers).filter(id => activeUsers[id]).length > 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 z-30">
        <UserPlus size={14} />
        <span className="text-sm font-medium">
          {Object.keys(activeUsers).filter(id => activeUsers[id]).length} viewing
        </span>
      </div>
    );
  }
  
  // No visible UI otherwise
  return null;
};
