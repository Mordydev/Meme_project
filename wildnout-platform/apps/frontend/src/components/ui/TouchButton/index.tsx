'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTapArea } from '@/hooks/touch';

export interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/**
 * TouchButton component optimized for mobile touch interactions
 * Ensures proper touch target size and provides visual feedback
 */
export const TouchButton = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  fullWidth = false,
  isLoading = false,
  iconLeft,
  iconRight,
  ...props
}: TouchButtonProps) => {
  const { getTapAreaProps } = useTapArea();
  const tapAreaProps = getTapAreaProps(props.id);
  
  return (
    <button
      className={cn(
        // Base styles - ensure minimum touch target size
        'rounded-md relative select-none inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flow-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        // Size variations
        {
          'h-10 px-4 py-2': size === 'md',
          'h-9 px-3': size === 'sm',
          'h-11 px-5 text-lg': size === 'lg',
          'w-full': fullWidth,
          // Add min-height and min-width for touch targets
          'min-h-[44px] min-w-[44px]': true,
        },
        // Variant styles
        {
          'bg-battle-yellow text-wild-black hover:bg-battle-yellow/90 active:bg-battle-yellow/80': variant === 'primary',
          'bg-flow-blue text-hype-white hover:bg-flow-blue/90 active:bg-flow-blue/80': variant === 'secondary',
          'border border-hype-white/20 bg-transparent hover:bg-hype-white/10 active:bg-hype-white/20 text-hype-white': variant === 'outline',
          'bg-transparent hover:bg-hype-white/10 active:bg-hype-white/20 text-hype-white': variant === 'ghost',
        },
        // Active tap styles - apply a slight scale effect
        'active:scale-[0.98] transform duration-quick',
        className
      )}
      disabled={isLoading || props.disabled}
      {...tapAreaProps}
      {...props}
    >
      {isLoading && (
        <span className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {iconLeft && <span className="mr-2">{iconLeft}</span>}
      {children}
      {iconRight && <span className="ml-2">{iconRight}</span>}
    </button>
  );
};

export default TouchButton;
