'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { bezierCurves } from '@/lib/animations';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';

interface DataLoaderProps {
  isLoading: boolean;
  children: ReactNode;
  className?: string;
  loadingText?: string;
  variant?: 'card' | 'list' | 'text' | 'avatar' | 'banner' | 'button';
  lines?: number;
  error?: Error | null;
  errorComponent?: ReactNode;
  showLoadingText?: boolean;
  loadingDelay?: number;
  minimumLoadingTime?: number;
}

/**
 * DataLoader - Displays a premium loading state during data fetching
 * 
 * @example
 * <DataLoader isLoading={isLoading} variant="card">
 *   <UserProfile data={userData} />
 * </DataLoader>
 */
export function DataLoader({
  isLoading,
  children,
  className,
  loadingText = 'Loading',
  variant = 'text',
  lines = 3,
  error = null,
  errorComponent = null,
  showLoadingText = true,
  loadingDelay = 300,
  minimumLoadingTime = 500,
}: DataLoaderProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Handle errors
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <div className="py-4 px-2 text-center rounded-md border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30">
        <p className="text-red-600 dark:text-red-400 font-medium">Error loading data</p>
        <p className="text-sm text-red-500 dark:text-red-300 mt-1">{error.message}</p>
      </div>
    );
  }
  
  // Basic animation variants for transitions
  const contentVariants = prefersReducedMotion 
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
      };
  
  // Generate loading dots animation for text
  const LoadingDots = () => {
    if (prefersReducedMotion) {
      return <span>...</span>;
    }
    
    return (
      <span className="inline-flex ml-1">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatType: "reverse",
              delay: dot * 0.2,
            }}
          >
            .
          </motion.span>
        ))}
      </span>
    );
  };
  
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="w-full"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
            transition={{
              duration: 0.3,
              ease: bezierCurves.standard,
              delay: loadingDelay / 1000,
            }}
          >
            <div className="space-y-2">
              <SkeletonLoader 
                variant={variant} 
                lines={lines} 
                className={className}
              />
              
              {/* Optional loading text with animated dots */}
              {showLoadingText && (
                <div className="flex justify-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>{loadingText}</span>
                  <LoadingDots />
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
            transition={{
              duration: 0.3,
              ease: bezierCurves.standard,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
