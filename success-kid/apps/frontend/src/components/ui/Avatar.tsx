'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export function Avatar({
  src,
  alt,
  size = 'md',
  fallback,
  className = '',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Handle image load error
  const handleError = () => {
    setImageError(true);
  };
  
  // Determine size classes
  const sizeClasses = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-xl',
  };
  
  const sizeClass = sizeClasses[size];
  
  // Show fallback if no src or image failed to load
  const showFallback = !src || imageError;
  
  // Create fallback content (first letter of alt or provided fallback)
  const fallbackContent = fallback || alt.charAt(0).toUpperCase();
  
  return (
    <div
      className={cn(
        sizeClass,
        'relative rounded-full overflow-hidden flex items-center justify-center bg-primary-100 text-primary-700 font-medium',
        className
      )}
    >
      {showFallback ? (
        <span>{fallbackContent}</span>
      ) : (
        <img
          src={src || ''}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      )}
    </div>
  );
}
