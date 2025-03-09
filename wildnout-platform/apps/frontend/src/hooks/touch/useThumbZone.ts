'use client';

import { useEffect, useState } from 'react';
import useTouch from './useTouch';

type ThumbZone = 'primary' | 'secondary' | 'tertiary';

interface UseThumbZoneOptions {
  divisions?: {
    primary: number; // Percentage of screen height for primary zone (from bottom)
    secondary: number; // Percentage for secondary zone
  }
}

/**
 * Hook that helps determine optimal touch zones based on device orientation and size
 * Used to optimize placement of interactive elements for thumb reach
 */
export function useThumbZone(options?: UseThumbZoneOptions) {
  const { isTouchDevice } = useTouch();
  const [thumbZones, setThumbZones] = useState<{
    primary: number; 
    secondary: number;
    height: number;
    width: number;
  }>({
    primary: 0,
    secondary: 0,
    height: 0,
    width: 0
  });
  
  // Default divisions: Primary zone is bottom 30%, secondary is next 30%
  const divisions = options?.divisions || { primary: 30, secondary: 30 };
  
  useEffect(() => {
    if (!isTouchDevice || typeof window === 'undefined') return;
    
    const calculateZones = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      
      // Calculate zones based on screen height
      const primaryZone = height * (divisions.primary / 100);
      const secondaryZone = height * (divisions.secondary / 100);
      
      setThumbZones({
        primary: primaryZone,
        secondary: secondaryZone,
        height,
        width
      });
    };
    
    // Calculate on mount
    calculateZones();
    
    // Recalculate on resize and orientation change
    window.addEventListener('resize', calculateZones);
    window.addEventListener('orientationchange', calculateZones);
    
    return () => {
      window.removeEventListener('resize', calculateZones);
      window.removeEventListener('orientationchange', calculateZones);
    };
  }, [isTouchDevice, divisions]);
  
  /**
   * Determine which thumb zone an element is in based on its position
   */
  const getElementThumbZone = (element: HTMLElement): ThumbZone => {
    if (!isTouchDevice || !element) return 'primary';
    
    const rect = element.getBoundingClientRect();
    const bottomPosition = thumbZones.height - rect.bottom;
    
    if (bottomPosition <= thumbZones.primary) return 'primary';
    if (bottomPosition <= thumbZones.primary + thumbZones.secondary) return 'secondary';
    return 'tertiary';
  };
  
  /**
   * Check if an element is in the primary thumb zone
   */
  const isInPrimaryZone = (element: HTMLElement): boolean => {
    return getElementThumbZone(element) === 'primary';
  };
  
  return {
    getElementThumbZone,
    isInPrimaryZone,
    zones: thumbZones,
    isTouchDevice
  };
}

export default useThumbZone;
