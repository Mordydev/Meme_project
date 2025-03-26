'use client';

import React, { ReactNode, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNetwork } from '@/hooks/useNetwork';

export interface LazyViewportProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  disabled?: boolean;
  className?: string;
  onIntersect?: () => void;
  once?: boolean;
  delayMs?: number;
  eagerLoadOnGoodConnection?: boolean;
  skip?: boolean;
}

/**
 * Component that loads content only when it enters or approaches the viewport,
 * with options for different loading strategies based on network conditions.
 */
export const LazyViewport: React.FC<LazyViewportProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '200px',
  disabled = false,
  className,
  onIntersect,
  once = true,
  delayMs = 0,
  eagerLoadOnGoodConnection = true,
  skip = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const network = useNetwork();
  
  // Determine if we should load eagerly based on connection quality
  const shouldEagerLoad = eagerLoadOnGoodConnection && (
    (network.downlink > 0 && network.downlink >= 5) || // Good downlink
    network.connectionType === 'wifi' || // WiFi connection
    network.connectionType === '4g' || // 4G connection
    network.effectiveConnectionType === '4g' // Effective 4G connection
  );
  
  // Set up intersection observer
  useEffect(() => {
    // Skip if disabled, already loaded, or explicitly skipped
    if (disabled || skip || (once && hasIntersected)) return;
    
    // If we should eager load and not yet loaded, set loaded state
    if (shouldEagerLoad && !isLoaded) {
      setIsLoaded(true);
      setHasIntersected(true);
      onIntersect?.();
      return;
    }
    
    // Set up intersection observer
    const element = containerRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          setHasIntersected(true);
          onIntersect?.();
          
          // Handle delay loading if specified
          if (delayMs > 0) {
            setTimeout(() => {
              setIsLoaded(true);
            }, delayMs);
          } else {
            setIsLoaded(true);
          }
          
          // Disconnect observer if only need to observe once
          if (once) {
            observer.disconnect();
          }
        }
      },
      {
        root: null, // viewport
        rootMargin,
        threshold,
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [
    disabled,
    hasIntersected,
    once,
    onIntersect,
    rootMargin,
    threshold,
    delayMs,
    shouldEagerLoad,
    isLoaded,
    skip,
  ]);
  
  // Skip lazy loading entirely if specified
  if (skip || disabled) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'lazy-viewport',
        className
      )}
      data-loaded={isLoaded ? 'true' : 'false'}
      data-intersecting={isIntersecting ? 'true' : 'false'}
    >
      {/* Show full content or fallback based on loading state */}
      {(isLoaded || shouldEagerLoad) ? children : fallback || null}
    </div>
  );
};

export default LazyViewport;