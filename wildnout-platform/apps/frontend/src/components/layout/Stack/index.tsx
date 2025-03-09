import React from 'react';
import { cn } from '@/lib/utils';

export interface StackProps {
  children: React.ReactNode;
  space?: number | { default?: number; sm?: number; md?: number; lg?: number };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
  as?: React.ElementType;
}

/**
 * Stack component for vertical spacing between elements
 * Simplifies managing consistent vertical rhythm
 */
export const Stack = ({
  children,
  space = 4,
  align = 'stretch',
  justify = 'start',
  className,
  as: Component = 'div',
}: StackProps) => {
  // Handle responsive spacing
  let spaceClasses = '';
  
  if (typeof space === 'number') {
    spaceClasses = `space-y-${space}`;
  } else {
    const { default: defaultSpace = 4, sm, md, lg } = space;
    
    spaceClasses = `space-y-${defaultSpace}`;
    if (sm) spaceClasses += ` sm:space-y-${sm}`;
    if (md) spaceClasses += ` md:space-y-${md}`;
    if (lg) spaceClasses += ` lg:space-y-${lg}`;
  }
  
  // Map alignment values to Tailwind classes
  const alignmentClass = `items-${align}`;
  
  // Map justify values to Tailwind classes
  const justifyClass = `justify-${justify}`;
  
  return (
    <Component
      className={cn(
        'flex flex-col',
        spaceClasses,
        alignmentClass,
        justifyClass,
        className
      )}
    >
      {children}
    </Component>
  );
};

export default Stack;
