'use client';

import React, { ReactNode, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface GestureHandlerProps {
  children: ReactNode;
  onSwipe?: (direction: SwipeDirection) => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  swipeThreshold?: number;
  longPressDelay?: number;
  className?: string;
  preventDefaultTouchMove?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Handles common mobile touch gestures like swipe, pinch, tap, and long press.
 * Provides a unified interface for gesture detection with reasonable defaults.
 */
export const GestureHandler: React.FC<GestureHandlerProps> = ({
  children,
  onSwipe,
  onPinch,
  onTap,
  onLongPress,
  disabled = false,
  swipeThreshold = 50,
  longPressDelay = 500,
  className,
  preventDefaultTouchMove = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<Point | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const multiTouchStartRef = useRef<Point[]>([]);
  const initialDistanceRef = useRef<number>(0);
  
  const [isTouching, setIsTouching] = useState(false);
  
  // Calculate distance between two points
  const getDistance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };
  
  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    setIsTouching(true);
    const touches = e.touches;
    
    // Single touch - could be tap, long press, or swipe
    if (touches.length === 1) {
      const touch = touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartTimeRef.current = Date.now();
      
      // Set up long press timer
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress();
          // Clear touch refs to prevent other gestures after long press
          touchStartRef.current = null;
        }, longPressDelay);
      }
    }
    // Multi-touch - could be pinch
    else if (touches.length === 2 && onPinch) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      multiTouchStartRef.current = [
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY },
      ];
      initialDistanceRef.current = getDistance(
        multiTouchStartRef.current[0],
        multiTouchStartRef.current[1]
      );
    }
  };
  
  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !touchStartRef.current) return;
    
    if (preventDefaultTouchMove) {
      e.preventDefault();
    }
    
    const touches = e.touches;
    
    // Multi-touch pinch gesture
    if (touches.length === 2 && onPinch && initialDistanceRef.current > 0) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const currentPoints = [
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY },
      ];
      const currentDistance = getDistance(currentPoints[0], currentPoints[1]);
      const scale = currentDistance / initialDistanceRef.current;
      
      onPinch(scale);
    }
    
    // Cancel long press if moved beyond threshold
    if (longPressTimerRef.current && touchStartRef.current) {
      const touch = touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };
  
  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsTouching(false);
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (disabled || !touchStartRef.current) return;
    
    const touchEndTime = Date.now();
    const touchStart = touchStartRef.current;
    
    // Last touch position
    let endX = touchStart.x;
    let endY = touchStart.y;
    
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      endX = touch.clientX;
      endY = touch.clientY;
    }
    
    const deltaX = endX - touchStart.x;
    const deltaY = endY - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Detect swipe if distance exceeds threshold
    if (onSwipe && distance >= swipeThreshold) {
      // Determine swipe direction by major axis
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        onSwipe(deltaX > 0 ? 'right' : 'left');
      } else {
        onSwipe(deltaY > 0 ? 'down' : 'up');
      }
    }
    // Detect tap if small movement and short duration
    else if (onTap && distance < 10 && (touchEndTime - touchStartTimeRef.current) < 300) {
      onTap();
    }
    
    // Reset touch tracking
    touchStartRef.current = null;
    multiTouchStartRef.current = [];
    initialDistanceRef.current = 0;
  };
  
  // Handle touch cancel
  const handleTouchCancel = () => {
    setIsTouching(false);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    touchStartRef.current = null;
    multiTouchStartRef.current = [];
    initialDistanceRef.current = 0;
  };
  
  return (
    <motion.div
      ref={containerRef}
      className={cn('gesture-handler', { 'is-touching': isTouching }, className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </motion.div>
  );
};

export default GestureHandler;