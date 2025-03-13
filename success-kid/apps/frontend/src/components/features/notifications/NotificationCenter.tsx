/**
 * Notification Center Component
 * Displays a list of notifications with filtering and controls
 */
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Bell, Settings, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType, Notification } from '@/types';
import { Button, Badge, Card } from '@/components/ui';
import { useRouter } from 'next/navigation';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: NotificationType;
}

/**
 * Notification Center Component
 */
export function NotificationCenter({ 
  isOpen, 
  onClose, 
  initialFilter = 'all' 
}: NotificationCenterProps) {
  // Router for navigation
  const router = useRouter();
  
  // Get notifications
  const { 
    notifications, 
    groupedNotifications,
    unread, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    handleAction,
    getFilteredNotifications,
    getUnreadCount
  } = useNotifications();
  
  // State for active filter
  const [activeFilter, setActiveFilter] = useState<NotificationType>(initialFilter);
  
  // Get filtered notifications
  const filteredNotifications = useMemo(() => 
    getFilteredNotifications(activeFilter), 
    [getFilteredNotifications, activeFilter]
  );
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead([notification.id]);
    
    // Handle first action if available
    if (notification.actions && notification.actions.length > 0) {
      const actionResult = handleAction(notification, 0);
      if (actionResult?.url) {
        router.push(actionResult.url);
        onClose();
      }
    }
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'achievement':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'social':
        return <Bell className="w-4 h-4 text-primary-500" />;
      case 'system':
        return <Info className="w-4 h-4 text-primary-500" />;
      case 'content':
        return <CheckCircle className="w-4 h-4 text-primary-500" />;
      case 'market':
        return <CheckCircle className="w-4 h-4 text-secondary-500" />;
      case 'points':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-500" />;
    }
  };
  
  // Format notification date
  const formatNotificationDate = (date: string) => {
    const notificationDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if notification is from today
    if (notificationDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if notification is from yesterday
    if (notificationDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise, return the date
    return notificationDate.toLocaleDateString();
  };
  
  // Format notification time
  const formatNotificationTime = (date: string) => {
    const notificationDate = new Date(date);
    return notificationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Render notification center
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 right-4 w-full max-w-md max-h-[80vh] z-50"
        >
          <Card className="shadow-xl w-full overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-semibold">Notifications</h2>
                {unread > 0 && (
                  <Badge 
                    variant="primary" 
                    count={unread} 
                    className="ml-2" 
                    animate
                  />
                )}
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/profile/settings/notifications')}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                  aria-label="Notification settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-colors ml-1"
                  aria-label="Close notification center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="p-2 border-b overflow-x-auto flex whitespace-nowrap">
              <Button
                variant={activeFilter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                className="mr-2"
                onClick={() => setActiveFilter('all')}
              >
                All
                {getUnreadCount() > 0 && (
                  <Badge 
                    variant="secondary" 
                    count={getUnreadCount()} 
                    size="sm" 
                    className="ml-2" 
                  />
                )}
              </Button>
              
              <Button
                variant={activeFilter === 'achievement' ? 'primary' : 'ghost'}
                size="sm"
                className="mr-2"
                onClick={() => setActiveFilter('achievement')}
              >
                Achievements
                {getUnreadCount('achievement') > 0 && (
                  <Badge 
                    variant="secondary" 
                    count={getUnreadCount('achievement')} 
                    size="sm" 
                    className="ml-2" 
                  />
                )}
              </Button>
              
              <Button
                variant={activeFilter === 'social' ? 'primary' : 'ghost'}
                size="sm"
                className="mr-2"
                onClick={() => setActiveFilter('social')}
              >
                Social
                {getUnreadCount('social') > 0 && (
                  <Badge 
                    variant="secondary" 
                    count={getUnreadCount('social')} 
                    size="sm" 
                    className="ml-2" 
                  />
                )}
              </Button>
              
              <Button
                variant={activeFilter === 'points' ? 'primary' : 'ghost'}
                size="sm"
                className="mr-2"
                onClick={() => setActiveFilter('points')}
              >
                Points
                {getUnreadCount('points') > 0 && (
                  <Badge 
                    variant="secondary" 
                    count={getUnreadCount('points')} 
                    size="sm" 
                    className="ml-2" 
                  />
                )}
              </Button>
              
              <Button
                variant={activeFilter === 'market' ? 'primary' : 'ghost'}
                size="sm"
                className="mr-2"
                onClick={() => setActiveFilter('market')}
              >
                Market
                {getUnreadCount('market') > 0 && (
                  <Badge 
                    variant="secondary" 
                    count={getUnreadCount('market')} 
                    size="sm" 
                    className="ml-2" 
                  />
                )}
              </Button>
              
              <Button
                variant={activeFilter === 'system' ? 'primary' : 'ghost'}
                size="sm"
                className="mr-2"
                onClick={() => setActiveFilter('system')}
              >
                System
                {getUnreadCount('system') > 0 && (
                  <Badge 
                    variant="secondary" 
                    count={getUnreadCount('system')} 
                    size="sm" 
                    className="ml-2" 
                  />
                )}
              </Button>
            </div>
            
            {/* Actions */}
            <div className="p-2 border-b flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={unread === 0}
              >
                Mark all as read
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="text-alert-500 hover:text-alert-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            </div>
            
            {/* Notification List */}
            <div className="overflow-y-auto flex-grow">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="w-12 h-12 text-neutral-300 mb-2" />
                  <h3 className="text-lg font-medium mb-1">No notifications</h3>
                  <p className="text-neutral-500">
                    {activeFilter === 'all'
                      ? 'You don\'t have any notifications yet.'
                      : `You don't have any ${activeFilter} notifications.`}
                  </p>
                </div>
              ) : (
                <div>
                  {Object.entries(groupedNotifications).map(([date, notifications]) => {
                    // Filter notifications by active filter
                    const filteredGroupNotifications = activeFilter === 'all'
                      ? notifications
                      : notifications.filter(notification => notification.type === activeFilter);
                    
                    // Skip empty groups
                    if (filteredGroupNotifications.length === 0) {
                      return null;
                    }
                    
                    return (
                      <div key={date}>
                        <div className="p-2 bg-neutral-50 sticky top-0 z-10">
                          <h3 className="text-sm font-medium text-neutral-500">
                            {formatNotificationDate(date)}
                          </h3>
                        </div>
                        
                        {filteredGroupNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b flex items-start cursor-pointer hover:bg-neutral-50 transition-colors ${
                              !notification.read ? 'bg-primary-50' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="mr-3 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-grow">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">{notification.title}</span>
                                <span className="text-xs text-neutral-500">
                                  {formatNotificationTime(notification.createdAt)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-neutral-700 mb-1">{notification.message}</p>
                              
                              {notification.actions && notification.actions.length > 0 && (
                                <div className="flex mt-2">
                                  {notification.actions.map((action, index) => (
                                    <Button
                                      key={index}
                                      variant={index === 0 ? 'primary' : 'outline'}
                                      size="sm"
                                      className="mr-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const actionResult = handleAction(notification, index);
                                        if (actionResult?.url) {
                                          router.push(actionResult.url);
                                          onClose();
                                        }
                                      }}
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {!notification.read && (
                              <Badge 
                                variant="primary" 
                                dot={true} 
                                size="sm" 
                                className="ml-2 mt-1" 
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default NotificationCenter;
