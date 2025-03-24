'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'full';
  className?: string;
}

/**
 * Logo Component
 * Displays the Success Kid logo with configurable size and variant
 */
export function Logo({
  size = 'md',
  variant = 'icon',
  className,
}: LogoProps) {
  // Sizes based on variant and size
  const sizeClasses = {
    sm: variant === 'icon' ? 'h-6 w-6' : 'h-6',
    md: variant === 'icon' ? 'h-8 w-8' : 'h-8',
    lg: variant === 'icon' ? 'h-10 w-10' : 'h-10',
  }[size];
  
  // For a real implementation, this would be a proper SVG logo
  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn(
        "bg-primary-500 rounded-md flex items-center justify-center text-white font-bold", 
        sizeClasses
      )}>
        SK
      </div>
      
      {variant === 'full' && (
        <span className={cn(
          "ml-2 font-bold font-display", 
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
        )}>
          Success Kid
        </span>
      )}
    </div>
  );
}

export default Logo;