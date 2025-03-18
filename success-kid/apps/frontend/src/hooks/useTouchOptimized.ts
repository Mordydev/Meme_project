'use client';

import { useEffect, useRef, RefObject } from 'react';
import { 
  isTouchDevice,
  hasSufficientTouchTargetSize,
  MIN_TOUCH_TARGET_SIZE,
  enhanceTapFeedback
} from '../lib/touch/touch-utils';

type TouchOptimizationOptions = {
  enhanceFeedback?: boolean;
  validateSize?: boolean;
  warnOnSmallTargets?: boolean;
};

/**
 * Hook to optimize elements for touch interactions
 * 
 * @param options Configuration options
 * @returns Ref to attach to the element to be optimized
 */
export function useTouchOptimized<T extends HTMLElement>(
  options: TouchOptimizationOptions = {}
): RefObject<T> {
  const {
    enhanceFeedback = true,
    validateSize = true,
    warnOnSmallTargets = true
  } = options;
  
  const elementRef = useRef<T>(null);
  
  useEffect(() => {
    // Only run optimizations on touch devices
    if (!isTouchDevice()) return;
    
    const element = elementRef.current;
    if (!element) return;
    
    // Add tap feedback enhancement if requested
    if (enhanceFeedback) {
      enhanceTapFeedback(element);
    }
    
    // Validate touch target size if requested
    if (validateSize) {
      // Give the element time to render properly
      setTimeout(() => {
        const isLargeEnough = hasSufficientTouchTargetSize(element);
        
        if (!isLargeEnough && warnOnSmallTargets) {
          const rect = element.getBoundingClientRect();
          console.warn(
            `Touch target size too small: ${rect.width}x${rect.height}px. ` +
            `Minimum recommended size is ${MIN_TOUCH_TARGET_SIZE}x${MIN_TOUCH_TARGET_SIZE}px.`,
            element
          );
        }
      }, 500);
    }
  }, [enhanceFeedback, validateSize, warnOnSmallTargets]);
  
  return elementRef;
}
