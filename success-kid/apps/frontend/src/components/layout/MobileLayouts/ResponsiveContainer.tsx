'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useViewport, Breakpoint } from './ViewportContext';

export interface BreakpointConfig {
  [key: string]: number;
}

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  breakpoints?: BreakpointConfig;
  mobileFirst?: boolean;
  className?: string;
  fullWidth?: boolean;
  fullWidthUntil?: Breakpoint;
  maxWidth?: Breakpoint | 'none';
  padding?: string;
}

/**
 * A responsive container component that adapts to different screen sizes
 * 
 * @param children - The content of the container
 * @param breakpoints - Custom breakpoints for the container (optional)
 * @param mobileFirst - Whether to apply mobile-first approach (default: true)
 * @param className - Additional CSS classes
 * @param fullWidth - Whether the container should be full width on all screen sizes
 * @param fullWidthUntil - The container is full width until this breakpoint
 * @param maxWidth - Maximum width of the container (optional)
 * @param padding - Custom padding for the container (optional)
 */
export function ResponsiveContainer({
  children,
  breakpoints,
  mobileFirst = true,
  className,
  fullWidth = false,
  fullWidthUntil,
  maxWidth,
  padding = 'px-4 sm:px-6 md:px-8',
}: ResponsiveContainerProps) {
  const { breakpoint } = useViewport();

  // Determine if we should use full width
  const useFullWidth = fullWidth || 
    (fullWidthUntil && 
      (fullWidthUntil === 'sm' && breakpoint === 'xs' ||
       fullWidthUntil === 'md' && ['xs', 'sm'].includes(breakpoint) ||
       fullWidthUntil === 'lg' && ['xs', 'sm', 'md'].includes(breakpoint) ||
       fullWidthUntil === 'xl' && ['xs', 'sm', 'md', 'lg'].includes(breakpoint) ||
       fullWidthUntil === '2xl' && ['xs', 'sm', 'md', 'lg', 'xl'].includes(breakpoint)));

  // Determine max width class
  let maxWidthClass = '';
  if (!useFullWidth && maxWidth && maxWidth !== 'none') {
    switch (maxWidth) {
      case 'sm': maxWidthClass = 'max-w-screen-sm'; break;
      case 'md': maxWidthClass = 'max-w-screen-md'; break;
      case 'lg': maxWidthClass = 'max-w-screen-lg'; break;
      case 'xl': maxWidthClass = 'max-w-screen-xl'; break;
      case '2xl': maxWidthClass = 'max-w-screen-2xl'; break;
      default: maxWidthClass = '';
    }
  }

  return (
    <div 
      className={cn(
        'mx-auto w-full',
        !useFullWidth && 'container',
        !useFullWidth && maxWidthClass,
        mobileFirst && 'mobile-first',
        padding,
        className
      )}
    >
      {children}
    </div>
  );
}
