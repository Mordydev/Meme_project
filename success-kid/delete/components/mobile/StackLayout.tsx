'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { Breakpoint } from './ResponsiveContainer';

export type SpacingSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface StackLayoutProps {
  children: ReactNode;
  spacing?: SpacingSize | Partial<Record<Breakpoint, SpacingSize>>;
  className?: string;
  dividers?: boolean;
  dividerColor?: string;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
}

/**
 * A mobile-optimized vertical stack layout component that
 * automatically adjusts spacing based on screen size.
 */
export const StackLayout: React.FC<StackLayoutProps> = ({
  children,
  spacing = 'md',
  className,
  dividers = false,
  dividerColor = 'border-gray-200',
  alignItems = 'stretch',
}) => {
  const { breakpoint } = useViewport();
  
  // Determine spacing based on breakpoint
  const getSpacing = (): SpacingSize => {
    if (typeof spacing === 'string') {
      return spacing;
    }
    
    const breakpointOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Look for the closest breakpoint with defined spacing
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
    
    return 'md'; // Default to medium spacing
  };
  
  const spacingValue = getSpacing();
  
  // Map alignment to Tailwind classes
  const alignmentClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };
  
  // Process children to add dividers if needed
  const renderChildren = () => {
    const childrenArray = React.Children.toArray(children);
    
    if (!dividers || childrenArray.length <= 1) {
      return children;
    }
    
    return childrenArray.map((child, index) => {
      if (index === childrenArray.length - 1) {
        return child; // No divider after last child
      }
      
      return (
        <React.Fragment key={`stack-item-${index}`}>
          {child}
          <div className={cn('w-full border-t', dividerColor)} />
        </React.Fragment>
      );
    });
  };
  
  return (
    <div 
      className={cn(
        'flex flex-col',
        `space-y-${spacingValue}`,
        alignmentClasses[alignItems],
        className
      )}
      data-spacing={spacingValue}
      data-breakpoint={breakpoint}
    >
      {renderChildren()}
    </div>
  );
};

export default StackLayout;