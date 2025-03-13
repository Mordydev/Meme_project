'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useAppShell } from './AppShellProvider';

interface NavigationContainerProps {
  children: React.ReactNode;
  className?: string;
  mobilePadding?: boolean;
}

/**
 * NavigationContainer - Wrapper for navigation components that adapts to mobile/desktop
 * 
 * @param children - Navigation content
 * @param className - Additional CSS classes
 * @param mobilePadding - Whether to add padding for mobile displays
 */
export function NavigationContainer({
  children,
  className,
  mobilePadding = true
}: NavigationContainerProps) {
  const { isMobile, collapsed } = useAppShell();
  
  return (
    <div
      className={cn(
        "h-full",
        isMobile 
          ? "w-full" + (mobilePadding ? " px-2" : "")
          : collapsed 
            ? "w-20" 
            : "w-[280px]",
        className
      )}
    >
      {children}
    </div>
  );
}
