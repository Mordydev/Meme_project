'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface GestureHandlerProps {
  children: React.ReactNode;
  onSwipe?: (direction: SwipeDirection, velocity: number, distance: number) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onTap?: (position: { x: number; y: number }, count: number) => void;
  onPan?: (delta: { x: number; y: number }, absolute: { x: number; y: number }) => void;
  onPanStart?: (position: { x: number; y: number }) => void;
  onPanEnd?: (velocity: { x: number; y: number }) => void;
  onLongPress?: (position: { x: number; y: number }) => void;
  swipeThreshold?: number;
  longPressThreshold?: number;
  doubleTapThreshold?: number;
  disabled?: boolean;
  preventScroll?: boolean;
  preventDefaultTouchAction?: boolean;
  className?: string;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
}

interface GestureState {
  touches: TouchPoint[];
  isPanning: boolean;
  isMultiTouch: boolean;
  initialDistance: number;
  initialAngle: number;
  lastTapTime: number;
  tapCount: number;
  longPressTimer: NodeJS.Timeout | null;
}

/**
 * A component that handles various touch gestures and triggers callbacks
 * 
 * @param children - The content to apply gestures to
 * @param onSwipe - Callback when swipe gesture is detected
 * @param onPinch - Callback when pinch gesture is detected
 * @param onTap - Callback when tap gesture is detected
 * @param onPan - Callback when pan gesture is ongoing
 * @param onPanStart - Callback when pan gesture starts
 * @param onPanEnd - Callback when pan gesture ends
 * @param onLongPress - Callback when long press is detected
 * @param swipeThreshold - Distance threshold for swipe detection (px)
 * @param longPressThreshold - Time threshold for long press detection (ms)
 * @param doubleTapThreshold - Time threshold for double tap detection (ms)
 * @param disabled - Whether gestures are disabled
 * @param preventScroll - Whether to prevent scrolling during gestures
 * @param preventDefaultTouchAction - Whether to prevent default touch actions
 * @param className - Additional CSS classes
 */
export function GestureHandler({
  children,
  onSwipe,
  onPinch,
  onTap,
  onPan,
  onPanStart,
  onPanEnd,
  onLongPress,
  swipeThreshold = 50,
  longPressThreshold = 500,
  doubleTapThreshold = 300,
  disabled = false,
  preventScroll = false,
  preventDefaultTouchAction = false,
  className,
}: GestureHandlerProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Use ref for gesture state to avoid re-renders during gesture
  const gestureStateRef = useRef<GestureState>({
    touches: [],
    isPanning: false,
    isMultiTouch: false,
    initialDistance: 0,
    initialAngle: 0,
    lastTapTime: 0,
    tapCount: 0,
    longPressTimer: null,
  });
  
  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    // Prevent default to disable scroll/zoom if needed
    if (preventDefaultTouchAction) {
      e.preventDefault();
    }
    
    const state = gestureStateRef.current;
    const currentTouches = Array.from(e.touches);
    
    // Create touch points from current touches
    const touchPoints: TouchPoint[] = currentTouches.map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    }));
    
    // Update gesture state
    state.touches = touchPoints;
    state.isMultiTouch = touchPoints.length > 1;
    
    // Calculate initial values for multi-touch gestures
    if (state.isMultiTouch && touchPoints.length === 2) {
      const dx = touchPoints[1].x - touchPoints[0].x;
      const dy = touchPoints[1].y - touchPoints[0].y;
      state.initialDistance = Math.sqrt(dx * dx + dy * dy);
      state.initialAngle = Math.atan2(dy, dx);
    }
    
    // Start panning gesture
    if (touchPoints.length === 1) {
      state.isPanning = true;
      
      // Trigger pan start callback
      if (onPanStart) {
        onPanStart({
          x: touchPoints[0].x,
          y: touchPoints[0].y,
        });
      }
      
      // Set long press timer
      if (onLongPress) {
        state.longPressTimer = setTimeout(() => {
          onLongPress({
            x: touchPoints[0].x,
            y: touchPoints[0].y,
          });
          state.longPressTimer = null;
        }, longPressThreshold);
      }
    }
  }, [disabled, onLongPress, onPanStart, longPressThreshold, preventDefaultTouchAction]);
  
  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    // Prevent default to disable scroll/zoom if needed
    if (preventScroll) {
      e.preventDefault();
    }
    
    const state = gestureStateRef.current;
    const currentTouches = Array.from(e.touches);
    
    // Update touch positions
    currentTouches.forEach(touch => {
      const index = state.touches.findIndex(t => t.id === touch.identifier);
      if (index !== -1) {
        state.touches[index].x = touch.clientX;
        state.touches[index].y = touch.clientY;
      }
    });
    
    // Handle pinch gesture
    if (state.isMultiTouch && state.touches.length === 2 && onPinch) {
      const touch1 = state.touches[0];
      const touch2 = state.touches[1];
      
      const dx = touch2.x - touch1.x;
      const dy = touch2.y - touch1.y;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate scale change
      const scale = currentDistance / state.initialDistance;
      
      // Calculate center point
      const center = {
        x: (touch1.x + touch2.x) / 2,
        y: (touch1.y + touch2.y) / 2,
      };
      
      onPinch(scale, center);
    }
    
    // Handle pan gesture
    if (state.isPanning && state.touches.length === 1 && onPan) {
      const touch = state.touches[0];
      
      onPan(
        {
          x: touch.x - touch.startX,
          y: touch.y - touch.startY
        },
        {
          x: touch.x,
          y: touch.y
        }
      );
      
      // Clear long press timer if user moves too much
      if (
        state.longPressTimer &&
        (Math.abs(touch.x - touch.startX) > 10 || Math.abs(touch.y - touch.startY) > 10)
      ) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }
    }
  }, [disabled, onPan, onPinch, preventScroll]);
  
  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const state = gestureStateRef.current;
    const currentTime = Date.now();
    
    // Get remaining touches
    const remainingTouches = Array.from(e.touches);
    const endedTouches = state.touches.filter(
      t => !remainingTouches.some(rt => rt.identifier === t.id)
    );
    
    // Update touch state
    state.touches = state.touches.filter(
      t => remainingTouches.some(rt => rt.identifier === t.id)
    );
    
    // Handle swipe gesture
    if (onSwipe && endedTouches.length === 1) {
      const touch = endedTouches[0];
      const deltaX = touch.x - touch.startX;
      const deltaY = touch.y - touch.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = currentTime - touch.startTime;
      const velocity = distance / duration;
      
      // Determine swipe direction if distance is above threshold
      if (distance >= swipeThreshold) {
        let direction: SwipeDirection;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
        
        onSwipe(direction, velocity, distance);
      }
    }
    
    // Handle tap gesture
    if (
      onTap &&
      endedTouches.length === 1 &&
      state.touches.length === 0 &&
      !state.isMultiTouch
    ) {
      const touch = endedTouches[0];
      const deltaX = touch.x - touch.startX;
      const deltaY = touch.y - touch.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = currentTime - touch.startTime;
      
      // Detect tap if:
      // 1. Moved less than 10px
      // 2. Duration less than 200ms
      if (distance < 10 && duration < 200) {
        // Check for double tap
        if (currentTime - state.lastTapTime < doubleTapThreshold) {
          state.tapCount++;
        } else {
          state.tapCount = 1;
        }
        
        state.lastTapTime = currentTime;
        
        onTap(
          { x: touch.x, y: touch.y },
          state.tapCount
        );
      }
    }
    
    // Handle pan end
    if (
      onPanEnd &&
      state.isPanning &&
      endedTouches.length === 1 &&
      state.touches.length === 0
    ) {
      const touch = endedTouches[0];
      const duration = currentTime - touch.startTime;
      const deltaX = touch.x - touch.startX;
      const deltaY = touch.y - touch.startY;
      
      // Calculate velocity
      const velocityX = deltaX / duration;
      const velocityY = deltaY / duration;
      
      onPanEnd({ x: velocityX, y: velocityY });
      state.isPanning = false;
    }
    
    // Clear long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
    
    // Reset multi-touch state if no touches remain
    if (state.touches.length === 0) {
      state.isMultiTouch = false;
      state.isPanning = false;
    }
  }, [disabled, onSwipe, onTap, onPanEnd, swipeThreshold, doubleTapThreshold]);
  
  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    const state = gestureStateRef.current;
    
    // Clear all touch state
    state.touches = [];
    state.isMultiTouch = false;
    state.isPanning = false;
    
    // Clear long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      const state = gestureStateRef.current;
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }
    };
  }, []);
  
  return (
    <div
      ref={elementRef}
      className={cn('gesture-handler', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={preventDefaultTouchAction ? { touchAction: 'none' } : undefined}
    >
      {children}
    </div>
  );
}
