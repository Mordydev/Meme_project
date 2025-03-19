'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animate?: boolean;
  borderRadius?: string;
  padding?: string;
}

export function GradientBorder({
  children,
  className = '',
  borderWidth = 2,
  gradientFrom = 'from-primary',
  gradientTo = 'to-secondary',
  animate = true,
  borderRadius = 'rounded-lg',
  padding = 'p-0.5',
}: GradientBorderProps) {
  const animationProps = animate ? {
    animate: {
      backgroundPosition: ['0% 0%', '100% 100%'],
      transition: {
        duration: 5,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'linear',
      },
    },
  } : {};
  
  return (
    <motion.div
      className={`relative ${padding} ${borderRadius} bg-gradient-to-br ${gradientFrom} ${gradientTo} ${className}`}
      style={{ backgroundSize: '200% 200%' }}
      {...animationProps}
    >
      <div className={`${borderRadius} bg-white dark:bg-gray-900 h-full w-full`}>
        {children}
      </div>
    </motion.div>
  );
}
