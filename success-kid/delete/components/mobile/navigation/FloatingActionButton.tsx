'use client';

import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Link from 'next/link';

export interface ActionItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  label?: string;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  className?: string;
  disabled?: boolean;
  expandable?: boolean;
  actions?: ActionItem[];
  shadow?: boolean;
  showLabels?: boolean;
}

/**
 * A mobile-optimized floating action button (FAB) component that can
 * be placed in different positions on the screen and optionally expand
 * to show multiple actions.
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  href,
  label,
  color = 'primary',
  size = 'medium',
  position = 'bottom-right',
  className,
  disabled = false,
  expandable = false,
  actions = [],
  shadow = true,
  showLabels = true,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Color classes based on color prop
  const colorClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    neutral: 'bg-gray-800 text-white hover:bg-gray-900',
  };
  
  // Size classes based on size prop
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-14 h-14',
    large: 'w-16 h-16',
  };
  
  // Position classes based on position prop
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'center': 'bottom-4 inset-x-0 mx-auto',
  };
  
  // Handle main button click
  const handleMainButtonClick = () => {
    if (disabled) return;
    
    if (expandable && actions.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };
  
  // Handle action item click
  const handleActionClick = (action: ActionItem) => {
    if (action.disabled) return;
    
    if (action.onClick) {
      action.onClick();
    }
    
    setIsExpanded(false);
  };
  
  // Main button content
  const buttonContent = (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        colorClasses[color],
        sizeClasses[size],
        shadow && 'shadow-lg',
        disabled && 'opacity-60 cursor-not-allowed',
        isExpanded && 'rotate-45',
        'transition-all duration-300',
        className
      )}
      role="button"
      aria-label={label || 'Action button'}
      aria-disabled={disabled}
      aria-expanded={expandable ? isExpanded : undefined}
      aria-haspopup={expandable ? 'menu' : undefined}
      aria-controls={expandable ? 'fab-menu' : undefined}
      tabIndex={disabled ? -1 : 0}
    >
      {icon}
    </div>
  );
  
  return (
    <>
      {/* Background backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      
      {/* Main floating action button */}
      <div
        className={cn(
          'fixed z-50',
          positionClasses[position]
        )}
      >
        {/* Action items */}
        <AnimatePresence>
          {isExpanded && expandable && actions.length > 0 && (
            <div 
              id="fab-menu"
              role="menu"
              className={cn(
                'absolute pb-2 mb-2',
                position.includes('right') ? 'right-0' : 'left-0'
              )}
            >
              <ul className="flex flex-col-reverse items-end">
                {actions.map((action, index) => (
                  <motion.li
                    key={action.id}
                    className="mb-2 flex items-center"
                    initial={{ 
                      opacity: 0, 
                      y: 20,
                      scale: prefersReducedMotion ? 1 : 0.8,
                    }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: 1,
                    }}
                    exit={{ 
                      opacity: 0, 
                      y: 10,
                      scale: prefersReducedMotion ? 1 : 0.8,
                      transition: { duration: 0.15 }
                    }}
                    transition={{ 
                      delay: prefersReducedMotion ? 0 : index * 0.05,
                      duration: 0.2
                    }}
                    role="menuitem"
                    aria-disabled={action.disabled}
                  >
                    {/* Action label */}
                    {showLabels && (
                      <span 
                        className={cn(
                          'mr-2 px-2 py-1 rounded-md bg-white shadow-md',
                          action.disabled ? 'text-gray-400' : 'text-gray-800'
                        )}
                      >
                        {action.label}
                      </span>
                    )}
                    
                    {/* Action button */}
                    {action.href && !action.disabled ? (
                      <Link href={action.href}>
                        <div 
                          className={cn(
                            'flex items-center justify-center rounded-full w-10 h-10',
                            colorClasses[color],
                            shadow && 'shadow-md',
                            action.disabled && 'opacity-60 cursor-not-allowed'
                          )}
                          aria-label={action.label}
                        >
                          {action.icon}
                        </div>
                      </Link>
                    ) : (
                      <div 
                        className={cn(
                          'flex items-center justify-center rounded-full w-10 h-10',
                          colorClasses[color],
                          shadow && 'shadow-md',
                          action.disabled && 'opacity-60 cursor-not-allowed',
                          !action.disabled && 'cursor-pointer'
                        )}
                        onClick={() => !action.disabled && handleActionClick(action)}
                        aria-label={action.label}
                        role="button"
                      >
                        {action.icon}
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </AnimatePresence>
        
        {/* Main button */}
        {href && !disabled ? (
          <Link href={href}>
            {buttonContent}
          </Link>
        ) : (
          <div onClick={handleMainButtonClick}>
            {buttonContent}
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingActionButton;