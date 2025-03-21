'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface UniversalGlowProps {
  color?: 'primary' | 'secondary' | 'accent' | 'alert' | 'white' | 'custom';
  customColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  intensity?: 'light' | 'medium' | 'strong';
  animation?: 'pulse' | 'breathe' | 'static' | 'rotate';
  shape?: 'circle' | 'square' | 'rounded';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Universal Glow component for creating ambient glow effects
 */
export function UniversalGlow({
  color = 'primary',
  customColor,
  size = 'md',
  intensity = 'medium',
  animation = 'pulse',
  shape = 'circle',
  className = '',
  children,
}: UniversalGlowProps) {
  // Map color to the correct Tailwind class
  const getColorClass = () => {
    if (color === 'custom' && customColor) {
      return '';
    }
    
    switch (color) {
      case 'primary':
        return 'bg-primary';
      case 'secondary':
        return 'bg-secondary';
      case 'accent':
        return 'bg-accent';
      case 'alert':
        return 'bg-alert';
      case 'white':
        return 'bg-white';
      default:
        return 'bg-primary';
    }
  };
  
  // Map size to dimensions
  const sizeClass = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
    xl: 'w-80 h-80',
  };
  
  // Map intensity to opacity
  const intensityClass = {
    light: 'opacity-10',
    medium: 'opacity-20',
    strong: 'opacity-30',
  };
  
  // Map shape to border radius
  const shapeClass = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-xl',
  };
  
  // Define animation variants
  const animationVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.2, 0.3, 0.2],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    breathe: {
      scale: [1, 1.2, 1],
      filter: ['blur(15px)', 'blur(20px)', 'blur(15px)'],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    rotate: {
      rotate: [0, 180, 360],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "linear"
      }
    },
    static: {}
  };
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-xl",
          getColorClass(),
          sizeClass[size],
          intensityClass[intensity],
          shapeClass[shape]
        )}
        animate={animationVariants[animation]}
        style={color === 'custom' && customColor ? { backgroundColor: customColor } : {}}
      />
      {children}
    </div>
  );
}

export default UniversalGlow;
