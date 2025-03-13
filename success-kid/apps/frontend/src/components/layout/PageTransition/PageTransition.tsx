'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export type TransitionType = 'fade' | 'slide-up' | 'slide-left' | 'none';

interface PageTransitionProps {
  children: React.ReactNode;
  transitionType?: TransitionType;
  duration?: number;
  enabled?: boolean;
}

export function PageTransition({
  children,
  transitionType = 'fade',
  duration = 0.3,
  enabled = true
}: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  // Skip animations if user prefers reduced motion or animations are disabled
  const shouldAnimate = enabled && !prefersReducedMotion;
  
  // Define animation variants
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    'slide-up': {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    'slide-left': {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    },
    none: {
      initial: {},
      animate: {},
      exit: {}
    }
  };
  
  // Select the appropriate variant
  const selectedVariant = shouldAnimate ? variants[transitionType] : variants.none;
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={selectedVariant.initial}
        animate={selectedVariant.animate}
        exit={selectedVariant.exit}
        transition={{
          duration: shouldAnimate ? duration : 0,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
