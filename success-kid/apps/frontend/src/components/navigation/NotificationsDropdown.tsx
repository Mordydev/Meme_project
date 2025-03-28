'use client';

import React, { useState } from 'react';
import { Bell, MessageSquare, Award, TrendingUp, MoreHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationStore } from '@/store/notifications/notificationStore';
import { formatDistanceToNow } from 'date-fns';

type NotificationType = 'engagement' | 'rewards' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationType | 'all'>('all');
  
  // In a real implementation, this would come from the notification store
  // For demo purposes, we'll use mock data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'engagement',
      title: 'New Comment',
      message: 'User123 commented on your post',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      read: false,
      actionUrl: '/post/123'
    },
    {
      id: '2',
      type: 'rewards',
      title: 'Achievement Unlocked',
      message: 'Content Creator: You published 5 quality posts',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: true,
      actionUrl: '/rewards/achievements'
    },
    {
      id: '3',
      type: 'system',
      title: 'Market Milestone',
      message: 'We reached $100,000 market cap!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      actionUrl: '/market'
    },
    {
      id: '4',
      type: 'rewards',
      title: 'Points Awarded',
      message: 'You earned 50 Success Points for your post',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      read: true,
      actionUrl: '/rewards/points'
    }
  ];
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const closeDropdown = () => {
    setIsOpen(false);
  };
  
  const markAsRead = (id: string) => {
    // In a real app, this would update the notification store
    console.log('Marking notification as read:', id);
    closeDropdown();
  };
  
  // Filter notifications based on active tab
  const filteredNotifications = mockNotifications.filter(
    notification => activeTab === 'all' || notification.type === activeTab
  );
  
  // Count unread notifications
  const unreadCount = mockNotifications.filter(n => !n.read).length;
  
  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'engagement':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'rewards':
        return <Award className="h-4 w-4 text-secondary" />;
      case 'system':
        return <TrendingUp className="h-4 w-4 text-accent" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-alert text-[10px] font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile only) */}
            <motion.div
              className="fixed inset-0 z-40 bg-background/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDropdown}
            />

            {/* Dropdown Content */}
            <motion.div
              className="absolute right-0 top-full z-50 mt-1 w-80 origin-top-right rounded-md border border-border bg-card shadow-lg md:w-96"
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Notifications</h3>
                  <button className="text-sm text-primary hover:underline">
                    Mark all as read
                  </button>
                </div>

                {/* Category Tabs */}
                <div className="mb-3 flex justify-between border-b border-border">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`relative px-3 py-2 text-sm ${
                      activeTab === 'all' 
                        ? 'font-medium text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All
                    {activeTab === 'all' && (
                      <motion.div
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                        layoutId="activeTab"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('engagement')}
                    className={`relative px-3 py-2 text-sm ${
                      activeTab === 'engagement' 
                        ? 'font-medium text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Engagement
                    {activeTab === 'engagement' && (
                      <motion.div
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                        layoutId="activeTab"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('rewards')}
                    className={`relative px-3 py-2 text-sm ${
                      activeTab === 'rewards' 
                        ? 'font-medium text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Rewards
                    {activeTab === 'rewards' && (
                      <motion.div
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                        layoutId="activeTab"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('system')}
                    className={`relative px-3 py-2 text-sm ${
                      activeTab === 'system' 
                        ? 'font-medium text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    System
                    {activeTab === 'system' && (
                      <motion.div
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                        layoutId="activeTab"
                      />
                    )}
                  </button>
                </div>

                {/* Notification List */}
                <div className="max-h-[280px] space-y-1 overflow-y-auto">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative rounded-md px-3 py-2 transition-colors hover:bg-muted ${
                          !notification.read ? 'bg-muted/50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{notification.title}</h4>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Bell className="mb-2 h-12 w-12 text-muted-foreground/50" />
                      <p className="mb-1 text-muted-foreground">No notifications found</p>
                      <p className="text-sm text-muted-foreground/70">
                        Check back later for updates
                      </p>
                    </div>
                  )}
                </div>

                {/* View All Button */}
                <div className="mt-3 border-t border-border pt-2">
                  <button
                    onClick={closeDropdown}
                    className="block w-full rounded-md py-2 text-center text-sm font-medium text-primary hover:bg-muted/50"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
