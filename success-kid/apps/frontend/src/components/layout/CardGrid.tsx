'use client';

import React, { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardGridProps {
  children: ReactNode;
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

/**
 * CardGrid - Responsive grid layout system for card-based content
 * Adapts columns based on viewport size and provides consistent spacing
 */
export function CardGrid({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  gap = 'md',
  className,
  animate = true
}: CardGridProps) {
  // Map gap size to appropriate Tailwind class
  const gapMap = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };
  
  // Construct grid template columns classes for responsive behavior
  const gridColsClasses = [
    `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  ].filter(Boolean).join(' ');
  
  // Animation variants for staggered children
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05
      }
    }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };
  
  // If animation is enabled and children are array-like, we can animate each child
  const animateChildren = animate && React.Children.count(children) > 0;
  
  // Construct complete class name
  const gridClassName = cn(
    'grid',
    gridColsClasses,
    gapMap[gap],
    className
  );
  
  // Don't apply animations if not requested
  if (!animate) {
    return (
      <div className={gridClassName}>
        {children}
      </div>
    );
  }
  
  // With animations
  if (animateChildren) {
    return (
      <motion.div
        className={gridClassName}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }
  
  // Fallback for when we can't map children (e.g., if children is a complex component)
  return (
    <motion.div
      className={gridClassName}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

export default CardGrid;