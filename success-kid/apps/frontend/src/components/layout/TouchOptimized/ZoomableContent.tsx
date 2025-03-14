'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useViewport } from '../MobileLayouts/ViewportContext';

export interface ZoomableContentProps {
  children: React.ReactNode;
  className?: string;
  maxScale?: number;
  minScale?: number;
  initialScale?: number;
  dragEnabled?: boolean;
  boundaryConstraints?: boolean;
  doubleTapToZoom?: boolean;
  doubleTapScale?: number;
  onZoomChange?: (scale: number) => void;
  resetOnDoubleClick?: boolean;
}

/**
 * A component that enables pinch-to-zoom functionality
 * 
 * @param children - The zoomable content
 * @param className - Additional CSS classes
 * @param maxScale - Maximum zoom scale
 * @param minScale - Minimum zoom scale
 * @param initialScale - Initial zoom scale
 * @param dragEnabled - Whether dragging is enabled
 * @param boundaryConstraints - Whether to constrain dragging to boundaries
 * @param doubleTapToZoom - Whether double-tap to zoom is enabled
 * @param doubleTapScale - Scale to apply on double-tap
 * @param onZoomChange - Callback when zoom scale changes
 * @param resetOnDoubleClick - Whether to reset zoom on double-click
 */
export function ZoomableContent({
  children,
  className,
  maxScale = 3,
  minScale = 1,
  initialScale = 1,
  dragEnabled = true,
  boundaryConstraints = true,
  doubleTapToZoom = true,
  doubleTapScale = 2,
  onZoomChange,
  resetOnDoubleClick = true,
}: ZoomableContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useViewport();
  
  // Motion values for transformations
  const scale = useMotionValue(initialScale);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth values with springs
  const springScale = useSpring(scale, { damping: 20, stiffness: 200 });
  const springX = useSpring(x, { damping: 20, stiffness: 200 });
  const springY = useSpring(y, { damping: 20, stiffness: 200 });
  
  // State for gesture tracking
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const lastTapRef = useRef<number>(0);
  
  // Calculate constraints based on current scale
  const calculateConstraints = useCallback(() => {
    if (!containerRef.current || !boundaryConstraints) return {};
    
    const currentScale = scale.get();
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate the overflow amount
    const xOverflow = ((currentScale - 1) * rect.width) / 2;
    const yOverflow = ((currentScale - 1) * rect.height) / 2;
    
    return {
      left: -xOverflow,
      right: xOverflow,
      top: -yOverflow,
      bottom: yOverflow,
    };
  }, [boundaryConstraints, scale]);
  
  // Handle pinch gesture
  const handlePinch = useCallback((event: any) => {
    if (!isPinching) setIsPinching(true);
    
    // Get scale from gesture
    const newScale = Math.min(maxScale, Math.max(minScale, event.scale * initialScale));
    scale.set(newScale);
    
    // Call zoom change callback
    onZoomChange?.(newScale);
  }, [scale, maxScale, minScale, initialScale, isPinching, onZoomChange]);
  
  // Handle pinch end
  const handlePinchEnd = useCallback(() => {
    setIsPinching(false);
    
    // Ensure scale is within bounds
    const currentScale = scale.get();
    if (currentScale < minScale) {
      scale.set(minScale);
      onZoomChange?.(minScale);
    } else if (currentScale > maxScale) {
      scale.set(maxScale);
      onZoomChange?.(maxScale);
    }
  }, [scale, minScale, maxScale, onZoomChange]);
  
  // Handle double tap/click
  const handleDoubleTap = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD = 300;
    
    // Check if this is a double tap/click
    if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD) {
      // Get current scale
      const currentScale = scale.get();
      const targetScale = currentScale > minScale + 0.1 ? minScale : doubleTapScale;
      
      // Position for zoom (centered on tap/click point)
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in event) {
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
        } else {
          clientX = event.clientX;
          clientY = event.clientY;
        }
        
        if (targetScale > minScale) {
          // When zooming in, center on tap point
          const offsetX = ((clientX - rect.left) / rect.width - 0.5) * rect.width;
          const offsetY = ((clientY - rect.top) / rect.height - 0.5) * rect.height;
          
          x.set(-offsetX * (targetScale - 1));
          y.set(-offsetY * (targetScale - 1));
        } else {
          // When zooming out, reset position
          x.set(0);
          y.set(0);
        }
      }
      
      // Apply the scale change
      scale.set(targetScale);
      onZoomChange?.(targetScale);
    }
    
    lastTapRef.current = now;
  }, [scale, x, y, minScale, doubleTapScale, onZoomChange]);
  
  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    
    // Ensure we're still within constraints
    const constraints = calculateConstraints();
    const currentX = x.get();
    const currentY = y.get();
    
    if (constraints.left !== undefined && currentX < constraints.left) {
      x.set(constraints.left);
    } else if (constraints.right !== undefined && currentX > constraints.right) {
      x.set(constraints.right);
    }
    
    if (constraints.top !== undefined && currentY < constraints.top) {
      y.set(constraints.top);
    } else if (constraints.bottom !== undefined && currentY > constraints.bottom) {
      y.set(constraints.bottom);
    }
  }, [x, y, calculateConstraints]);
  
  // Reset to initial state
  const reset = useCallback(() => {
    scale.set(initialScale);
    x.set(0);
    y.set(0);
    onZoomChange?.(initialScale);
  }, [scale, x, y, initialScale, onZoomChange]);
  
  // Create event handlers
  const gestureHandlers = isMobile
    ? {
        onTouchStart: doubleTapToZoom ? handleDoubleTap : undefined,
      }
    : {
        onDoubleClick: resetOnDoubleClick ? reset : doubleTapToZoom ? handleDoubleTap : undefined,
      };
  
  return (
    <div
      ref={containerRef}
      className={cn('zoomable-content relative overflow-hidden', className)}
      {...gestureHandlers}
    >
      <motion.div
        className="w-full h-full"
        style={{
          scale: springScale,
          x: springX,
          y: springY,
        }}
        drag={dragEnabled && scale.get() > minScale}
        dragConstraints={calculateConstraints()}
        dragElastic={0.1}
        dragMomentum={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPinch={handlePinch}
        onPinchEnd={handlePinchEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
