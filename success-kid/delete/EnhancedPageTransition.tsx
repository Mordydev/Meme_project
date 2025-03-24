'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { 
  bezierCurves,
  slideRightVariants,
  slideUpVariants,
  fadeVariants,
  scaleVariants
} from '@/lib/animations';

type TransitionType = 'fade' | 'slide-up' | 'slide-right' | 'slide-left' | 'scale' | 'none';

interface EnhancedPageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionType?: TransitionType;
  duration?: number;
  disableTransition?: boolean;
  preserveState?: boolean;
}

/**
 * EnhancedPageTransition - Provides smooth, professional transitions between pages
 * 
 * Enhanced version of PageTransition with more animation options and better performance
 */
export function EnhancedPageTransition({
  children,
  className,
  transitionType = 'fade',
  duration = 0.3,
  disableTransition = false,
  preserveState = false,
}: EnhancedPageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [key, setKey] = useState(pathname);
  
  // Update key when pathname changes to trigger animation
  useEffect(() => {
    if (!preserveState) {
      setKey(pathname);
    }
  }, [pathname, preserveState]);
  
  // Get appropriate variants based on transition type
  const getVariants = () => {
    // Use minimal animation for reduced motion or disabled transitions
    if (prefersReducedMotion || disableTransition) {
      return fadeVariants;
    }
    
    switch (transitionType) {
      case 'fade':
        return fadeVariants;
      case 'slide-up':
        return slideUpVariants;
      case 'slide-right':
        return slideRightVariants;
      case 'slide-left':
        return {
          hidden: { opacity: 0, x: 20 },
          visible: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -20 },
        };
      case 'scale':
        return scaleVariants;
      case 'none':
        return {
          hidden: {},
          visible: {},
          exit: {},
        };
      default:
        return fadeVariants;
    }
  };
  
  // Configure transition properties
  const getTransition = () => {
    if (prefersReducedMotion || disableTransition) {
      return { duration: 0.1 };
    }
    
    return {
      duration,
      ease: bezierCurves.standard,
    };
  };
  
  const variants = getVariants();
  const transition = getTransition();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
        transition={transition}
        className={cn("min-h-full", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
