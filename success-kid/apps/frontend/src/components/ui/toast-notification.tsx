'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { Toast, ToastContainer, ToastPosition } from './toast';
import { useUIStore } from '@/store/useUIStore';

export interface ToastNotificationProps {
  position?: ToastPosition;
  limit?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  position = 'top-right',
  limit = 3,
}) => {
  const [mounted, setMounted] = useState(false);
  const toasts = useUIStore(state => state.toasts);
  const removeToast = useUIStore(state => state.removeToast);
  
  // Only render on client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Limit visible toasts
  const visibleToasts = toasts.slice(0, limit);
  
  // Handle toast dismissal
  const handleClose = (id: string) => {
    removeToast(id);
  };
  
  if (!mounted) return null;
  
  return createPortal(
    <ToastContainer position={position}>
      <AnimatePresence>
        {visibleToasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={handleClose}
          />
        ))}
      </AnimatePresence>
    </ToastContainer>,
    document.body
  );
};

export default ToastNotification;
