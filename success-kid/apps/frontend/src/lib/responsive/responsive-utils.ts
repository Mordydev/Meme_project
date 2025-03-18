'use client';

import { breakpoints } from './breakpoints';

/**
 * Returns true if the current viewport is considered mobile
 * (less than the 'md' breakpoint)
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.md;
}

/**
 * Returns true if the current viewport is considered tablet
 * (between 'md' and 'lg' breakpoints)
 */
export function isTabletViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
}

/**
 * Returns true if the current viewport is considered desktop
 * (greater than or equal to the 'lg' breakpoint)
 */
export function isDesktopViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.lg;
}

/**
 * Returns the current breakpoint name based on viewport width
 */
export function getCurrentBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  if (typeof window === 'undefined') return 'lg'; // Default for SSR
  
  const width = window.innerWidth;
  
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Determines if the device is touch-capable
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Primary check using the pointer media query
  if (window.matchMedia('(pointer: coarse)').matches) return true;
  
  // Fallback for older browsers
  return 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 || 
    (navigator as any).msMaxTouchPoints > 0;
}

/**
 * Gets the device pixel ratio (for high-DPI screens)
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Determines if the device is in landscape orientation
 */
export function isLandscapeOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(orientation: landscape)').matches;
}

/**
 * Detect low-end devices based on memory and processor limitations
 * This is experimental and not 100% reliable
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const memory = (navigator as any).deviceMemory;
  if (memory && memory <= 2) return true;
  
  // Consider low-end if CPU cores are limited
  const cpuCores = navigator.hardwareConcurrency;
  if (cpuCores && cpuCores <= 4) return true;
  
  return false;
}

/**
 * Estimate network connection type
 * Returns: 'slow-2g', '2g', '3g', '4g', or 'unknown'
 */
export function getConnectionType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (connection && connection.effectiveType) {
    return connection.effectiveType;
  }
  
  return 'unknown';
}
