'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ContentContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  padded?: boolean;
  bordered?: boolean;
  animate?: boolean;
}

/**
 * ContentContainer - Main content wrapper with consistent spacing and styling
 * Can be configured for different layouts and visual treatments
 */
export function ContentContainer({
  children,
  className,
  fullWidth = false,
  padded = true,
  bordered = false,
  animate = true
}: ContentContainerProps) {
  const containerClasses = cn(
    'bg-white dark:bg-gray-900',
    padded && 'p-4 sm:p-6',
    bordered && 'border border-gray-200 dark:border-gray-800 rounded-lg',
    !fullWidth && 'max-w-7xl mx-auto',
    className
  );
  
  // Don't apply animations if not requested
  if (!animate) {
    return <div className={containerClasses}>{children}</div>;
  }
  
  return (
    <motion.div
      className={containerClasses}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default ContentContainer;