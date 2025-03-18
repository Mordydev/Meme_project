'use client';

import { useState, useEffect } from 'react';
import { 
  generatePerformanceConfig, 
  applyPerformanceOptimizations,
  PerformanceConfig
} from '../lib/performance/performance-optimizations';
import { useReducedMotion } from './useReducedMotion';

/**
 * Hook to get and apply performance configuration based on device capabilities
 * 
 * @returns Current performance configuration
 */
export function usePerformanceConfig(): PerformanceConfig {
  const prefersReducedMotion = useReducedMotion();
  const [config, setConfig] = useState<PerformanceConfig | null>(null);

  useEffect(() => {
    // Detect if user prefers high contrast
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
    
    // Generate performance configuration based on device capabilities
    const performanceConfig = generatePerformanceConfig(
      prefersReducedMotion,
      prefersHighContrast
    );
    
    // Apply optimizations
    applyPerformanceOptimizations(performanceConfig);
    
    // Store configuration
    setConfig(performanceConfig);
    
    // Listen for reduced motion preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      const updatedConfig = generatePerformanceConfig(
        e.matches,
        prefersHighContrast
      );
      
      applyPerformanceOptimizations(updatedConfig);
      setConfig(updatedConfig);
    };
    
    // Listen for high contrast preference changes
    const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      const updatedConfig = generatePerformanceConfig(
        prefersReducedMotion,
        e.matches
      );
      
      applyPerformanceOptimizations(updatedConfig);
      setConfig(updatedConfig);
    };
    
    try {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
      highContrastQuery.addEventListener('change', handleHighContrastChange);
    } catch (err) {
      // Fallback for older browsers
      reducedMotionQuery.addListener(handleReducedMotionChange);
      highContrastQuery.addListener(handleHighContrastChange);
    }
    
    return () => {
      try {
        reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
        highContrastQuery.removeEventListener('change', handleHighContrastChange);
      } catch (err) {
        // Fallback for older browsers
        reducedMotionQuery.removeListener(handleReducedMotionChange);
        highContrastQuery.removeListener(handleHighContrastChange);
      }
    };
  }, [prefersReducedMotion]);

  // Return current configuration, or a default if not yet generated
  return config || generatePerformanceConfig(prefersReducedMotion, false);
}
