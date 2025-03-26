'use client';

import React, { ReactNode, useState, useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ZoomableContentProps {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  doubleTapToZoom?: boolean;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

/**
 * Component that enables pinch-to-zoom and pan functionality for content,
 * optimized for mobile touch interactions.
 */
export const ZoomableContent: React.FC<ZoomableContentProps> = ({
  children,
  minScale = 1,
  maxScale = 3,
  initialScale = 1,
  doubleTapToZoom = true,
  className,
  contentClassName,
  disabled = false,
}) => {
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();

  // Reset to initial state
  const resetZoom = () => {
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
    controls.start({
      scale: initialScale,
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30,
        duration: prefersReducedMotion ? 0.1 : 0.3,
      },
    });
  };

  // Handle pinch gesture
  const handlePinch = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    
    // Get the delta scale from the pinch gesture
    const newScale = Math.min(Math.max(scale * info.scale, minScale), maxScale);
    
    // Update the scale
    setScale(newScale);
    controls.set({ scale: newScale });
  };

  // Handle drag to pan when zoomed in
  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || scale <= 1) return;
    
    // Calculate new position
    const newPosition = {
      x: position.x + info.delta.x,
      y: position.y + info.delta.y,
    };
    
    // Apply constraints
    // This is a simple constraint - a more sophisticated version would
    // constrain based on content size and zoom level
    const maxX = (scale - 1) * 150; // Rough estimate of max pan distance
    const maxY = (scale - 1) * 150;
    
    const constrainedPosition = {
      x: Math.min(Math.max(newPosition.x, -maxX), maxX),
      y: Math.min(Math.max(newPosition.y, -maxY), maxY),
    };
    
    setPosition(constrainedPosition);
    controls.set(constrainedPosition);
  };

  // Handle double tap to zoom
  const handleTap = (event: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !doubleTapToZoom) return;
    
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;
    
    // Check if double tap (within 300ms)
    if (tapLength < 300 && tapLength > 0) {
      event.preventDefault();
      
      if (scale > minScale) {
        // If already zoomed in, reset to min scale
        resetZoom();
      } else {
        // Zoom in to mid-level scale
        const zoomScale = (minScale + maxScale) / 2;
        setScale(zoomScale);
        controls.start({
          scale: zoomScale,
          transition: {
            type: 'spring',
            stiffness: 500,
            damping: 30,
            duration: prefersReducedMotion ? 0.1 : 0.3,
          },
        });
      }
    }
    
    lastTapRef.current = currentTime;
  };

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden touch-none', className)}
      onDoubleClick={handleTap} // For desktop support
    >
      <motion.div
        className={cn('w-full h-full origin-center', contentClassName)}
        animate={controls}
        initial={{ scale: initialScale, x: 0, y: 0 }}
        drag={disabled ? false : scale > 1}
        dragConstraints={containerRef}
        onDrag={handleDrag}
        onPinch={handlePinch}
        onTap={handleTap}
        whileTap={{ cursor: scale > 1 ? 'grabbing' : 'auto' }}
      >
        {children}
      </motion.div>
      
      {scale > 1 && (
        <button
          className="absolute top-3 right-3 z-10 bg-black/50 text-white rounded-full p-2"
          onClick={resetZoom}
          aria-label="Reset zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ZoomableContent;