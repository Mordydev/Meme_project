'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AdvancedGlassProps {
  children: ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
  borderGlow?: boolean;
  animated?: boolean;
  rounded?: string;
}

export function AdvancedGlass({
  children,
  className,
  intensity = 'medium',
  borderGlow = false,
  animated = false,
  rounded = 'rounded-lg'
}: AdvancedGlassProps) {
  // Intensity levels for the glass effect
  const intensityStyles = {
    light: 'bg-white/30 backdrop-blur-sm',
    medium: 'bg-white/50 backdrop-blur-md',
    heavy: 'bg-white/70 backdrop-blur-lg'
  };
  
  // Base styles
  const baseStyles = cn(
    rounded,
    intensityStyles[intensity],
    'border border-white/20 shadow-sm',
    'dark:bg-gray-800/30 dark:border-gray-700/40',
    className
  );

  // If not animated, return a simple div
  if (!animated && !borderGlow) {
    return <div className={baseStyles}>{children}</div>;
  }

  // For animated component
  return (
    <motion.div
      className={cn(baseStyles, 'relative overflow-hidden')}
      whileHover={animated ? { scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Border glow effect */}
      {borderGlow && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 rgba(var(--color-primary-rgb), 0)',
              '0 0 8px rgba(var(--color-primary-rgb), 0.3)',
              '0 0 0 rgba(var(--color-primary-rgb), 0)'
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Ambient light effect for animated cards */}
      {animated && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle at 30% 30%, rgba(var(--color-primary-rgb), 0.05) 0%, rgba(255, 255, 255, 0) 60%)',
              'radial-gradient(circle at 70% 70%, rgba(var(--color-primary-rgb), 0.05) 0%, rgba(255, 255, 255, 0) 60%)',
              'radial-gradient(circle at 30% 30%, rgba(var(--color-primary-rgb), 0.05) 0%, rgba(255, 255, 255, 0) 60%)',
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
        />
      )}
    </motion.div>
  );
}

export default AdvancedGlass;
