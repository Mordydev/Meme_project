'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect whether the device supports touch
 * @returns Object with isTouchDevice status
 */
export function useTouch() {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if device supports touch events
    const hasTouchEvents = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 ||
                          (navigator as any).msMaxTouchPoints > 0;
    
    // Additional check for tablets/mobile specifically (optional)
    const isTouch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Set state based on detection
    setIsTouchDevice(hasTouchEvents || isTouch);
    
    // Add class to html element for CSS targeting
    if (hasTouchEvents || isTouch) {
      document.documentElement.classList.add('touch-device');
    } else {
      document.documentElement.classList.add('no-touch');
    }
    
    // Cleanup function
    return () => {
      document.documentElement.classList.remove('touch-device', 'no-touch');
    };
  }, []);
  
  return { isTouchDevice };
}

export default useTouch;
