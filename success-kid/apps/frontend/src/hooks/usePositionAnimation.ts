/**
 * Hook for animating position changes in leaderboards
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import useReducedMotion from './useReducedMotion';

/**
 * Custom hook to handle position change animations
 * @param currentPosition - Current position/rank
 * @param previousPosition - Previous position/rank
 * @param options - Animation options
 * @returns Animation state and control functions
 */
export function usePositionAnimation(
  currentPosition: number,
  previousPosition: number | undefined,
  options: {
    animationDuration?: number;
    delayStart?: boolean;
    onAnimationComplete?: () => void;
  } = {}
) {
  const {
    animationDuration = 800,
    delayStart = false,
    onAnimationComplete,
  } = options;
  
  const prefersReducedMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<ReturnType<typeof setTimeout>>();
  
  // Calculate position change
  const positionChange = previousPosition !== undefined 
    ? previousPosition - currentPosition 
    : 0;
  
  // Determine change type
  const improved = positionChange > 0;
  const declined = positionChange < 0;
  const noChange = positionChange === 0;
  
  // Start animation
  const startAnimation = () => {
    if (prefersReducedMotion || noChange) return;
    
    setIsAnimating(true);
    
    animationRef.current = setTimeout(() => {
      setIsAnimating(false);
      onAnimationComplete?.();
    }, animationDuration);
  };
  
  // Reset animation state
  const resetAnimation = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setIsAnimating(false);
  };
  
  // Handle animation on mount or when positions change
  useEffect(() => {
    if (!delayStart && previousPosition !== undefined) {
      startAnimation();
    }
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [currentPosition, previousPosition, prefersReducedMotion]);
  
  return {
    isAnimating,
    improved,
    declined,
    noChange,
    positionChange,
    startAnimation,
    resetAnimation,
  };
}

export default usePositionAnimation;
