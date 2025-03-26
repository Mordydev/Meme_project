'use client';

import React, { ReactNode } from 'react';
import { motion, Variants, MotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export interface StaggeredContainerProps extends MotionProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
  childrenVariant?: Variants;
  containerTagName?: keyof JSX.IntrinsicElements;
  disabled?: boolean;
}

/**
 * StaggeredContainer - Animates children with a staggered delay
 * 
 * Each direct child will animate in sequence with a staggered delay,
 * creating a cascading effect.
 * 
 * @example
 * <StaggeredContainer staggerDelay={0.1}>
 *   <Card>First card</Card>
 *   <Card>Second card</Card>
 *   <Card>Third card</Card>
 * </StaggeredContainer>
 */
export function StaggeredContainer({
  children,
  className,
  staggerDelay = 0.05,
  duration = 0.3,
  childrenVariant,
  containerTagName = 'div',
  disabled = false,
  ...props
}: StaggeredContainerProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Return children without animation if disabled or reduced motion preferred
  if (disabled || prefersReducedMotion) {
    const Component = containerTagName;
    return <Component className={className}>{children}</Component>;
  }
  
  // Default animation for children if none provided
  const defaultChildrenVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };
  
  // Container variant that handles the staggering
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: staggerDelay / 2,
        staggerDirection: -1,
        duration: 0.2,
      },
    },
  };
  
  const MotionComponent = motion[containerTagName as keyof typeof motion];
  
  return (
    <MotionComponent
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className={cn(className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) {
          return child;
        }
        
        return (
          <motion.div
            variants={childrenVariant || defaultChildrenVariant}
            transition={{ duration }}
            style={{ display: 'contents' }}
          >
            {child}
          </motion.div>
        );
      })}
    </MotionComponent>
  );
}
