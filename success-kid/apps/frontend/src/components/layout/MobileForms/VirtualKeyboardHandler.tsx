'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '../MobileLayouts/ViewportContext';

export interface VirtualKeyboardHandlerProps {
  children: React.ReactNode;
  extraPadding?: number;
  allowResize?: boolean;
  scrollToFocused?: boolean;
  persistentInputBarMode?: boolean;
  className?: string;
  onKeyboardOpen?: (keyboardHeight: number) => void;
  onKeyboardClose?: () => void;
}

/**
 * A component that handles virtual keyboard appearance on mobile
 * 
 * @param children - Content to render
 * @param extraPadding - Extra padding to add when keyboard is visible (px)
 * @param allowResize - Whether to allow container resizing when keyboard opens
 * @param scrollToFocused - Whether to auto-scroll to focused elements
 * @param persistentInputBarMode - Whether inputs stick to the bottom of the screen
 * @param className - Additional CSS classes
 * @param onKeyboardOpen - Callback when keyboard opens
 * @param onKeyboardClose - Callback when keyboard closes
 */
export function VirtualKeyboardHandler({
  children,
  extraPadding = 20,
  allowResize = true,
  scrollToFocused = true,
  persistentInputBarMode = false,
  className,
  onKeyboardOpen,
  onKeyboardClose,
}: VirtualKeyboardHandlerProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useViewport();
  const initialViewportHeightRef = useRef<number>(0);
  
  // Initially set the viewport height reference
  useEffect(() => {
    if (isMobile && typeof window !== 'undefined') {
      initialViewportHeightRef.current = window.innerHeight;
    }
  }, [isMobile]);
  
  // Handle resize events for keyboard detection
  useEffect(() => {
    if (!isMobile) return;
    
    const handleResize = () => {
      // A significant decrease in viewport height often indicates the keyboard is visible
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeightRef.current - currentHeight;
      const wasKeyboardVisible = isKeyboardVisible;
      const isKeyboard = heightDifference > 150; // Threshold for keyboard detection
      
      if (isKeyboard !== wasKeyboardVisible) {
        setIsKeyboardVisible(isKeyboard);
        
        if (isKeyboard) {
          setKeyboardHeight(heightDifference);
          onKeyboardOpen?.(heightDifference);
        } else {
          onKeyboardClose?.();
          
          // Reset initial height reference when keyboard closes
          initialViewportHeightRef.current = window.innerHeight;
        }
      }
    };
    
    // Listen for resize and orientation events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile, isKeyboardVisible, onKeyboardOpen, onKeyboardClose]);
  
  // Handle focusing input elements
  useEffect(() => {
    if (!isMobile || !scrollToFocused) return;
    
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Only handle input elements
      if (
        target &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'SELECT' ||
         target.tagName === 'TEXTAREA')
      ) {
        setFocusedElement(target);
        
        // If keyboard is already visible, scroll to the element immediately
        if (isKeyboardVisible) {
          scrollToElement(target);
        }
      }
    };
    
    // Handle blur events to track when elements lose focus
    const handleBlur = () => {
      setFocusedElement(null);
    };
    
    // Scroll to the focused element with a delay to allow layout changes
    const scrollToElement = (element: HTMLElement) => {
      // Use a small delay to ensure any layout adjustments have occurred
      setTimeout(() => {
        if (persistentInputBarMode) {
          // In persistent mode, we bring the viewport to make the input visible
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else {
          // Calculate position and scroll specifically
          const elementRect = element.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          
          if (containerRect) {
            const elementBottom = elementRect.bottom;
            const containerBottom = containerRect.bottom - keyboardHeight - extraPadding;
            
            if (elementBottom > containerBottom) {
              const scrollAmount = elementBottom - containerBottom;
              if (containerRef.current) {
                containerRef.current.scrollTop += scrollAmount;
              }
            }
          }
        }
      }, 300);
    };
    
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);
    
    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, [isMobile, scrollToFocused, isKeyboardVisible, keyboardHeight, extraPadding, persistentInputBarMode]);
  
  // Scroll to focused element when keyboard becomes visible
  useEffect(() => {
    if (isKeyboardVisible && focusedElement && scrollToFocused) {
      // Use a small delay to ensure the keyboard has fully appeared
      setTimeout(() => {
        if (persistentInputBarMode) {
          focusedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else {
          // Position calculation similar to above
          const elementRect = focusedElement.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          
          if (containerRect) {
            const elementBottom = elementRect.bottom;
            const containerBottom = containerRect.bottom - keyboardHeight - extraPadding;
            
            if (elementBottom > containerBottom) {
              const scrollAmount = elementBottom - containerBottom;
              if (containerRef.current) {
                containerRef.current.scrollTop += scrollAmount;
              }
            }
          }
        }
      }, 300);
    }
  }, [isKeyboardVisible, focusedElement, scrollToFocused, keyboardHeight, extraPadding, persistentInputBarMode]);
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'virtual-keyboard-handler',
        persistentInputBarMode && 'flex flex-col',
        className
      )}
      style={{
        // Apply padding to prevent content from being hidden under the keyboard
        ...(isKeyboardVisible && !allowResize && !persistentInputBarMode
          ? { paddingBottom: `${keyboardHeight + extraPadding}px` }
          : {}),
        // If in persistent mode, create a full-height flexbox context
        ...(persistentInputBarMode
          ? { height: '100%', overflow: 'hidden' }
          : {}),
      }}
    >
      {/* If in persistent input bar mode, separate content from input area */}
      {persistentInputBarMode ? (
        <>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          {isKeyboardVisible && (
            <div
              style={{ height: `${keyboardHeight + extraPadding}px` }}
              className="flex-shrink-0"
            />
          )}
        </>
      ) : (
        children
      )}
    </div>
  );
}
