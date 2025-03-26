'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { Breakpoint } from './ResponsiveContainer';

export type GridAlignment = 'start' | 'center' | 'end' | 'stretch';

export interface AdaptiveGridProps {
  children: ReactNode;
  columns: number | Partial<Record<Breakpoint, number>>;
  spacing?: number | Partial<Record<Breakpoint, number>>;
  alignItems?: GridAlignment;
  className?: string;
}

/**
 * A mobile-optimized grid component that adapts to different screen sizes.
 * Supports both fixed and responsive column counts.
 */
export const AdaptiveGrid: React.FC<AdaptiveGridProps> = ({
  children,
  columns,
  spacing = 4,
  alignItems = 'stretch',
  className,
}) => {
  const { breakpoint } = useViewport();
  
  // Determine number of columns based on current breakpoint
  const getColumnCount = (): number => {
    if (typeof columns === 'number') {
      return columns;
    }
    
    // Find the best matching breakpoint value
    // Try current breakpoint first, then fall back to smaller breakpoints
    const breakpointOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Look for the first defined breakpoint value from current to smallest
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (columns[bp] !== undefined) {
        return columns[bp]!;
      }
    }
    
    // If nothing found, try larger breakpoints
    for (let i = currentIndex + 1; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (columns[bp] !== undefined) {
        return columns[bp]!;
      }
    }
    
    // Default to 1 column if nothing specified
    return 1;
  };
  
  // Determine spacing based on current breakpoint
  const getSpacing = (): number => {
    if (typeof spacing === 'number') {
      return spacing;
    }
    
    const breakpointOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Same logic as column count
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (spacing[bp] !== undefined) {
        return spacing[bp]!;
      }
    }
    
    for (let i = currentIndex + 1; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (spacing[bp] !== undefined) {
        return spacing[bp]!;
      }
    }
    
    return 4; // Default spacing
  };
  
  const columnCount = getColumnCount();
  const gapSize = getSpacing();
  
  // Map alignment to Tailwind classes
  const alignmentClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };
  
  return (
    <div 
      className={cn(
        'grid',
        `gap-${gapSize}`,
        `grid-cols-${columnCount}`,
        alignmentClasses[alignItems],
        className
      )}
      data-columns={columnCount}
      data-breakpoint={breakpoint}
    >
      {children}
    </div>
  );
};

export default AdaptiveGrid;