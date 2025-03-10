'use client';

/**
 * Orientation types
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * Detect the current device orientation
 * @returns The current orientation as 'portrait' or 'landscape'
 */
export function getOrientation(): Orientation {
  if (typeof window === 'undefined') return 'portrait';
  
  if (window.screen && window.screen.orientation) {
    // Modern API
    const orientation = window.screen.orientation.type;
    return orientation.includes('portrait') ? 'portrait' : 'landscape';
  } else if (window.matchMedia) {
    // Fallback to matchMedia
    return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
  } else if (window.innerHeight && window.innerWidth) {
    // Last resort: just compare dimensions
    return window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape';
  }
  
  // Default fallback
  return 'portrait';
}

/**
 * Listen for orientation changes
 * @param callback Function to call when orientation changes
 * @returns A function to remove the listener
 */
export function addOrientationChangeListener(callback: (orientation: Orientation) => void) {
  if (typeof window === 'undefined') return () => {};
  
  const handleOrientationChange = () => {
    callback(getOrientation());
  };
  
  // Try to use the modern API first
  if (window.screen && window.screen.orientation) {
    window.screen.orientation.addEventListener('change', handleOrientationChange);
    return () => window.screen.orientation.removeEventListener('change', handleOrientationChange);
  } else {
    // Fallback to older window event
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }
}

/**
 * Returns true if device is in portrait mode
 */
export function isPortrait(): boolean {
  return getOrientation() === 'portrait';
}

/**
 * Returns true if device is in landscape mode
 */
export function isLandscape(): boolean {
  return getOrientation() === 'landscape';
}

/**
 * Lock the screen orientation (if supported by the device)
 * @param orientation The orientation to lock to
 * @returns Promise that resolves if successful
 */
export async function lockOrientation(orientation: 'portrait' | 'landscape'): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
      // Modern API
      await window.screen.orientation.lock(
        orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary'
      );
      return true;
    }
    
    // Older API (obsolete but still supported in some browsers)
    const screen = window.screen as any;
    if (screen.lockOrientation) {
      return screen.lockOrientation(
        orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary'
      );
    } else if (screen.mozLockOrientation) {
      return screen.mozLockOrientation(
        orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary'
      );
    } else if (screen.msLockOrientation) {
      return screen.msLockOrientation(
        orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary'
      );
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to lock orientation:', error);
    return false;
  }
}

/**
 * Unlock the screen orientation
 * @returns True if successfully unlocked
 */
export function unlockOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
      // Modern API
      window.screen.orientation.unlock();
      return true;
    }
    
    // Older API (obsolete but still supported in some browsers)
    const screen = window.screen as any;
    if (screen.unlockOrientation) {
      return screen.unlockOrientation();
    } else if (screen.mozUnlockOrientation) {
      return screen.mozUnlockOrientation();
    } else if (screen.msUnlockOrientation) {
      return screen.msUnlockOrientation();
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to unlock orientation:', error);
    return false;
  }
}
