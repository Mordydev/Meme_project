'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useViewport } from '@/hooks/useViewport';

export interface VirtualKeyboardHandlerProps {
  children: ReactNode;
  onKeyboardShow?: (height: number) => void;
  onKeyboardHide?: () => void;
  adjustContentHeight?: boolean;
  className?: string;
}

/**
 * Component that detects virtual keyboard visibility and handles layout
 * adjustments to prevent the keyboard from obscuring form fields.
 */
export const VirtualKeyboardHandler: React.FC<VirtualKeyboardHandlerProps> = ({
  children,
  onKeyboardShow,
  onKeyboardHide,
  adjustContentHeight = true,
  className,
}) => {
  const { isMobile } = useViewport();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    if (!isMobile) return;
    
    // Function to detect keyboard appearance
    const detectKeyboard = () => {
      // Detecting keyboard on iOS and Android is different
      // This is a simplified approach that works in many cases
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;
      
      // If the visual viewport height is significantly less than the window height,
      // the keyboard is likely visible
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      const heightDifference = windowHeight - viewportHeight;
      
      // Usually keyboard takes at least 30% of the screen
      if (heightDifference > windowHeight * 0.2) {
        if (!isKeyboardVisible) {
          setIsKeyboardVisible(true);
          onKeyboardShow?.(heightDifference);
        }
        setKeyboardHeight(heightDifference);
      } else {
        if (isKeyboardVisible) {
          setIsKeyboardVisible(false);
          onKeyboardHide?.();
        }
        setKeyboardHeight(0);
      }
    };
    
    // Initial check
    detectKeyboard();
    
    // Set up listeners
    window.addEventListener('resize', detectKeyboard);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', detectKeyboard);
      window.visualViewport.addEventListener('scroll', detectKeyboard);
    }
    
    // Touch events can help detect keyboard in some cases
    document.addEventListener('touchstart', detectKeyboard);
    document.addEventListener('touchend', detectKeyboard);
    
    // Special workaround for iOS focus events
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', detectKeyboard);
      input.addEventListener('blur', detectKeyboard);
    });
    
    return () => {
      window.removeEventListener('resize', detectKeyboard);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', detectKeyboard);
        window.visualViewport.removeEventListener('scroll', detectKeyboard);
      }
      document.removeEventListener('touchstart', detectKeyboard);
      document.removeEventListener('touchend', detectKeyboard);
      
      inputs.forEach(input => {
        input.removeEventListener('focus', detectKeyboard);
        input.removeEventListener('blur', detectKeyboard);
      });
    };
  }, [isMobile, isKeyboardVisible, onKeyboardShow, onKeyboardHide]);
  
  return (
    <div 
      className={className}
      style={{
        // Add padding at the bottom when keyboard is visible to prevent form fields from being obscured
        ...(isKeyboardVisible && adjustContentHeight
          ? { paddingBottom: `${keyboardHeight}px` }
          : {}),
      }}
      data-keyboard-visible={isKeyboardVisible}
      data-keyboard-height={keyboardHeight}
    >
      {children}
      
      {isKeyboardVisible && adjustContentHeight && (
        // Add extra space at the bottom when keyboard is visible
        <div style={{ height: `${keyboardHeight}px` }} aria-hidden="true" />
      )}
    </div>
  );
};

export default VirtualKeyboardHandler;