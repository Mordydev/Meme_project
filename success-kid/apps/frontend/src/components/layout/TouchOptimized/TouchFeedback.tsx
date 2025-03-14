'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export type FeedbackEffect = 'highlight' | 'scale' | 'ripple' | 'none';

export interface TouchFeedbackProps {
  children: React.ReactNode;
  effect?: FeedbackEffect;
  disabled?: boolean;
  onPress?: () => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
  className?: string;
  activeClassName?: string;
  disabledClassName?: string;
  touchOnly?: boolean;
  pressDelay?: number;
  color?: string;
}

/**
 * A component that provides touch feedback for interactive elements
 * 
 * @param children - The interactive element
 * @param effect - The type of feedback effect to apply
 * @param disabled - Whether the interaction is disabled
 * @param onPress - Callback fired when the element is pressed
 * @param onPressStart - Callback fired when the press starts
 * @param onPressEnd - Callback fired when the press ends
 * @param className - Additional CSS classes
 * @param activeClassName - CSS classes to apply when active
 * @param disabledClassName - CSS classes to apply when disabled
 * @param touchOnly - Whether to only apply effects on touch devices
 * @param pressDelay - Delay before triggering onPress (ms)
 * @param color - Color for the ripple effect
 */
export function TouchFeedback({
  children,
  effect = 'scale',
  disabled = false,
  onPress,
  onPressStart,
  onPressEnd,
  className,
  activeClassName,
  disabledClassName,
  touchOnly = false,
  pressDelay = 0,
  color = 'currentColor',
}: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const elementRef = useRef<HTMLDivElement>(null);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rippleIdRef = useRef(0);
  
  // For scale effect
  const scale = useMotionValue(1);
  const motionScale = useTransform(scale, [0.95, 1, 1.05], [0.95, 1, 1.05]);

  // Handle press start
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || (touchOnly && e.type.startsWith('mouse'))) return;
    
    setIsPressed(true);
    onPressStart?.();
    
    // Scale effect
    if (effect === 'scale') {
      scale.set(0.95);
    }
    
    // Ripple effect
    if (effect === 'ripple' && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      let x, y;
      
      if ('touches' in e) {
        // Touch event
        const touch = e.touches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      } else {
        // Mouse event
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      
      const id = rippleIdRef.current++;
      setRipples(prev => [...prev, { id, x, y }]);
    }
    
    // Handle press with delay if needed
    if (onPress && pressDelay > 0) {
      pressTimeoutRef.current = setTimeout(() => {
        onPress();
      }, pressDelay);
    }
  };
  
  // Handle press end
  const handlePressEnd = () => {
    if (disabled || !isPressed) return;
    
    setIsPressed(false);
    onPressEnd?.();
    
    // Scale effect
    if (effect === 'scale') {
      scale.set(1);
    }
    
    // Clear timeout if press ended before delay
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
    
    // Trigger press callback if no delay or delay was cleared
    if (onPress && pressDelay === 0) {
      onPress();
    }
  };
  
  // Clean up ripples after animation completes
  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples([]);
      }, 500); // Duration of ripple animation
      
      return () => clearTimeout(timer);
    }
  }, [ripples]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
    };
  }, []);
  
  // Apply motion component for scale effect, regular div for others
  if (effect === 'scale') {
    return (
      <motion.div
        ref={elementRef}
        className={cn(
          'touch-feedback',
          className,
          isPressed && activeClassName,
          disabled && cn('pointer-events-none opacity-50', disabledClassName)
        )}
        style={{ scale: motionScale }}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        role="button"
        aria-disabled={disabled}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <div
      ref={elementRef}
      className={cn(
        'touch-feedback relative overflow-hidden',
        effect === 'highlight' && 'transition-colors duration-200',
        effect === 'highlight' && isPressed && 'bg-black/5 dark:bg-white/10',
        className,
        isPressed && activeClassName,
        disabled && cn('pointer-events-none opacity-50', disabledClassName)
      )}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      role="button"
      aria-disabled={disabled}
    >
      {children}
      
      {/* Ripple elements */}
      {effect === 'ripple' && ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            top: ripple.y,
            left: ripple.x,
            transform: 'translate(-50%, -50%)',
            width: '5px',
            height: '5px',
            borderRadius: '100%',
            backgroundColor: color,
            opacity: 0.3,
            pointerEvents: 'none',
          }}
          className="animate-[ripple_500ms_ease-out]"
        />
      ))}
    </div>
  );
}
