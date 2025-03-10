'use client';

import { useState, useEffect } from 'react';
import { detectDeviceCapabilities } from '@/lib/utils/device';

/**
 * Hook to access device capabilities
 * @returns Object with device capability properties
 */
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState(detectDeviceCapabilities());
  
  useEffect(() => {
    // Update capabilities after initial render to get client-side values
    // This is important for SSR compatibility
    setCapabilities(detectDeviceCapabilities());
    
    // Listen for relevant changes
    const mediaQueryColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const mediaQueryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mediaQueryReducedData = window.matchMedia('(prefers-reduced-data: reduce)');
    
    const handleChange = () => {
      setCapabilities(detectDeviceCapabilities());
    };
    
    // Add listeners
    mediaQueryColorScheme.addEventListener('change', handleChange);
    mediaQueryReducedMotion.addEventListener('change', handleChange);
    mediaQueryReducedData.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQueryColorScheme.removeEventListener('change', handleChange);
      mediaQueryReducedMotion.removeEventListener('change', handleChange);
      mediaQueryReducedData.removeEventListener('change', handleChange);
    };
  }, []);
  
  return capabilities;
}

export default useDeviceCapabilities;
