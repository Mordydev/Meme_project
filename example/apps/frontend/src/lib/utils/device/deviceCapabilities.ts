'use client';

/**
 * Detects device capabilities using feature detection
 * @returns An object with various device capability flags
 */
export function detectDeviceCapabilities() {
  if (typeof window === 'undefined') {
    // Default values for server-side rendering
    return {
      hasTouch: false,
      hasHover: true,
      hasFinePointer: true,
      hasCoarsePointer: false,
      hasMotion: true,
      prefersReducedMotion: false,
      prefersReducedData: false,
      prefersColorScheme: 'light',
      devicePixelRatio: 1,
      deviceMemory: undefined,
      effectiveType: undefined,
      isPWAInstalled: false,
      hasVibration: false,
      hasWebP: false,
      hasWebGL: false,
      isAndroid: false,
      isIOS: false,
      isStandalone: false,
    };
  }
  
  // Touch capabilities
  const hasTouch = 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 ||
                   (navigator as any).msMaxTouchPoints > 0;
  
  // Pointer capabilities
  const hasHover = window.matchMedia('(hover: hover)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  
  // Motion preferences
  const hasMotion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Data preferences
  const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
  
  // Color scheme preference
  const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  
  // Device characteristics
  const devicePixelRatio = window.devicePixelRatio || 1;
  const deviceMemory = (navigator as any).deviceMemory;
  const effectiveType = (navigator as any).connection?.effectiveType;
  
  // PWA detection
  const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
  
  // Vibration support
  const hasVibration = 'vibrate' in navigator;
  
  // WebP support detection
  let hasWebP = false;
  const webP = new Image();
  webP.onload = function() { hasWebP = !!(webP.height === 1); };
  webP.onerror = function() { hasWebP = false; };
  webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vv9UAA=';
  
  // WebGL support
  let hasWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    hasWebGL = !!(window.WebGLRenderingContext && 
                  (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    hasWebGL = false;
  }
  
  // OS detection
  const isAndroid = /Android/i.test(window.navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
  
  // Standalone mode
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  
  return {
    hasTouch,
    hasHover,
    hasFinePointer,
    hasCoarsePointer,
    hasMotion,
    prefersReducedMotion,
    prefersReducedData,
    prefersColorScheme,
    devicePixelRatio,
    deviceMemory,
    effectiveType,
    isPWAInstalled,
    hasVibration,
    hasWebP,
    hasWebGL,
    isAndroid,
    isIOS,
    isStandalone,
  };
}

export default detectDeviceCapabilities;
