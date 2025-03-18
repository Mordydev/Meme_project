'use client';

import React, { useState, useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Touch {
  identifier: number;
  clientX: number;
  clientY: number;
  radiusX?: number;
  radiusY?: number;
  force?: number;
  timestamp: number;
}

export interface TouchTargetTesterProps {
  children: ReactNode;
  showOverlay?: boolean;
  highlightTargets?: boolean;
  minTargetSize?: number;
  showWarnings?: boolean;
  className?: string;
  onTargetWarning?: (element: Element, size: { width: number, height: number }) => void;
}

/**
 * A component that helps test and visualize touch targets,
 * ensuring they meet accessibility guidelines for size.
 */
export const TouchTargetTester: React.FC<TouchTargetTesterProps> = ({
  children,
  showOverlay = true,
  highlightTargets = true,
  minTargetSize = 44, // WCAG recommended minimum touch target size
  showWarnings = true,
  className,
  onTargetWarning,
}) => {
  const [touches, setTouches] = useState<Touch[]>([]);
  const [warnings, setWarnings] = useState<{ element: Element, rect: DOMRect }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    e.persist();
    
    const newTouches = Array.from(e.touches).map(touch => ({
      identifier: touch.identifier,
      clientX: touch.clientX,
      clientY: touch.clientY,
      radiusX: touch.radiusX,
      radiusY: touch.radiusY,
      force: touch.force,
      timestamp: Date.now(),
    }));
    
    setTouches(newTouches);
    
    // Check target size
    if (highlightTargets) {
      const target = e.target as Element;
      const rect = target.getBoundingClientRect();
      
      if (rect.width < minTargetSize || rect.height < minTargetSize) {
        if (showWarnings) {
          setWarnings(prev => {
            // Check if we already have this element
            const exists = prev.some(w => w.element === target);
            if (!exists) {
              onTargetWarning?.(target, { width: rect.width, height: rect.height });
              return [...prev, { element: target, rect }];
            }
            return prev;
          });
        }
      }
    }
  };
  
  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    e.persist();
    
    const newTouches = Array.from(e.touches).map(touch => ({
      identifier: touch.identifier,
      clientX: touch.clientX,
      clientY: touch.clientY,
      radiusX: touch.radiusX,
      radiusY: touch.radiusY,
      force: touch.force,
      timestamp: Date.now(),
    }));
    
    setTouches(newTouches);
  };
  
  // Handle touch end
  const handleTouchEnd = () => {
    // Clear touches after a delay to allow for visualization
    setTimeout(() => {
      setTouches([]);
    }, 300);
  };
  
  // Clear warnings
  const clearWarnings = () => {
    setWarnings([]);
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn('touch-target-tester relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Main content */}
      {children}
      
      {/* Touch visualization overlay */}
      {showOverlay && touches.length > 0 && (
        <div className="touch-overlay fixed inset-0 pointer-events-none z-50">
          {touches.map(touch => (
            <motion.div
              key={touch.identifier}
              className="touch-point absolute rounded-full border-2 border-primary-500 bg-primary-500 bg-opacity-20"
              style={{
                left: touch.clientX,
                top: touch.clientY,
                width: Math.max(44, (touch.radiusX || 20) * 2),
                height: Math.max(44, (touch.radiusY || 20) * 2),
                transform: 'translate(-50%, -50%)',
                opacity: touch.force ? touch.force : 0.7,
              }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>
      )}
      
      {/* Target size warnings */}
      {showWarnings && warnings.length > 0 && (
        <>
          <div className="warnings-overlay fixed inset-0 pointer-events-none z-40">
            {warnings.map((warning, index) => {
              const rect = warning.element.getBoundingClientRect();
              return (
                <motion.div
                  key={index}
                  className="warning-highlight absolute border-2 border-red-500 bg-red-500 bg-opacity-20 flex items-center justify-center"
                  style={{
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-red-500 text-white px-1 text-xs whitespace-nowrap">
                    {Math.round(rect.width)}×{Math.round(rect.height)}px
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          <button
            className="clear-warnings fixed bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm z-50"
            onClick={clearWarnings}
          >
            Clear {warnings.length} Warnings
          </button>
        </>
      )}
    </div>
  );
};

export default TouchTargetTester;