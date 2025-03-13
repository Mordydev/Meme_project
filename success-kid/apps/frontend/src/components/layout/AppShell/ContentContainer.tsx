'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useAppShell } from './AppShellProvider';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

/**
 * ContentContainer - Container for main content with responsive padding
 * 
 * @param children - Content to display
 * @param className - Additional CSS classes
 * @param fullWidth - Whether content should take full width
 * @param maxWidth - Maximum width constraint
 */
export function ContentContainer({
  children,
  className,
  fullWidth = false,
  maxWidth = 'xl'
}: ContentContainerProps) {
  const { isMobile } = useAppShell();
  
  // Map maxWidth to Tailwind classes
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    'full': 'max-w-full'
  };
  
  return (
    <div className={cn(
      "px-4 py-6 md:px-6",
      isMobile ? "pb-20" : "",
      !fullWidth && maxWidth !== 'full' && "mx-auto",
      !fullWidth && maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}
