'use client';

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';

export interface MobileFormLayoutProps {
  children: ReactNode;
  spacing?: number;
  stacked?: boolean;
  scrollToFocused?: boolean;
  className?: string;
  autoHeight?: boolean;
  enableKeyboardAvoidance?: boolean;
}

/**
 * Mobile-optimized form layout that handles keyboard appearance
 * and provides appropriate spacing and structure for mobile forms.
 */
export const MobileFormLayout: React.FC<MobileFormLayoutProps> = ({
  children,
  spacing = 4,
  stacked = true,
  scrollToFocused = true,
  className,
  autoHeight = true,
  enableKeyboardAvoidance = true,
}) => {
  const { isMobile } = useViewport();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  // Handle keyboard appearance
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
        setIsKeyboardVisible(true);
        setKeyboardHeight(heightDifference);
      } else {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    // Initial check
    detectKeyboard();

    // Set up listeners
    window.addEventListener('resize', detectKeyboard);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', detectKeyboard);
    }

    return () => {
      window.removeEventListener('resize', detectKeyboard);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', detectKeyboard);
      }
    };
  }, [isMobile]);

  // Handle focus and scroll behavior
  useEffect(() => {
    if (!scrollToFocused || !formRef.current) return;

    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement) {
        setFocusedElement(e.target);
        
        // If keyboard is visible, scroll to the focused element
        if (isKeyboardVisible && scrollToFocused) {
          setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300); // Delay to allow keyboard to fully appear
        }
      }
    };

    // Add focus event listeners to form elements
    const formElement = formRef.current;
    formElement.addEventListener('focusin', handleFocus);

    return () => {
      formElement.removeEventListener('focusin', handleFocus);
    };
  }, [isKeyboardVisible, scrollToFocused]);

  return (
    <form
      ref={formRef}
      className={cn(
        'mobile-form-layout',
        `space-y-${spacing}`,
        stacked ? 'flex flex-col' : 'grid',
        className
      )}
      style={{
        // Add padding at the bottom when keyboard is visible to prevent form fields from being obscured
        ...(isKeyboardVisible && enableKeyboardAvoidance
          ? { paddingBottom: `${keyboardHeight}px` }
          : {}),
        ...(autoHeight ? { minHeight: '100%' } : {}),
      }}
      onSubmit={(e) => e.preventDefault()} // Prevent default form submission
    >
      {children}
      {isKeyboardVisible && enableKeyboardAvoidance && (
        // Add extra space at the bottom when keyboard is visible
        <div style={{ height: `${keyboardHeight}px` }} aria-hidden="true" />
      )}
    </form>
  );
};

export default MobileFormLayout;