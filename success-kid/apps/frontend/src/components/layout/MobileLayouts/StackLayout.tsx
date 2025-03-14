'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Breakpoint, useViewport } from './ViewportContext';

export interface StackLayoutProps {
  children: React.ReactNode;
  spacing?: number | Record<Breakpoint, number>;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  inline?: boolean;
  reverse?: boolean;
  className?: string;
  dividers?: boolean;
  dividerColor?: string;
  wrap?: boolean;
}

/**
 * A stack layout component that arranges children vertically with consistent spacing
 * 
 * @param children - The stack items
 * @param spacing - Space between items or configuration by breakpoint
 * @param align - Horizontal alignment of items
 * @param justify - Vertical distribution of items
 * @param inline - Whether to use inline-flex instead of flex
 * @param reverse - Whether to reverse the direction of the stack
 * @param className - Additional CSS classes
 * @param dividers - Whether to show dividers between items
 * @param dividerColor - Color of the dividers
 * @param wrap - Whether items can wrap to the next line
 */
export function StackLayout({
  children,
  spacing = 4,
  align = 'stretch',
  justify = 'start',
  inline = false,
  reverse = false,
  className,
  dividers = false,
  dividerColor = 'border-gray-200',
  wrap = false,
}: StackLayoutProps) {
  const { breakpoint } = useViewport();
  
  // Calculate spacing
  let currentSpacing: number;
  if (typeof spacing === 'number') {
    currentSpacing = spacing;
  } else {
    // Find the closest matching breakpoint
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(breakpoint);
    
    let foundSpacing: number | undefined;
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpoints[i];
      if (spacing[bp] !== undefined) {
        foundSpacing = spacing[bp];
        break;
      }
    }
    
    if (foundSpacing === undefined) {
      const firstDefinedBreakpoint = breakpoints.find(bp => spacing[bp] !== undefined);
      foundSpacing = firstDefinedBreakpoint ? spacing[firstDefinedBreakpoint] : 4;
    }
    
    currentSpacing = foundSpacing;
  }

  // Convert gap values to Tailwind spacing classes
  const gapClasses = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
    12: 'gap-12',
  };

  // Process children for dividers if needed
  const processedChildren = React.Children.toArray(children).filter(Boolean);
  
  if (dividers && processedChildren.length > 0) {
    const result: React.ReactNode[] = [];
    
    processedChildren.forEach((child, index) => {
      result.push(
        <div key={`item-${index}`} className="w-full">
          {child}
        </div>
      );
      
      if (index < processedChildren.length - 1) {
        result.push(
          <hr key={`divider-${index}`} className={`w-full ${dividerColor}`} />
        );
      }
    });
    
    return (
      <div 
        className={cn(
          inline ? 'inline-flex' : 'flex',
          'flex-col',
          reverse && 'flex-col-reverse',
          `items-${align}`,
          `justify-${justify}`,
          gapClasses[currentSpacing as keyof typeof gapClasses] || `gap-[${currentSpacing}px]`,
          wrap && 'flex-wrap',
          className
        )}
      >
        {result}
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        inline ? 'inline-flex' : 'flex',
        'flex-col',
        reverse && 'flex-col-reverse',
        `items-${align}`,
        `justify-${justify}`,
        gapClasses[currentSpacing as keyof typeof gapClasses] || `gap-[${currentSpacing}px]`,
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}
