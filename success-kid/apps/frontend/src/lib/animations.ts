/**
 * Animation Utilities for Success Kid Community Platform
 * 
 * This file contains common animation utilities, variants, and helpers
 * to ensure consistent animations throughout the platform.
 */
import { Variant, Variants, cubicBezier } from 'framer-motion';
import tokens from '@/theme/tokens';

// Re-export animation tokens for easy access
export const durations = {
  xs: tokens.animation.durations.xs, // 100ms
  sm: tokens.animation.durations.sm, // 200ms
  md: tokens.animation.durations.md, // 300ms
  lg: tokens.animation.durations.lg, // 500ms
  xl: tokens.animation.durations.xl, // 800ms
};

// Animation easing functions
export const easings = {
  standard: tokens.animation.easings.standard, // cubic-bezier(0.4, 0.0, 0.2, 1)
  enter: tokens.animation.easings.enter,       // cubic-bezier(0.0, 0.0, 0.2, 1)
  exit: tokens.animation.easings.exit,         // cubic-bezier(0.4, 0.0, 1, 1)
  emphatic: tokens.animation.easings.emphatic, // cubic-bezier(0.2, 0.9, 0.3, 1.3)
  fluid: tokens.animation.easings.fluid,       // cubic-bezier(0.3, 0, 0, 1)
  snappy: tokens.animation.easings.snappy,     // cubic-bezier(0.2, 0, 0, 1)
};

// Bezier curve definitions for direct use with Framer Motion
export const bezierCurves = {
  standard: cubicBezier(0.4, 0.0, 0.2, 1),
  enter: cubicBezier(0.0, 0.0, 0.2, 1),
  exit: cubicBezier(0.4, 0.0, 1, 1),
  emphatic: cubicBezier(0.2, 0.9, 0.3, 1.3),
  fluid: cubicBezier(0.3, 0, 0, 1),
  snappy: cubicBezier(0.2, 0, 0, 1),
};

// Spring configurations for natural-feeling animations
export const springs = {
  gentle: {
    type: "spring" as const,
    stiffness: 100,
    damping: 15,
    mass: 1,
  },
  responsive: {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
    mass: 1,
  },
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 10,
    mass: 1,
  },
  quick: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 1,
  },
};

// Common animation variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.3, ease: bezierCurves.standard } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.2, ease: bezierCurves.exit } 
  },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: bezierCurves.standard } 
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    transition: { duration: 0.2, ease: bezierCurves.exit } 
  },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: bezierCurves.standard } 
  },
  exit: { 
    opacity: 0, 
    y: 20, 
    transition: { duration: 0.2, ease: bezierCurves.exit } 
  },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.3, ease: bezierCurves.standard } 
  },
  exit: { 
    opacity: 0, 
    x: 20, 
    transition: { duration: 0.2, ease: bezierCurves.exit } 
  },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.3, ease: bezierCurves.standard } 
  },
  exit: { 
    opacity: 0, 
    x: -20, 
    transition: { duration: 0.2, ease: bezierCurves.exit } 
  },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.3, ease: bezierCurves.standard } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    transition: { duration: 0.2, ease: bezierCurves.exit } 
  },
};

// Staggered children animation variant factory
export const createStaggeredChildrenVariants = (
  staggerDelay = 0.05,
  childVariants = fadeVariants
) => {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: staggerDelay/2,
        staggerDirection: -1,
      },
    },
    children: childVariants,
  };
};

// Create animation variants that respect reduced motion
export const createAccessibleVariants = (regularVariants: Variants): Variants => {
  // Create a simplified version for users who prefer reduced motion
  const reducedMotionVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };
  
  return {
    ...regularVariants,
    reducedMotion: reducedMotionVariants,
  };
};

// Success Kid signature effects
export const successKidEffects = {
  // Pulsing animation for important elements like achievements
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.6, times: [0, 0.5, 1], repeat: 0, ease: "easeInOut" }
  },
  
  // Victory fist animation for celebrations
  victoryFist: {
    scale: [1, 1.1, 1],
    rotate: [0, -5, 5, 0],
    transition: { duration: 0.8, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }
  },
  
  // Success confetti effect pattern
  confetti: {
    opacity: [0, 1, 0],
    scale: [0.8, 1.2, 0.8],
    y: [0, -20, -40],
    transition: { duration: 1.2, ease: "easeOut" }
  },
  
  // Highlight glow effect
  glow: {
    boxShadow: [
      "0 0 0 rgba(76, 175, 80, 0)",
      "0 0 15px rgba(76, 175, 80, 0.7)",
      "0 0 0 rgba(76, 175, 80, 0)"
    ],
    transition: { duration: 1.5, ease: "easeInOut" }
  }
};

// Helper functions for animations
export const animationHelpers = {
  // Create sequential keyframes for staggers without children
  staggerDelay: (index: number, baseDelay = 0.05) => index * baseDelay,
  
  // Combine multiple animation variants
  combineVariants: (...variants: Variants[]): Variants => {
    const combined: Variants = {};
    variants.forEach(variant => {
      Object.entries(variant).forEach(([key, value]) => {
        combined[key] = { ...combined[key], ...value };
      });
    });
    return combined;
  }
};
