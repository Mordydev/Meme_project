'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePointsStore } from '@/store/usePointsStore';
import { formatCompactNumber } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';

interface PointsNotificationProps {
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  duration?: number;
}

/**
 * Component for displaying real-time points earning notifications
 */
export function PointsNotification({ 
  position = 'bottom-right',
  duration = 3000
}: PointsNotificationProps) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    amount: number;
    source: string;
    description?: string;
  }>>([]);
  
  const { connected, subscribe } = useWebSocket();
  const { addPoints } = usePointsStore();
  
  // Get position styles based on position prop
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4',
  }[position];
  
  // Subscribe to points earned events from WebSocket
  useEffect(() => {
    if (!connected) return;
    
    const unsubscribe = subscribe('points:earned', (message) => {
      const { amount, source, description, transactionId } = message.data;
      
      // Add notification
      setNotifications(prev => [...prev, {
        id: transactionId || Date.now().toString(),
        amount,
        source,
        description,
      }]);
      
      // Update points store
      addPoints(amount, source, transactionId);
    });
    
    return () => {
      unsubscribe();
    };
  }, [connected, subscribe, addPoints]);
  
  // Remove notification after duration
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Format source name for display
  const formatSource = (source: string) => {
    return source
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // For demo purposes, let's simulate some point earnings
  useEffect(() => {
    // Set a demo points notification after 2 seconds
    const timer = setTimeout(() => {
      const demoId = Date.now().toString();
      const demoAmount = 50;
      const demoSource = 'content_creation';
      
      // Add notification
      setNotifications(prev => [...prev, {
        id: demoId,
        amount: demoAmount,
        source: demoSource,
        description: 'Demo points notification',
      }]);
      
      // Remove after duration
      setTimeout(() => removeNotification(demoId), duration);
      
      // Add points to store
      addPoints(demoAmount, demoSource, demoId);
      
    }, 2000);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <div className={`fixed z-50 space-y-2 ${positionStyles}`}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <PointsToast
            key={notification.id}
            notification={notification}
            duration={duration}
            onRemove={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface PointsToastProps {
  notification: {
    id: string;
    amount: number;
    source: string;
    description?: string;
  };
  duration: number;
  onRemove: () => void;
}

function PointsToast({ notification, duration, onRemove }: PointsToastProps) {
  // Remove notification after duration
  useEffect(() => {
    const timer = setTimeout(onRemove, duration);
    return () => clearTimeout(timer);
  }, [duration, onRemove]);
  
  // Format source name for display
  const formatSource = (source: string) => {
    return source
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="w-72 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5"
    >
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-primary"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Points Earned
              </p>
              <div className="mt-1 flex items-baseline">
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-mono text-xl font-bold text-primary"
                >
                  +{formatCompactNumber(notification.amount)}
                </motion.p>
                <p className="ml-1 text-sm text-gray-500">
                  {formatSource(notification.source)}
                </p>
              </div>
              {notification.description && (
                <p className="mt-1 text-xs text-gray-500">
                  {notification.description}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={onRemove}
            className="flex w-10 items-center justify-center hover:bg-gray-50"
          >
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="h-1 bg-primary">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className="h-full bg-primary-600"
        />
      </div>
    </motion.div>
  );
}
