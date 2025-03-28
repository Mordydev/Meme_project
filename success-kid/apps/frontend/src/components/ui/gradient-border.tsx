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
      boxShadow: [
        '0 0 0px rgba(30, 136, 229, 0.0)',
        '0 0 20px rgba(30, 136, 229, 0.5)',
        '0 0 10px rgba(30, 136, 229, 0.3)',
        '0 0 15px rgba(30, 136, 229, 0.4)',
        '0 0 0px rgba(30, 136, 229, 0.0)'
      ],
      rotate: [0, 0.5, 0, -0.5, 0],
      scale: [1, 1.01, 1, 0.99, 1],
      transition: {
        backgroundPosition: {
          duration: 8,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        },
        boxShadow: {
          duration: 4,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        },
        rotate: {
          duration: 12,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        },
        scale: {
          duration: 5,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }
      },
    },
  } : {};
  
  return (
    <motion.div
      className={`relative ${padding} ${borderRadius} bg-gradient-to-br ${gradientFrom} ${gradientTo} ${className}`}
      style={{ backgroundSize: '200% 200%' }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 0 20px rgba(30, 136, 229, 0.6)',
        transition: { duration: 0.3, type: 'spring', stiffness: 400, damping: 10 }
      }}
      {...animationProps}
    >
      <div className={`${borderRadius} bg-white dark:bg-gray-900 h-full w-full`}>
        {children}
      </div>
    </motion.div>
  );
}
