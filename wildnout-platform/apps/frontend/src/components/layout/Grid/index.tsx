import React from 'react';
import { cn } from '@/lib/utils';

export interface GridProps {
  children: React.ReactNode;
  cols?: number | { default?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number | string;
  className?: string;
  as?: React.ElementType;
}

/**
 * Responsive grid component that adapts to different screen sizes
 * Follows mobile-first approach with progressive enhancement
 */
export const Grid = ({
  children,
  cols = 1,
  gap = 4,
  className,
  as: Component = 'div',
}: GridProps) => {
  // Convert numeric gap to spacing scale
  const gapClass = typeof gap === 'number' ? `gap-${gap}` : gap;

  // Handle responsive columns
  let gridColsClasses = '';
  
  if (typeof cols === 'number') {
    gridColsClasses = `grid-cols-1 sm:grid-cols-${Math.min(cols, 2)} md:grid-cols-${cols}`;
  } else {
    const { default: defaultCols = 1, sm, md, lg, xl } = cols;
    
    gridColsClasses = `grid-cols-${defaultCols}`;
    if (sm) gridColsClasses += ` sm:grid-cols-${sm}`;
    if (md) gridColsClasses += ` md:grid-cols-${md}`;
    if (lg) gridColsClasses += ` lg:grid-cols-${lg}`;
    if (xl) gridColsClasses += ` xl:grid-cols-${xl}`;
  }
  
  return (
    <Component 
      className={cn(
        'grid',
        gridColsClasses,
        gapClass,
        className
      )}
    >
      {children}
    </Component>
  );
};

export default Grid;
