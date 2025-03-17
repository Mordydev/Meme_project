'use client';

import { Spinner } from '@/components/ui/spinner';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Loading Component
 * 
 * Displays a loading spinner with optional message
 * Can be full screen or inline
 */
export default function Loading({ 
  message = 'Loading...', 
  fullScreen = false,
  size = 'md' 
}: LoadingProps) {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center py-8';
  
  const spinnerSizeMap = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        <Spinner className={spinnerSizeMap[size]} />
        {message && (
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
