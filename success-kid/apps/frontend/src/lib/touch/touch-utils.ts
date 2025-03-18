'use client';

import { isTouchDevice } from '../responsive/responsive-utils';

// Minimum size for touch targets (44x44 pixels per WCAG guidelines)
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Checks if a DOM element meets the minimum touch target size requirements
 * @param element The DOM element to check
 * @returns True if the element meets the minimum size requirements
 */
export function hasSufficientTouchTargetSize(element: HTMLElement): boolean {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  return width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
}

/**
 * Adds appropriate passive event listener options based on browser support
 * Improves touch performance by using passive listeners when possible
 * @param options Event listener options
 * @returns Enhanced options with passive flag when appropriate
 */
export function getPassiveEventOptions(options: AddEventListenerOptions = {}): AddEventListenerOptions {
  // Test if passive option is supported
  let supportsPassive = false;
  
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: function() {
        supportsPassive = true;
        return true;
      }
    });
    
    window.addEventListener('testpassive', null as any, opts);
    window.removeEventListener('testpassive', null as any, opts);
  } catch (e) {
    // Passive not supported
  }
  
  return supportsPassive ? { ...options, passive: true } : options;
}

/**
 * Calculates the appropriate size for a touch target based on device characteristics
 * Ensures elements are appropriately sized for the user's device
 * @param baseSize Base size in pixels
 * @returns Adjusted size based on device type and display density
 */
export function calculateOptimalTouchTargetSize(baseSize: number = MIN_TOUCH_TARGET_SIZE): number {
  if (typeof window === 'undefined') return baseSize;
  
  // Get device pixel ratio to adjust for high-DPI screens
  const pixelRatio = window.devicePixelRatio || 1;
  
  // For touch devices, ensure minimum size requirement is met
  if (isTouchDevice()) {
    return Math.max(baseSize, MIN_TOUCH_TARGET_SIZE);
  }
  
  // For non-touch devices, we can use a smaller base size
  return baseSize;
}

/**
 * Adds a tap highlight workaround for mobile Safari
 * Mobile Safari doesn't always show tap highlights, this ensures visual feedback
 * @param element The element to enhance
 */
export function enhanceTapFeedback(element: HTMLElement): void {
  if (!element) return;
  
  // Only apply to touch devices
  if (!isTouchDevice()) return;
  
  // Store original background
  const originalBackground = element.style.background;
  
  element.addEventListener('touchstart', function() {
    element.style.background = 'rgba(0, 0, 0, 0.1)';
  }, getPassiveEventOptions());
  
  element.addEventListener('touchend', function() {
    // Delay the reset slightly to ensure the user sees the feedback
    setTimeout(() => {
      element.style.background = originalBackground;
    }, 100);
  }, getPassiveEventOptions());
}

/**
 * Determines if the browser supports proper hover
 * Used to optimize interactions for touch vs mouse
 */
export function supportsHover(): boolean {
  if (typeof window === 'undefined') return true;
  
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Creates a touchable zone around a small target
 * Improves tap accuracy on small elements without changing visual size
 * @param element The element to enhance
 * @param padding Additional padding in pixels
 */
export function createTouchableArea(element: HTMLElement, padding: number = 10): void {
  if (!element) return;
  
  // Only apply to touch devices
  if (!isTouchDevice()) return;
  
  // Store original styles
  const originalPosition = element.style.position;
  const originalZIndex = element.style.zIndex;
  
  // Make sure the element has relative or absolute positioning
  if (originalPosition !== 'relative' && originalPosition !== 'absolute') {
    element.style.position = 'relative';
  }
  
  // Create a touch-friendly pseudo-element
  const touchArea = document.createElement('div');
  touchArea.style.position = 'absolute';
  touchArea.style.top = `-${padding}px`;
  touchArea.style.left = `-${padding}px`;
  touchArea.style.right = `-${padding}px`;
  touchArea.style.bottom = `-${padding}px`;
  touchArea.style.zIndex = originalZIndex || '1';
  touchArea.style.cursor = 'pointer';
  
  // Ensure the touch area is behind the content visually
  element.style.zIndex = '2';
  
  // Forward clicks from the touch area to the element
  touchArea.addEventListener('click', (e) => {
    e.stopPropagation();
    element.click();
  }, getPassiveEventOptions());
  
  // Add the touch area as a sibling
  element.parentNode?.insertBefore(touchArea, element);
}
