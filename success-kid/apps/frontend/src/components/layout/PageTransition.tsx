'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TransitionType = 'fade' | 'slide' | 'scale' | 'none';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionType?: TransitionType;
  duration?: number;
  disableTransition?: boolean;
}

/**
 * PageTransition - Wraps page content with smooth transitions between routes
 * Supports different transition styles and respects user preference for reduced motion
 */
export function PageTransition({
  children,
  className,
  transitionType = 'fade',
  duration = 0.3,
  disableTransition = false
}: PageTransitionProps) {
  const pathname = usePathname();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  // Determine animation variants based on transition type
  const getVariants = () => {
    // If user prefers reduced motion or transitions are disabled, use minimal animation
    if (prefersReducedMotion || disableTransition) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    
    // Otherwise, use requested transition type
    switch (transitionType) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case 'slide':
        return {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.05 },
        };
      case 'none':
        return {
          initial: {},
          animate: {},
          exit: {},
        };
    }
  };
  
  // Get transition configuration
  const getTransition = () => {
    if (prefersReducedMotion || disableTransition) {
      return { duration: 0.1 };
    }
    
    return {
      duration,
      ease: [0.22, 1, 0.36, 1], // Custom easing curve for smooth transitions
    };
  };
  
  const variants = getVariants();
  const transition = getTransition();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={transition}
        className={cn("min-h-full", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
