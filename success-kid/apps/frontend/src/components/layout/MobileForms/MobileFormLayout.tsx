'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '../MobileLayouts/ViewportContext';

export interface MobileFormLayoutProps {
  children: React.ReactNode;
  spacing?: number;
  stacked?: boolean;
  scrollToFocused?: boolean;
  fullWidth?: boolean;
  className?: string;
  padding?: string;
  avoidKeyboard?: boolean;
  autoHeight?: boolean;
  minHeight?: string;
}

/**
 * A layout component designed for mobile-friendly forms
 * 
 * @param children - The form elements
 * @param spacing - Space between form elements
 * @param stacked - Whether to stack elements vertically
 * @param scrollToFocused - Whether to auto-scroll to focused elements
 * @param fullWidth - Whether form elements should take full width
 * @param className - Additional CSS classes
 * @param padding - Custom padding
 * @param avoidKeyboard - Whether to adjust layout when virtual keyboard appears
 * @param autoHeight - Whether to adjust height automatically
 * @param minHeight - Minimum height of the form
 */
export function MobileFormLayout({
  children,
  spacing = 6,
  stacked = true,
  scrollToFocused = true,
  fullWidth = true,
  className,
  padding = 'p-4',
  avoidKeyboard = true,
  autoHeight = true,
  minHeight = 'auto',
}: MobileFormLayoutProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { isMobile } = useViewport();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Calculate spacing class
  const getSpacingClass = () => {
    const spacingMap: Record<number, string> = {
      0: 'space-y-0',
      1: 'space-y-1',
      2: 'space-y-2',
      3: 'space-y-3',
      4: 'space-y-4',
      5: 'space-y-5',
      6: 'space-y-6',
      8: 'space-y-8',
      10: 'space-y-10',
      12: 'space-y-12',
    };
    
    return spacingMap[spacing] || `space-y-${spacing}`;
  };
  
  // Handle scroll to focused element
  useEffect(() => {
    if (!scrollToFocused || !isMobile) return;
    
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Only scroll for input elements
      if (
        target &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'SELECT' ||
         target.tagName === 'TEXTAREA')
      ) {
        // Add a small delay to allow any layout changes to occur
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 100);
      }
    };
    
    // Listen for focus events on form elements
    document.addEventListener('focus', handleFocus, true);
    
    return () => {
      document.removeEventListener('focus', handleFocus, true);
    };
  }, [scrollToFocused, isMobile]);
  
  // Handle virtual keyboard
  useEffect(() => {
    if (!avoidKeyboard || !isMobile) return;
    
    let initialViewportHeight = window.innerHeight;
    
    const handleResize = () => {
      // A significant decrease in viewport height often indicates the keyboard is visible
      const heightDifference = initialViewportHeight - window.innerHeight;
      const isKeyboard = heightDifference > 100;
      
      setIsKeyboardVisible(isKeyboard);
      
      if (isKeyboard) {
        setKeyboardHeight(heightDifference);
      } else {
        initialViewportHeight = window.innerHeight;
      }
    };
    
    // Listen for resize events which can indicate keyboard showing/hiding
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [avoidKeyboard, isMobile]);
  
  return (
    <form
      ref={formRef}
      className={cn(
        'mobile-form-layout',
        stacked && getSpacingClass(),
        fullWidth && 'w-full',
        padding,
        className
      )}
      style={{
        minHeight,
        ...(autoHeight && { height: isKeyboardVisible ? `calc(100vh - ${keyboardHeight}px)` : 'auto' }),
        ...(isKeyboardVisible && avoidKeyboard && { paddingBottom: `${keyboardHeight * 0.7}px` }),
      }}
      onSubmit={(e) => e.preventDefault()}
    >
      {children}
      
      {/* Add hidden element at the bottom to ensure scroll works properly */}
      {isMobile && (avoidKeyboard || scrollToFocused) && (
        <div className="h-1 w-full" />
      )}
    </form>
  );
}
