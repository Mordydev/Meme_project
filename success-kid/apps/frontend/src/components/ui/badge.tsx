/**
 * Badge Component
 * Used for notification indicators and counters
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  count?: number;
  max?: number;
  animate?: boolean;
  pulse?: boolean;
  showZero?: boolean;
  dot?: boolean;
}

/**
 * Badge Component
 * 
 * @param props Component properties
 * @returns Badge component
 */
export function Badge({
  variant = 'default',
  size = 'md',
  count,
  max = 99,
  animate = false,
  pulse = false,
  showZero = false,
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  // Determine if badge should be visible
  const isVisible = dot || (typeof count === 'number' && (count > 0 || showZero));
  
  // Determine displayed count
  const displayCount = typeof count === 'number'
    ? count > max
      ? `${max}+`
      : count.toString()
    : '';
  
  // Get variant styles
  const variantStyles = {
    default: 'bg-neutral-500 text-white',
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-secondary-500 text-black',
    success: 'bg-accent-500 text-white',
    warning: 'bg-secondary-500 text-black',
    danger: 'bg-alert-500 text-white',
    info: 'bg-primary-300 text-primary-900'
  }[variant];
  
  // Get size styles
  const sizeStyles = {
    sm: dot ? 'w-2 h-2' : 'min-w-4 h-4 text-xs px-1',
    md: dot ? 'w-3 h-3' : 'min-w-5 h-5 text-xs px-1.5',
    lg: dot ? 'w-4 h-4' : 'min-w-6 h-6 text-sm px-2'
  }[size];
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  // Render dot style badge if specified
  if (dot) {
    return (
      <motion.span
        initial={animate ? { scale: 0 } : {}}
        animate={animate ? { scale: 1 } : {}}
        className={cn(
          'flex-shrink-0 rounded-full flex items-center justify-center',
          variantStyles,
          sizeStyles,
          pulse && 'animate-pulse',
          className
        )}
        aria-hidden="true"
        {...props}
      />
    );
  }
  
  // Render count badge
  return (
    <motion.span
      initial={animate ? { scale: 0 } : {}}
      animate={animate ? { scale: 1 } : {}}
      className={cn(
        'flex-shrink-0 rounded-full flex items-center justify-center font-medium',
        variantStyles,
        sizeStyles,
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {displayCount}
      {children}
    </motion.span>
  );
}
