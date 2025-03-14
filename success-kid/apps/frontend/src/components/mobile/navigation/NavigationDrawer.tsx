'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TouchFeedback } from '../TouchFeedback';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Link from 'next/link';

export interface NavigationItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: number | boolean;
  subItems?: NavigationItem[];
  isActive?: boolean;
  isDivider?: boolean;
}

export interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavigationItem[];
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  position?: 'left' | 'right';
  width?: string;
  closeOnNavigation?: boolean;
  showBackdrop?: boolean;
  backButtonLabel?: string;
}

/**
 * A mobile navigation drawer (sidebar) component that slides in from 
 * the left or right side of the screen.
 */
export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  items,
  header,
  footer,
  className,
  position = 'left',
  width = '80%',
  closeOnNavigation = true,
  showBackdrop = true,
  backButtonLabel = 'Close menu',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);
  
  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Render each navigation item
  const renderItem = (item: NavigationItem) => {
    if (item.isDivider) {
      return <div key={item.id} className="h-px bg-gray-200 my-2 mx-4" aria-hidden="true" />;
    }
    
    const itemContent = (
      <TouchFeedback
        effect="highlight"
        disabled={item.disabled}
        onPress={() => {
          if (item.onClick) {
            item.onClick();
          }
          
          if (closeOnNavigation && !item.subItems) {
            onClose();
          }
        }}
        className={cn(
          'flex items-center px-4 py-3',
          item.isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-800',
          item.disabled && 'opacity-50'
        )}
        activeClassName="bg-gray-100"
        role="menuitem"
        aria-disabled={item.disabled}
      >
        {/* Icon */}
        {item.icon && (
          <div className={cn(
            'mr-3',
            item.isActive ? 'text-primary-600' : 'text-gray-500'
          )}>
            {item.icon}
          </div>
        )}
        
        {/* Label */}
        <span className="flex-1">{item.label}</span>
        
        {/* Badge */}
        {item.badge && (
          <span className={cn(
            'ml-auto flex justify-center items-center',
            typeof item.badge === 'number' ? 'min-w-5 h-5 rounded-full text-xs bg-red-500 text-white' : 'w-2 h-2 rounded-full bg-red-500'
          )}>
            {typeof item.badge === 'number' && item.badge > 0 && (
              <span>{item.badge > 99 ? '99+' : item.badge}</span>
            )}
          </span>
        )}
        
        {/* Chevron for sub-items */}
        {item.subItems && item.subItems.length > 0 && (
          <svg className="ml-2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </TouchFeedback>
    );
    
    // If item has an href, wrap with Link component
    if (item.href && !item.disabled) {
      return (
        <Link 
          key={item.id}
          href={item.href}
          className="block"
          onClick={() => {
            if (closeOnNavigation) {
              onClose();
            }
          }}
        >
          {itemContent}
        </Link>
      );
    }
    
    return (
      <div key={item.id}>
        {itemContent}
      </div>
    );
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              onClick={onClose}
              aria-hidden="true"
            />
          )}
          
          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            className={cn(
              'fixed top-0 bottom-0 z-50 flex flex-col bg-white shadow-xl',
              position === 'left' ? 'left-0' : 'right-0',
              'max-w-full overflow-hidden',
              className
            )}
            style={{ width }}
            initial={{ 
              x: position === 'left' ? '-100%' : '100%',
              opacity: prefersReducedMotion ? 0 : 1
            }}
            animate={{ 
              x: 0,
              opacity: 1
            }}
            exit={{ 
              x: position === 'left' ? '-100%' : '100%',
              opacity: prefersReducedMotion ? 0 : 1
            }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.25, 1, 0.5, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-headline"
          >
            {/* Header */}
            <div className="pt-safe sticky top-0 z-10 bg-white">
              {header ? (
                header
              ) : (
                <div className="flex items-center justify-between px-4 h-16 border-b">
                  <h2 id="drawer-headline" className="text-lg font-medium">
                    Menu
                  </h2>
                  <TouchFeedback
                    effect="highlight"
                    onPress={onClose}
                    className="p-2 -mr-2 rounded-full"
                    aria-label={backButtonLabel}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </TouchFeedback>
                </div>
              )}
            </div>
            
            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto" role="menu">
              {items.map(renderItem)}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="pb-safe border-t sticky bottom-0 bg-white">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavigationDrawer;