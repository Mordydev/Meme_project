'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Breakpoint, useViewport } from './ViewportContext';

type FlexAlignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

export interface AdaptiveGridProps {
  children: React.ReactNode;
  columns: number | Record<Breakpoint, number>;
  spacing?: number | Record<Breakpoint, number>;
  alignItems?: FlexAlignment;
  justifyItems?: FlexAlignment;
  className?: string;
  rowGap?: number | Record<Breakpoint, number>;
  columnGap?: number | Record<Breakpoint, number>;
  autoRows?: boolean;
  minRowHeight?: string;
}

/**
 * A responsive grid component that adapts to different screen sizes
 * 
 * @param children - The grid items
 * @param columns - Number of columns or configuration by breakpoint
 * @param spacing - Grid gap or configuration by breakpoint
 * @param alignItems - Vertical alignment of grid items
 * @param justifyItems - Horizontal alignment of grid items
 * @param className - Additional CSS classes
 * @param rowGap - Custom row gap (overrides spacing)
 * @param columnGap - Custom column gap (overrides spacing)
 * @param autoRows - Whether to use auto rows
 * @param minRowHeight - Minimum row height for auto rows
 */
export function AdaptiveGrid({
  children,
  columns,
  spacing = 4,
  alignItems,
  justifyItems,
  className,
  rowGap,
  columnGap,
  autoRows = false,
  minRowHeight = 'min-content',
}: AdaptiveGridProps) {
  const { breakpoint } = useViewport();
  
  // Determine number of columns based on current breakpoint
  let currentColumns: number;
  if (typeof columns === 'number') {
    currentColumns = columns;
  } else {
    // Find the closest matching breakpoint
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(breakpoint);
    
    // Start from current breakpoint and go down until we find a match
    let foundColumns: number | undefined;
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpoints[i];
      if (columns[bp] !== undefined) {
        foundColumns = columns[bp];
        break;
      }
    }
    
    // If no match, use the smallest defined breakpoint
    if (foundColumns === undefined) {
      const firstDefinedBreakpoint = breakpoints.find(bp => columns[bp] !== undefined);
      foundColumns = firstDefinedBreakpoint ? columns[firstDefinedBreakpoint] : 1;
    }
    
    currentColumns = foundColumns;
  }
  
  // Calculate spacing (gap)
  let currentSpacing: number;
  if (typeof spacing === 'number') {
    currentSpacing = spacing;
  } else {
    // Similar approach as columns
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

  // Handle row and column gaps
  const currentRowGap = rowGap !== undefined ? 
    (typeof rowGap === 'number' ? rowGap : rowGap[breakpoint] || currentSpacing) : 
    currentSpacing;
    
  const currentColumnGap = columnGap !== undefined ? 
    (typeof columnGap === 'number' ? columnGap : columnGap[breakpoint] || currentSpacing) : 
    currentSpacing;

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

  const rowGapClasses = {
    0: 'row-gap-0',
    1: 'row-gap-1',
    2: 'row-gap-2',
    3: 'row-gap-3',
    4: 'row-gap-4',
    5: 'row-gap-5',
    6: 'row-gap-6',
    8: 'row-gap-8',
    10: 'row-gap-10',
    12: 'row-gap-12',
  };

  const columnGapClasses = {
    0: 'column-gap-0',
    1: 'column-gap-1',
    2: 'column-gap-2',
    3: 'column-gap-3',
    4: 'column-gap-4',
    5: 'column-gap-5',
    6: 'column-gap-6',
    8: 'column-gap-8',
    10: 'column-gap-10',
    12: 'column-gap-12',
  };

  // Alignment classes
  const alignItemsClass = alignItems ? `items-${alignItems}` : '';
  const justifyItemsClass = justifyItems ? `justify-items-${justifyItems}` : '';

  // Grid template columns
  let gridColsClass = '';
  if (currentColumns === 1) gridColsClass = 'grid-cols-1';
  else if (currentColumns === 2) gridColsClass = 'grid-cols-2';
  else if (currentColumns === 3) gridColsClass = 'grid-cols-3';
  else if (currentColumns === 4) gridColsClass = 'grid-cols-4';
  else if (currentColumns === 5) gridColsClass = 'grid-cols-5';
  else if (currentColumns === 6) gridColsClass = 'grid-cols-6';
  else if (currentColumns === 7) gridColsClass = 'grid-cols-7';
  else if (currentColumns === 8) gridColsClass = 'grid-cols-8';
  else if (currentColumns === 9) gridColsClass = 'grid-cols-9';
  else if (currentColumns === 10) gridColsClass = 'grid-cols-10';
  else if (currentColumns === 11) gridColsClass = 'grid-cols-11';
  else if (currentColumns === 12) gridColsClass = 'grid-cols-12';
  else gridColsClass = `grid-cols-[repeat(${currentColumns},_minmax(0,_1fr))]`;

  // Auto rows style
  const autoRowsStyle = autoRows ? { gridAutoRows: minRowHeight } : {};

  return (
    <div 
      className={cn(
        'grid',
        gridColsClass,
        gapClasses[currentSpacing as keyof typeof gapClasses] || `gap-[${currentSpacing}px]`,
        rowGap !== undefined && (rowGapClasses[currentRowGap as keyof typeof rowGapClasses] || `row-gap-[${currentRowGap}px]`),
        columnGap !== undefined && (columnGapClasses[currentColumnGap as keyof typeof columnGapClasses] || `column-gap-[${currentColumnGap}px]`),
        alignItemsClass,
        justifyItemsClass,
        className
      )}
      style={autoRowsStyle}
    >
      {children}
    </div>
  );
}
