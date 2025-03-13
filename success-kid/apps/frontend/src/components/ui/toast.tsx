'use client';

import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ToastPosition = 
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ id, message, type = 'info', duration = 5000, onClose, action }, ref) => {
    const [removing, setRemoving] = useState(false);
    const timerRef = useRef<NodeJS.Timeout>();
    
    // Handle automatic dismissal after duration
    useEffect(() => {
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setRemoving(true);
        }, duration);
      }
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [duration]);
    
    // Handle close with animation
    const handleClose = () => {
      setRemoving(true);
    };
    
    // Handle animation complete
    const handleAnimationComplete = () => {
      if (removing) {
        onClose(id);
      }
    };
    
    // Determine the icon based on type
    const getIcon = () => {
      switch (type) {
        case 'success':
          return (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2C14.42 2 18 5.58 18 10C18 14.42 14.42 18 10 18C5.58 18 2 14.42 2 10C2 5.58 5.58 2 10 2ZM10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM15 7.41L13.59 6L9 10.59L6.41 8L5 9.41L9 13.41L15 7.41Z" fill="currentColor" />
            </svg>
          );
        case 'info':
          return (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2C14.42 2 18 5.58 18 10C18 14.42 14.42 18 10 18C5.58 18 2 14.42 2 10C2 5.58 5.58 2 10 2ZM10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM9 15H11V9H9V15ZM9 7H11V5H9V7Z" fill="currentColor" />
            </svg>
          );
        case 'warning':
          return (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.58 18 2 14.42 2 10C2 5.58 5.58 2 10 2C14.42 2 18 5.58 18 10C18 14.42 14.42 18 10 18ZM9 5H11V11H9V5ZM9 13H11V15H9V13Z" fill="currentColor" />
            </svg>
          );
        case 'error':
          return (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.58 18 2 14.42 2 10C2 5.58 5.58 2 10 2C14.42 2 18 5.58 18 10C18 14.42 14.42 18 10 18ZM13.59 5L10 8.59L6.41 5L5 6.41L8.59 10L5 13.59L6.41 15L10 11.41L13.59 15L15 13.59L11.41 10L15 6.41L13.59 5Z" fill="currentColor" />
            </svg>
          );
        default:
          return null;
      }
    };
    
    // Generate the specific styles based on type
    const getTypeStyles = () => {
      switch (type) {
        case 'success':
          return 'bg-success-500 text-white border-success-600';
        case 'info':
          return 'bg-primary-500 text-white border-primary-600';
        case 'warning':
          return 'bg-secondary-500 text-black border-secondary-600';
        case 'error':
          return 'bg-alert-500 text-white border-alert-600';
        default:
          return 'bg-neutral-800 text-white border-neutral-700';
      }
    };
    
    return (
      <motion.div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          'pointer-events-auto flex w-full max-w-sm items-center rounded-lg border p-4 shadow-lg',
          getTypeStyles()
        )}
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onAnimationComplete={handleAnimationComplete}
      >
        <div className="mr-2 flex-shrink-0 text-white">
          {getIcon()}
        </div>
        <div className="mr-2 flex-1">
          {message}
        </div>
        {action && (
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              className="rounded-md bg-white/20 px-2 py-1 text-sm font-medium text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          </div>
        )}
        <button
          type="button"
          className="ml-4 flex-shrink-0 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </motion.div>
    );
  }
);

Toast.displayName = 'Toast';

export interface ToastContainerProps {
  position?: ToastPosition;
  className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  className,
}) => {
  // Get toast positioning classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-0 left-0';
      case 'top-center':
        return 'top-0 left-1/2 -translate-x-1/2';
      case 'top-right':
        return 'top-0 right-0';
      case 'bottom-left':
        return 'bottom-0 left-0';
      case 'bottom-center':
        return 'bottom-0 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-0 right-0';
      default:
        return 'top-0 right-0';
    }
  };
  
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'fixed z-50 m-4 flex flex-col gap-2',
        getPositionClasses(),
        className
      )}
    />
  );
};

export { Toast };
