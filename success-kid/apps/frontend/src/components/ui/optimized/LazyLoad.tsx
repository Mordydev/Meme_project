'use client';

/**
 * LazyLoad Component
 * 
 * Efficiently renders content only when it's about to enter the viewport,
 * reducing initial page load time and improving performance.
 */
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface LazyLoadProps {
  /** Content to render when in viewport */
  children: React.ReactNode;
  
  /** Whether to show placeholder before loading */
  showPlaceholder?: boolean;
  
  /** Placeholder to show before loading */
  placeholder?: React.ReactNode;
  
  /** Height of placeholder */
  height?: number | string;
  
  /** Distance from viewport to trigger loading (px) */
  threshold?: number;
  
  /** Whether to use Intersection Observer */
  useIntersectionObserver?: boolean;
  
  /** CSS class names */
  className?: string;
  
  /** Whether to fade in the content */
  fadeIn?: boolean;
  
  /** Whether to load immediately (bypass lazy loading) */
  loadImmediately?: boolean;
  
  /** Function to call when loaded */
  onLoad?: () => void;
}

/**
 * LazyLoad Component
 */
export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  showPlaceholder = true,
  placeholder,
  height,
  threshold = 100,
  useIntersectionObserver = true,
  className,
  fadeIn = true,
  loadImmediately = false,
  onLoad,
}) => {
  const [isVisible, setIsVisible] = useState(loadImmediately);
  const [hasLoaded, setHasLoaded] = useState(loadImmediately);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (loadImmediately && !hasLoaded) {
      setIsVisible(true);
      setHasLoaded(true);
      if (onLoad) onLoad();
      return;
    }
    
    if (!ref.current) return;
    
    const checkVisibility = () => {
      if (!ref.current || isVisible) return;
      
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      
      // Consider element visible if it's within the threshold of the viewport
      if (rect.top - threshold <= windowHeight && rect.bottom + threshold >= 0) {
        setIsVisible(true);
        
        // Call onLoad after a short delay to allow content to render
        setTimeout(() => {
          setHasLoaded(true);
          if (onLoad) onLoad();
        }, 100);
        
        // Remove scroll listener
        window.removeEventListener('scroll', checkVisibility);
      }
    };
    
    // Use Intersection Observer if available and requested
    if (useIntersectionObserver && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setIsVisible(true);
            
            // Call onLoad after a short delay to allow content to render
            setTimeout(() => {
              setHasLoaded(true);
              if (onLoad) onLoad();
            }, 100);
            
            // Stop observing once element is visible
            observer.disconnect();
          }
        },
        {
          rootMargin: `${threshold}px 0px ${threshold}px 0px`,
        }
      );
      
      observer.observe(ref.current);
      
      return () => {
        observer.disconnect();
      };
    } else {
      // Fall back to scroll event listening
      checkVisibility();
      window.addEventListener('scroll', checkVisibility, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', checkVisibility);
      };
    }
  }, [isVisible, threshold, useIntersectionObserver, onLoad, loadImmediately, hasLoaded]);
  
  // Default placeholder if none provided
  const defaultPlaceholder = (
    <div
      className="bg-gray-200 animate-pulse"
      style={{ height: height || '200px', width: '100%' }}
    />
  );
  
  return (
    <div
      ref={ref}
      className={cn(
        className,
        fadeIn && 'transition-opacity duration-300',
        isVisible && hasLoaded ? 'opacity-100' : fadeIn ? 'opacity-0' : 'opacity-100'
      )}
    >
      {isVisible ? (
        children
      ) : showPlaceholder ? (
        placeholder || defaultPlaceholder
      ) : null}
    </div>
  );
};

export default LazyLoad;
