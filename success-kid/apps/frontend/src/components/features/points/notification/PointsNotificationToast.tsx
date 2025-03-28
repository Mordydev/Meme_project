'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { X, TrendingUp } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import { PointSource } from '@/types/points';

interface PointsNotificationToastProps {
  notification: {
    id: string;
    amount: number;
    source: PointSource;
    description?: string;
    timestamp: Date;
  };
  duration: number;
  onRemove: () => void;
  formatSource: (source: PointSource) => string;
}

/**
 * Toast notification for points earned
 */
export function PointsNotificationToast({ 
  notification,
  duration,
  onRemove,
  formatSource
}: PointsNotificationToastProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Remove notification after duration
  useEffect(() => {
    const timer = setTimeout(onRemove, duration);
    return () => clearTimeout(timer);
  }, [duration, onRemove]);
  
  // Define animation variants based on user preference
  const variants = prefersReducedMotion 
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }
    : {
        initial: { opacity: 0, y: 50, scale: 0.3 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 15 } },
        exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
      };
  
  // Choose appropriate icon based on source
  const getSourceIcon = (source: PointSource) => {
    switch (source) {
      case 'achievement':
        return (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
            <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'upvote_received':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pointer-events-auto w-72 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5"
    >
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                notification.amount >= 500 ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
              }`}>
                {getSourceIcon(notification.source)}
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
                  className={`font-mono text-xl font-bold ${
                    notification.amount >= 500 ? 'text-amber-600' : 'text-primary'
                  }`}
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
            <X className="h-5 w-5 text-gray-400" />
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
