'use client';

/**
 * Get the viewport dimensions
 * @returns Object with width and height properties
 */
export function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Get the visible viewport dimensions, accounting for virtual keyboard
 * Especially useful on mobile devices when keyboard is shown
 * @returns Object with width and height properties
 */
export function getVisibleViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  
  // Try to use visualViewport API first (modern browsers)
  if (window.visualViewport) {
    return {
      width: window.visualViewport.width,
      height: window.visualViewport.height
    };
  }
  
  // Fallback to innerWidth/Height
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Check if an element is currently visible in the viewport
 * @param element Element to check
 * @param partiallyVisible Whether partially visible elements should count
 * @returns Whether the element is visible
 */
export function isElementInViewport(element: HTMLElement, partiallyVisible = false): boolean {
  if (!element || typeof window === 'undefined') return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = partiallyVisible 
    ? ((rect.top <= windowHeight) && (rect.top + rect.height >= 0))
    : ((rect.top >= 0) && (rect.top + rect.height <= windowHeight));
    
  const horInView = partiallyVisible
    ? ((rect.left <= windowWidth) && (rect.left + rect.width >= 0))
    : ((rect.left >= 0) && (rect.left + rect.width <= windowWidth));
    
  return vertInView && horInView;
}

/**
 * Handle virtual keyboard issues on various devices
 * @param inputElement The input element that will receive focus
 */
export function handleVirtualKeyboard(inputElement: HTMLElement) {
  if (!inputElement || typeof window === 'undefined') return;
  
  // For iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  if (isIOS) {
    // iOS requires special handling for the virtual keyboard
    // When focusing on an input, scroll it into view if needed
    const scrollToInput = () => {
      setTimeout(() => {
        inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300); // Small delay to allow keyboard to appear
    };
    
    inputElement.addEventListener('focus', scrollToInput);
    
    // Return cleanup function
    return () => {
      inputElement.removeEventListener('focus', scrollToInput);
    };
  }
  
  // For Android devices
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isAndroid) {
    // Android can automatically adjust the viewport, but sometimes needs help
    // with positioning elements correctly when the keyboard opens
    const onResize = () => {
      if (document.activeElement === inputElement) {
        window.scrollTo(0, window.scrollY);
      }
    };
    
    window.addEventListener('resize', onResize);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }
  
  // Return empty cleanup by default
  return () => {};
}

/**
 * Scroll smoothly to an element
 * @param element Element to scroll to
 * @param offset Additional offset from the element
 */
export function scrollToElement(element: HTMLElement, offset = 0) {
  if (!element || typeof window === 'undefined') return;
  
  try {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  } catch (error) {
    // Fallback for older browsers
    window.scrollTo(0, element.offsetTop - offset);
  }
}

/**
 * Register event handlers for PWA installation
 * @param onBeforeInstall Handler called before install prompt
 * @param onInstallSuccess Handler called after successful install
 */
export function setupPWAInstallHandlers(
  onBeforeInstall?: () => void,
  onInstallSuccess?: () => void
) {
  if (typeof window === 'undefined') return () => {};
  
  let deferredPrompt: any = null;
  
  // Listen for the beforeinstallprompt event
  const beforeInstallHandler = (e: any) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    if (onBeforeInstall) onBeforeInstall();
  };
  
  window.addEventListener('beforeinstallprompt', beforeInstallHandler);
  
  // Track when the app is installed
  const appInstalledHandler = () => {
    // Clear the deferredPrompt
    deferredPrompt = null;
    // Notify success handler
    if (onInstallSuccess) onInstallSuccess();
  };
  
  window.addEventListener('appinstalled', appInstalledHandler);
  
  // Return a function that can be used to prompt installation
  const showInstallPrompt = async () => {
    if (!deferredPrompt) {
      return false;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    // We no longer need the prompt regardless of outcome
    deferredPrompt = null;
    
    return choiceResult.outcome === 'accepted';
  };
  
  // Return the prompt function and cleanup function
  return {
    showInstallPrompt,
    cleanup: () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    }
  };
}
