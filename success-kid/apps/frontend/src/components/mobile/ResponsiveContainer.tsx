'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointConfig {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}

export interface ResponsiveContainerProps {
  children: ReactNode;
  breakpoints?: BreakpointConfig;
  mobileFirst?: boolean;
  className?: string;
  fullWidth?: boolean;
  as?: React.ElementType;
}

/**
 * A responsive container that adapts to different screen sizes
 * based on the current viewport width.
 */
export const ResponsiveContainer = ({
  children,
  breakpoints,
  mobileFirst = true,
  className,
  fullWidth = false,
  as: Component = 'div',
}: ResponsiveContainerProps) => {
  const { width, breakpoint } = useViewport();

  return (
    <Component
      className={cn(
        "w-full mx-auto px-4",
        !fullWidth && "sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px]",
        mobileFirst && "mobile-first",
        `breakpoint-${breakpoint}`,
        className
      )}
      data-viewport-width={width}
      data-breakpoint={breakpoint}
    >
      {children}
    </Component>
  );
};

export default ResponsiveContainer;