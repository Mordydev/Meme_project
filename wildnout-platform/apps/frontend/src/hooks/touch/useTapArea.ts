'use client';

import { useCallback, useState } from 'react';
import useTouch from './useTouch';

// Default minimum touch target size based on WCAG guidelines
const MIN_TOUCH_SIZE = 44; // 44px x 44px

interface UseTapAreaOptions {
  minSize?: number;
  checkTarget?: boolean;
}

/**
 * Hook that helps with validating and enhancing touch targets
 * Used to ensure interactive elements meet accessibility guidelines
 */
export function useTapArea(options?: UseTapAreaOptions) {
  const { isTouchDevice } = useTouch();
  const [targetWarnings, setTargetWarnings] = useState<string[]>([]);
  
  const minSize = options?.minSize || MIN_TOUCH_SIZE;
  const checkTarget = options?.checkTarget !== undefined ? options.checkTarget : true;
  
  /**
   * Check if an element meets minimum touch target size requirements
   */
  const checkTouchTarget = useCallback((element: HTMLElement): boolean => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const { width, height } = rect;
    
    // Check if element meets minimum size requirements
    const meetsMinWidth = width >= minSize;
    const meetsMinHeight = height >= minSize;
    
    return meetsMinWidth && meetsMinHeight;
  }, [minSize]);
  
  /**
   * Generate props to enhance an element's tap area
   */
  const getTapAreaProps = useCallback((id?: string) => {
    if (!isTouchDevice) return {};
    
    return {
      ref: (el: HTMLElement | null) => {
        if (checkTarget && el && process.env.NODE_ENV === 'development') {
          const isValid = checkTouchTarget(el);
          if (!isValid) {
            const warning = `Touch target with${id ? ` id "${id}"` : ' no id'} is too small (min: ${minSize}x${minSize}px)`;
            if (!targetWarnings.includes(warning)) {
              setTargetWarnings(prev => [...prev, warning]);
              console.warn(warning, el);
            }
          }
        }
      },
      className: 'min-h-[44px] min-w-[44px] touch-manipulation',
      style: { touchAction: 'manipulation' }
    };
  }, [isTouchDevice, checkTarget, checkTouchTarget, minSize, targetWarnings]);
  
  return {
    getTapAreaProps,
    checkTouchTarget,
    targetWarnings,
    isTouchDevice
  };
}

export default useTapArea;
