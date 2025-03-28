'use client';

import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'text' | 'avatar' | 'banner' | 'button';
  lines?: number;
  isLoading?: boolean;
  animated?: boolean;
  width?: string;
  height?: string;
  children?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

/**
 * SkeletonLoader - Enhanced loading placeholder with animations
 * 
 * Can either be used stand-alone or as a wrapper around content that's loading
 * 
 * @example
 * // Stand-alone usage
 * <SkeletonLoader variant="card" />
 * 
 * // As a wrapper
 * <SkeletonLoader isLoading={isLoading}>
 *   <Card>Content here</Card>
 * </SkeletonLoader>
 */
export function SkeletonLoader({
  variant = 'text',
  lines = 3,
  isLoading = true,
  animated = true,
  width,
  height,
  children,
  className,
  wrapperClassName,
}: SkeletonLoaderProps) {
  // If we're not loading and have children, just render the children
  if (!isLoading && children) {
    return <>{children}</>;
  }
  
  // Variants for motion animation
  const fadeInVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };
  
  // Generate skeleton based on variant
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={cn("rounded-lg overflow-hidden", className)}>
            {/* Card header/image */}
            <Skeleton className="w-full h-40" />
            {/* Card content */}
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              {/* Footer actions */}
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        );
        
      case 'list':
        return (
          <div className={cn("space-y-3", className)}>
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-3 w-3/6" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        );
        
      case 'text':
        return (
          <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={cn(
                  "h-4",
                  i === lines - 1 ? "w-4/6" : "w-full",
                  className
                )} 
              />
            ))}
          </div>
        );
        
      case 'avatar':
        return (
          <div className={cn("flex items-center space-x-3", className)}>
            <Skeleton className={cn("h-12 w-12 rounded-full", className)} />
            {width && height ? null : (
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            )}
          </div>
        );
        
      case 'banner':
        return (
          <div className={cn("w-full", className)}>
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        );
        
      case 'button':
        return (
          <Skeleton className={cn("h-10 w-24 rounded-md", className)} />
        );
    }
  };
  
  // Apply custom dimensions if provided
  const skeletonStyles = {
    width: width || undefined,
    height: height || undefined,
  };
  
  // Wrap in motion component if animated
  if (animated) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeInVariants}
        transition={{ duration: 0.3 }}
        className={wrapperClassName}
        style={skeletonStyles}
      >
        {renderSkeleton()}
      </motion.div>
    );
  }
  
  // Otherwise just render the skeleton
  return (
    <div className={wrapperClassName} style={skeletonStyles}>
      {renderSkeleton()}
    </div>
  );
}
