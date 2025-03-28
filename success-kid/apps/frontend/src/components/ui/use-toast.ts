'use client';

import { useUIStore } from '@/store/useUIStore';

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
};

export function useToast() {
  const { addToast, removeToast, toasts } = useUIStore();
  
  const toast = ({ 
    title, 
    description, 
    variant = 'default', 
    duration = 5000 
  }: ToastProps) => {
    // Convert variant to the toast type expected by our UI store
    const typeMap: Record<string, 'success' | 'error' | 'info' | 'warning'> = {
      'default': 'info',
      'destructive': 'error',
      'success': 'success'
    };
    
    // Create message from title and description
    let message = '';
    if (title) message += title;
    if (title && description) message += ' - ';
    if (description) message += description;
    
    // Add toast to store
    addToast(message, typeMap[variant] || 'info', duration);
    
    // Return toast ID for potential dismiss later
    return {
      id: Date.now().toString(),
      dismiss: () => {} // Placeholder for compatibility with other toast libraries
    };
  };
  
  return {
    toast,
    dismiss: removeToast,
    toasts
  };
}

export { useToast as default };
