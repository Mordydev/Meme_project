'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationStore, NotificationType } from '@/store/useNotificationStore';
import { useUIStore } from '@/store/useUIStore';
import NotificationItem from './NotificationItem';
import NotificationEmptyState from './NotificationEmptyState';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: NotificationType;
  maxHeight?: string | number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  initialFilter = 'all',
  maxHeight = '80vh'
}) => {
  const [activeFilter, setActiveFilter] = useState<NotificationType>(initialFilter);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const notifications = useNotificationStore(state => state.notifications);
  const getFilteredNotifications = useNotificationStore(state => state.getFilteredNotifications);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);
  const clearAll = useNotificationStore(state => state.clearAll);
  const unread = useNotificationStore(state => state.unread);
  
  // Reset filter when opened
  useEffect(() => {
    if (isOpen) {
      setActiveFilter(initialFilter);
      setSelectedIds([]);
    }
  }, [isOpen, initialFilter]);
  
  // Get filtered notifications
  const filteredNotifications = getFilteredNotifications(activeFilter);
  
  // Mark specific notifications as read
  const handleMarkAsRead = (ids: string[]) => {
    markAsRead(ids);
    setSelectedIds([]);
  };
  
  // Handle marking a single notification as read
  const handleItemClick = (id: string) => {
    markAsRead([id]);
  };
  
  // Toggle selection of a notification
  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };
  
  // Get notification type count
  const getTypeCount = (type: NotificationType) => {
    if (type === 'all') return notifications.length;
    return notifications.filter(n => n.type === type).length;
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Notification panel */}
          <motion.div
            className="relative flex h-full max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-neutral-800"
            style={{ maxHeight }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Notifications
                {unread > 0 && (
                  <span className="ml-2 text-sm font-normal text-neutral-500">
                    ({unread} unread)
                  </span>
                )}
              </h2>
              <button
                className="rounded-md p-1 text-neutral-500 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-neutral-400 dark:hover:text-white"
                onClick={onClose}
                aria-label="Close notification center"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            
            {/* Filters */}
            <div className="flex space-x-1 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  activeFilter === 'all'
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-800/20 dark:text-primary-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50'
                }`}
                onClick={() => setActiveFilter('all')}
              >
                All ({getTypeCount('all')})
              </button>
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  activeFilter === 'achievement'
                    ? 'bg-success-100 text-success-800 dark:bg-success-800/20 dark:text-success-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50'
                }`}
                onClick={() => setActiveFilter('achievement')}
              >
                Achievements ({getTypeCount('achievement')})
              </button>
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  activeFilter === 'social'
                    ? 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800/20 dark:text-secondary-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50'
                }`}
                onClick={() => setActiveFilter('social')}
              >
                Social ({getTypeCount('social')})
              </button>
            </div>
            
            {/* Action bar */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
              <div>
                {selectedIds.length > 0 ? (
                  <button
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    onClick={() => handleMarkAsRead(selectedIds)}
                  >
                    Mark {selectedIds.length} as read
                  </button>
                ) : (
                  <button
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    onClick={markAllAsRead}
                    disabled={unread === 0}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <button
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                onClick={clearAll}
                disabled={notifications.length === 0}
              >
                Clear all
              </button>
            </div>
            
            {/* Notification list */}
            <div className="flex-1 overflow-y-auto p-1">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      isSelected={selectedIds.includes(notification.id)}
                      onSelect={() => handleSelect(notification.id)}
                      onClick={() => handleItemClick(notification.id)}
                    />
                  ))}
                </div>
              ) : (
                <NotificationEmptyState type={activeFilter} />
              )}
            </div>
            
            {/* Settings footer */}
            <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
              <button
                className="flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                onClick={() => {
                  onClose();
                  // Open notification settings
                  useUIStore.getState().openModal('notification-settings');
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Notification settings
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
