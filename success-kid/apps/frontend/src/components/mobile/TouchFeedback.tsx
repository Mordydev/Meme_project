'use client';

import React, { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type FeedbackEffect = 'highlight' | 'scale' | 'ripple';

export interface TouchFeedbackProps {
  children: ReactNode;
  effect?: FeedbackEffect;
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
  activeClassName?: string;
  disabledClassName?: string;
  role?: string;
  ariaLabel?: string;
}

/**
 * Provides consistent touch feedback patterns for mobile interactions.
 * Offers different visual effects for touch feedback.
 */
export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  effect = 'highlight',
  disabled = false,
  onPress,
  className = '',
  activeClassName = '',
  disabledClassName = '',
  role = 'button',
  ariaLabel,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  // Motion variants for different effects
  const variants = {
    highlight: {
      idle: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
      },
      pressed: { 
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
      },
      disabled: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        opacity: 0.5
      },
    },
    scale: {
      idle: { 
        scale: 1,
      },
      pressed: { 
        scale: 0.95,
      },
      disabled: {
        scale: 1,
        opacity: 0.5
      },
    },
    ripple: {
      idle: { 
        scale: 1,
        boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)',
      },
      pressed: { 
        scale: 0.98,
        boxShadow: '0 0 0 15px rgba(0, 0, 0, 0.1)',
      },
      disabled: {
        scale: 1,
        boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)',
        opacity: 0.5
      },
    },
  };
  
  // Handle touch events
  const handleTouchStart = () => {
    if (!disabled) setIsPressed(true);
  };
  
  const handleTouchEnd = () => {
    if (!disabled && isPressed) {
      setIsPressed(false);
      onPress?.();
    }
  };
  
  const handleTouchCancel = () => {
    setIsPressed(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      setIsPressed(true);
    }
  };
  
  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!disabled && isPressed && (e.key === 'Enter' || e.key === ' ')) {
      setIsPressed(false);
      onPress?.();
    }
  };

  // State for current variant
  const currentState = disabled ? 'disabled' : (isPressed ? 'pressed' : 'idle');
  
  return (
    <motion.div
      className={cn(
        'touch-feedback relative transition-colors',
        `touch-effect-${effect}`,
        {
          'touch-disabled': disabled,
          'touch-active': isPressed,
        },
        className,
        isPressed && activeClassName,
        disabled && disabledClassName
      )}
      variants={variants[effect]}
      initial="idle"
      animate={currentState}
      transition={{ duration: 0.1 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      role={role}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </motion.div>
  );
};

export default TouchFeedback;