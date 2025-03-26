'use client';

import React, { ReactNode } from 'react';
import { motion, Variants, MotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { fadeVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

export interface AnimateElementProps extends MotionProps {
  children: ReactNode;
  variant?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
  className?: string;
  duration?: number;
  delay?: number;
  customVariants?: Variants;
  tag?: keyof JSX.IntrinsicElements;
  disabled?: boolean;
}

/**
 * AnimateElement - Versatile animation component that respects reduced motion preferences
 * 
 * @example
 * // Basic usage with fade animation
 * <AnimateElement>
 *   <p>This content will fade in</p>
 * </AnimateElement>
 * 
 * // Using a specific animation variant
 * <AnimateElement variant="slide-up" delay={0.2}>
 *   <Card>This card will slide up</Card>
 * </AnimateElement>
 */
export function AnimateElement({
  children,
  variant = 'fade',
  className,
  duration = 0.3,
  delay = 0,
  customVariants,
  tag = 'div',
  disabled = false,
  ...props
}: AnimateElementProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Return children directly if animations are disabled or reduced motion is preferred
  if (disabled || prefersReducedMotion) {
    const Component = tag;
    return <Component className={className}>{children}</Component>;
  }
  
  // Select the appropriate animation variant
  let animationVariant: Variants = fadeVariants;
  
  if (customVariants) {
    animationVariant = customVariants;
  } else {
    switch (variant) {
      case 'fade':
        animationVariant = {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 },
        };
        break;
      case 'slide-up':
        animationVariant = {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
        };
        break;
      case 'slide-down':
        animationVariant = {
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 20 },
        };
        break;
      case 'slide-left':
        animationVariant = {
          hidden: { opacity: 0, x: 20 },
          visible: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -20 },
        };
        break;
      case 'slide-right':
        animationVariant = {
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 },
        };
        break;
      case 'scale':
        animationVariant = {
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.9 },
        };
        break;
    }
  }
  
  const MotionComponent = motion[tag as keyof typeof motion];
  
  return (
    <MotionComponent
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animationVariant}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // Custom easing curve
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
