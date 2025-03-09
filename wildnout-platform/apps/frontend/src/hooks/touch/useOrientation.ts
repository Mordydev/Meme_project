'use client';

import { useState, useEffect } from 'react';
import { getOrientation, addOrientationChangeListener, Orientation } from '@/lib/utils/device';

interface UseOrientationOptions {
  lockOrientation?: Orientation;
}

/**
 * Hook to track and manage device orientation
 * @param options Configuration options
 * @returns Object with orientation state and control functions
 */
export function useOrientation(options?: UseOrientationOptions) {
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  
  useEffect(() => {
    // Set initial orientation
    setOrientation(getOrientation());
    
    // Add orientation change listener
    const removeListener = addOrientationChangeListener((newOrientation) => {
      setOrientation(newOrientation);
    });
    
    // Handle orientation locking if requested
    if (options?.lockOrientation && typeof window !== 'undefined') {
      if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
        try {
          window.screen.orientation.lock(
            options.lockOrientation === 'portrait' ? 'portrait' : 'landscape'
          ).catch(err => {
            console.warn('Failed to lock orientation:', err);
          });
        } catch (error) {
          console.warn('Error locking orientation:', error);
        }
      }
    }
    
    // Cleanup
    return () => {
      removeListener();
      
      // Unlock orientation when component unmounts
      if (options?.lockOrientation && typeof window !== 'undefined') {
        if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
          try {
            window.screen.orientation.unlock();
          } catch (error) {
            console.warn('Error unlocking orientation:', error);
          }
        }
      }
    };
  }, [options?.lockOrientation]);
  
  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
}

export default useOrientation;
