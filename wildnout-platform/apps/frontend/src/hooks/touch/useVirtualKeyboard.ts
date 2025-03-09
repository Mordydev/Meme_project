'use client';

import { useEffect, useRef, useState } from 'react';
import { getVisibleViewportSize } from '@/lib/utils/device';

interface VirtualKeyboardState {
  isOpen: boolean;
  height: number;
  viewportHeight: number;
}

/**
 * Hook to detect and handle virtual keyboard state
 * Particularly useful for mobile devices
 */
export function useVirtualKeyboard() {
  const [keyboardState, setKeyboardState] = useState<VirtualKeyboardState>({
    isOpen: false,
    height: 0,
    viewportHeight: 0
  });
  
  // Keep track of the previous viewport height to detect changes
  const prevHeightRef = useRef<number>(0);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set initial height
    const initialSize = getVisibleViewportSize();
    prevHeightRef.current = initialSize.height;
    
    setKeyboardState({
      isOpen: false,
      height: 0,
      viewportHeight: initialSize.height
    });
    
    const handleResize = () => {
      const { height } = getVisibleViewportSize();
      const prevHeight = prevHeightRef.current;
      
      // A significant decrease in height typically indicates keyboard opening
      // We use a threshold of 150px to account for browser UI and other elements
      const heightDiff = prevHeight - height;
      const isKeyboardOpen = heightDiff > 150;
      
      setKeyboardState({
        isOpen: isKeyboardOpen,
        height: isKeyboardOpen ? heightDiff : 0,
        viewportHeight: height
      });
      
      // Update previous height
      prevHeightRef.current = height;
    };
    
    // Use visualViewport API if available (more accurate for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      
      return () => {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);
  
  /**
   * Helper function to handle input focus by ensuring the input is visible
   * when the keyboard appears
   */
  const handleInputFocus = (inputRef: React.RefObject<HTMLElement>) => {
    if (!inputRef.current) return;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOS) {
      // iOS needs special handling
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    } else {
      // General approach for other devices
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  return {
    ...keyboardState,
    handleInputFocus
  };
}

export default useVirtualKeyboard;
