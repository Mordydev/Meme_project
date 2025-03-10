import React from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  as?: React.ElementType;
}

/**
 * Container component for controlling content width and padding
 * Implements mobile-first approach with responsive padding and max-widths
 */
export const Container = ({
  children,
  size = 'md',
  className,
  as: Component = 'div',
}: ContainerProps) => {
  return (
    <Component
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8 w-full',
        {
          'max-w-screen-sm': size === 'sm',
          'max-w-screen-xl': size === 'md',
          'max-w-screen-2xl': size === 'lg',
          '': size === 'full', // No max-width for full size
        },
        className
      )}
    >
      {children}
    </Component>
  );
};

export default Container;
