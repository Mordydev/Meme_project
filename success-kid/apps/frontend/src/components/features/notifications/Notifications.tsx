/**
 * Real-time notification component
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useEventStore, NotificationEvent } from '@/lib/events';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

interface NotificationProps {
  className?: string;
}

/**
 * Displays real-time notifications in the UI
 */
export function Notifications({ className = '' }: NotificationProps) {
  const { notifications, markAsRead, markAllAsRead } = useEventStore();
  const { connected, isAuthenticated } = useWebSocketContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
    // Update document title if there are unread notifications
    if (count > 0) {
      document.title = `(${count}) Success Kid Community`;
    } else {
      document.title = 'Success Kid Community';
    }
  }, [notifications]);
  
  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'points':
        return '🏆';
      case 'achievement':
        return '🌟';
      case 'content':
        return '📝';
      case 'milestone':
        return '🚀';
      case 'error':
        return '⚠️';
      default:
        return '📣';
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: NotificationEvent) => {
    markAsRead(notification.id);
    // Additional handling based on notification type could be added here
  };
  
  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      // Mark all as read when opening panel
      markAllAsRead();
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Notification bell icon with counter */}
      <button
        className="relative p-2 text-neutral-700 hover:text-primary-600 transition-colors"
        onClick={toggleNotifications}
        aria-label="Notifications"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        
        {/* Connection status indicator */}
        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>
      
      {/* Notifications panel */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md border border-neutral-200 max-h-96 overflow-y-auto z-50">
          <div className="sticky top-0 bg-white p-3 border-b border-neutral-200 flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            <div className="text-xs">
              {connected ? (
                <span className="text-green-600">●</span>
              ) : (
                <span className="text-red-600">●</span>
              )} 
              {connected ? 'Connected' : 'Disconnected'}
              {isAuthenticated && connected ? ' (Authenticated)' : ''}
            </div>
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-neutral-500">
              No notifications yet
            </div>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li 
                  key={notification.id}
                  className={`p-3 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer ${!notification.read ? 'bg-primary-50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="mr-2 text-lg">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {formatRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {notifications.length > 0 && (
            <div className="p-2 text-center border-t border-neutral-200">
              <button 
                className="text-xs text-primary-600 hover:text-primary-800"
                onClick={() => useEventStore.getState().clearNotifications()}
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;