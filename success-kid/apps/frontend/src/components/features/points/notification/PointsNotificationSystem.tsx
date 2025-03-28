'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePointsStore } from '@/store/usePointsStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PointsNotificationToast } from './PointsNotificationToast';
import { PointCelebration } from './PointsCelebration';
import { PointSource } from '@/types/points';

interface PointsNotificationSystemProps {
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  duration?: number;
}

interface PointsNotification {
  id: string;
  amount: number;
  source: PointSource;
  description?: string;
  timestamp: Date;
}

/**
 * System for managing and displaying points notifications and celebrations
 */
export function PointsNotificationSystem({ 
  position = 'bottom-right',
  duration = 4000
}: PointsNotificationSystemProps) {
  const [notifications, setNotifications] = useState<PointsNotification[]>([]);
  const [celebrationActive, setCelebrationActive] = useState<boolean>(false);
  const [celebrationAmount, setCelebrationAmount] = useState<number>(0);
  
  const { connected, subscribe } = useWebSocket();
  const { addPoints } = usePointsStore();
  const prefersReducedMotion = useReducedMotion();
  
  // Get position styles based on position prop
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4',
  }[position];
  
  // Format source name for display
  const formatSource = useCallback((source: PointSource) => {
    return source
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);
  
  // Remove notification after duration
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Subscribe to points earned events from WebSocket
  useEffect(() => {
    if (!connected) return;
    
    const unsubscribe = subscribe('points:earned', (message) => {
      const { amount, source, description, transactionId } = message.data;
      
      // Create notification
      const notification: PointsNotification = {
        id: transactionId || Date.now().toString(),
        amount,
        source: source as PointSource,
        description,
        timestamp: new Date()
      };
      
      // Add notification
      setNotifications(prev => [...prev, notification]);
      
      // Update points store
      addPoints(amount, source, transactionId);
      
      // Trigger celebration for large amounts
      if (amount >= 500 && !prefersReducedMotion) {
        setCelebrationAmount(amount);
        setCelebrationActive(true);
        
        // Hide celebration after 2 seconds
        setTimeout(() => {
          setCelebrationActive(false);
        }, 2000);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [connected, subscribe, addPoints, prefersReducedMotion]);
  
  // For demonstration purposes - simulate points earned after 2 seconds
  useEffect(() => {
    const demoNotifications = [
      {
        id: 'demo-1',
        amount: 50,
        source: 'content_creation' as PointSource,
        description: 'Created a new post',
        delay: 2000
      },
      {
        id: 'demo-2',
        amount: 25,
        source: 'upvote_received' as PointSource,
        description: 'Your post received 5 upvotes',
        delay: 5000
      },
      {
        id: 'demo-3',
        amount: 500,
        source: 'achievement' as PointSource,
        description: 'Achievement: Content Creator Level 1',
        delay: 8000
      }
    ];
    
    // Setup timers for demo notifications
    const timers = demoNotifications.map(demo => {
      return setTimeout(() => {
        // Create notification
        const notification: PointsNotification = {
          id: demo.id,
          amount: demo.amount,
          source: demo.source,
          description: demo.description,
          timestamp: new Date()
        };
        
        // Add notification
        setNotifications(prev => [...prev, notification]);
        
        // Update points store
        addPoints(demo.amount, demo.source, demo.id);
        
        // Setup automatic removal
        setTimeout(() => removeNotification(demo.id), duration);
        
        // Trigger celebration for large amounts
        if (demo.amount >= 500 && !prefersReducedMotion) {
          setCelebrationAmount(demo.amount);
          setCelebrationActive(true);
          
          // Hide celebration after 2 seconds
          setTimeout(() => {
            setCelebrationActive(false);
          }, 2000);
        }
      }, demo.delay);
    });
    
    // Clean up timers
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [addPoints, duration, removeNotification, prefersReducedMotion]);
  
  return (
    <>
      {/* Regular point notifications */}
      <div className={`fixed z-50 space-y-3 pointer-events-none ${positionStyles}`}>
        <AnimatePresence>
          {notifications.map((notification) => (
            <PointsNotificationToast
              key={notification.id}
              notification={notification}
              duration={duration}
              onRemove={() => removeNotification(notification.id)}
              formatSource={formatSource}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Full-screen celebrations for large amounts */}
      <AnimatePresence>
        {celebrationActive && !prefersReducedMotion && (
          <PointCelebration 
            amount={celebrationAmount} 
            onComplete={() => setCelebrationActive(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
