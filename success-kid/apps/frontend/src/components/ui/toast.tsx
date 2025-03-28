/**
 * Toast Component
 * Displays non-intrusive notifications
 */
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

type ToastProps = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: (id: string) => void;
};

/**
 * Individual Toast Component
 */
export function Toast({ id, message, type, duration = 5000, onClose }: ToastProps) {
  // State for visibility
  const [isVisible, setIsVisible] = useState(true);
  
  // Handle automatic dismissal
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);
  
  // Handle animation complete (used by exit animation)
  const handleAnimationComplete = () => {
    if (!isVisible) {
      onClose(id);
    }
  };
  
  // Icon based on toast type
  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
  }[type];
  
  // Color based on toast type
  const colorClass = {
    success: 'bg-success-500/10 border-success-500 text-success-700',
    error: 'bg-alert-500/10 border-alert-500 text-alert-700',
    info: 'bg-primary-500/10 border-primary-500 text-primary-700',
    warning: 'bg-secondary-500/10 border-secondary-500 text-secondary-700'
  }[type];
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onAnimationComplete={handleAnimationComplete}
      className={`flex items-center p-3 mb-2 border rounded-md shadow-md ${colorClass} backdrop-blur-md`}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-5 h-5 mr-2 shrink-0" />
      <span className="text-sm">{message}</span>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="ml-auto p-1 rounded-full hover:bg-black/5 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

/**
 * Toast Container Component
 * Manages multiple toasts
 */
export function ToastContainer({ position = 'top-right', limit = 5 }: {
  position?: ToastPosition;
  limit?: number;
}) {
  // Get toasts from UI store
  const { toasts, removeToast } = useUIStore();
  
  // Limit the number of visible toasts
  const visibleToasts = toasts.slice(0, limit);
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center'
  }[position];
  
  // Return toast container with animation
  return (
    <div
      className={`fixed z-50 flex flex-col ${positionClasses}`}
      aria-live="polite"
      role="region"
      aria-label="Notification region"
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
