'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';

export interface SwipeAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  backgroundColor?: string;
  onAction: () => void;
  width?: number;
}

export interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
  className?: string;
  actionsClassName?: string;
  swipeOpenThreshold?: number;
  friction?: number;
  snapBackSpeed?: number;
}

/**
 * A component that enables swipe actions on mobile elements (like list items)
 * 
 * @param children - The swipeable content
 * @param leftActions - Actions to reveal when swiping right
 * @param rightActions - Actions to reveal when swiping left
 * @param threshold - Distance threshold to trigger actions
 * @param disabled - Whether swipe actions are disabled
 * @param className - Additional CSS classes for container
 * @param actionsClassName - Additional CSS classes for action buttons
 * @param swipeOpenThreshold - Distance threshold to automatically open actions
 * @param friction - Resistance factor when swiping
 * @param snapBackSpeed - Speed of snap back animation
 */
export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 0.4,
  disabled = false,
  className,
  actionsClassName,
  swipeOpenThreshold = 100,
  friction = 0.8,
  snapBackSpeed = 0.4,
}: SwipeActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentControls = useAnimation();
  const [isOpen, setIsOpen] = useState(false);
  const [openSide, setOpenSide] = useState<'left' | 'right' | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  
  // Calculate the total width of action buttons
  const leftActionsWidth = leftActions.reduce((sum, action) => sum + (action.width || 80), 0);
  const rightActionsWidth = rightActions.reduce((sum, action) => sum + (action.width || 80), 0);
  
  // Handle drag start
  const handleDragStart = () => {
    if (containerRef.current) {
      setContentWidth(containerRef.current.getBoundingClientRect().width);
    }
  };
  
  // Handle drag end
  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const offsetX = offset.x;
    const velocityX = velocity.x;
    
    // Determine if we should open left or right actions based on velocity and offset
    const aboveThresholdRight = offsetX < -contentWidth * threshold || velocityX < -500;
    const aboveThresholdLeft = offsetX > contentWidth * threshold || velocityX > 500;
    
    if (aboveThresholdRight && rightActions.length > 0) {
      // Open right actions
      contentControls.start({
        x: -Math.min(rightActionsWidth, contentWidth * 0.6),
        transition: { type: 'spring', duration: snapBackSpeed },
      });
      setIsOpen(true);
      setOpenSide('right');
    } else if (aboveThresholdLeft && leftActions.length > 0) {
      // Open left actions
      contentControls.start({
        x: Math.min(leftActionsWidth, contentWidth * 0.6),
        transition: { type: 'spring', duration: snapBackSpeed },
      });
      setIsOpen(true);
      setOpenSide('left');
    } else {
      // Snap back to center
      contentControls.start({
        x: 0,
        transition: { type: 'spring', duration: snapBackSpeed },
      });
      setIsOpen(false);
      setOpenSide(null);
    }
  };
  
  // Handle action click
  const handleActionClick = (action: SwipeAction) => {
    action.onAction();
    
    // Close after action
    contentControls.start({
      x: 0,
      transition: { type: 'spring', duration: snapBackSpeed },
    });
    setIsOpen(false);
    setOpenSide(null);
  };
  
  // Handle drag constraints
  const getDragConstraints = () => {
    return {
      left: rightActions.length > 0 ? -rightActionsWidth : 0,
      right: leftActions.length > 0 ? leftActionsWidth : 0,
    };
  };
  
  // Close actions
  const closeActions = () => {
    contentControls.start({
      x: 0,
      transition: { type: 'spring', duration: snapBackSpeed },
    });
    setIsOpen(false);
    setOpenSide(null);
  };
  
  return (
    <div
      ref={containerRef}
      className={cn('swipe-actions relative overflow-hidden', className)}
      onClick={() => isOpen && closeActions()}
    >
      {/* Left actions */}
      <AnimatePresence>
        {leftActions.length > 0 && (
          <div
            className={cn(
              'absolute top-0 left-0 bottom-0 flex h-full',
              actionsClassName
            )}
          >
            {leftActions.map((action, index) => (
              <motion.button
                key={action.id}
                className={cn(
                  'flex items-center justify-center h-full',
                  'text-white font-medium focus:outline-none'
                )}
                style={{
                  width: action.width || 80,
                  backgroundColor: action.backgroundColor || '#4CAF50',
                  color: action.color || 'white',
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: openSide === 'left' ? 1 : 0,
                  x: openSide === 'left' ? 0 : -20,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ opacity: 0, x: -20 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(action);
                }}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Right actions */}
      <AnimatePresence>
        {rightActions.length > 0 && (
          <div
            className={cn(
              'absolute top-0 right-0 bottom-0 flex h-full',
              actionsClassName
            )}
          >
            {rightActions.map((action, index) => (
              <motion.button
                key={action.id}
                className={cn(
                  'flex items-center justify-center h-full',
                  'text-white font-medium focus:outline-none'
                )}
                style={{
                  width: action.width || 80,
                  backgroundColor: action.backgroundColor || '#F44336',
                  color: action.color || 'white',
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: openSide === 'right' ? 1 : 0,
                  x: openSide === 'right' ? 0 : 20,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ opacity: 0, x: 20 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(action);
                }}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Content */}
      <motion.div
        className="relative bg-background"
        drag={disabled ? false : 'x'}
        dragConstraints={getDragConstraints()}
        dragElastic={friction}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={contentControls}
      >
        {children}
      </motion.div>
    </div>
  );
}
