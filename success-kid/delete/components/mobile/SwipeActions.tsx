'use client';

import React, { ReactNode, useState, useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  onActivate: () => void;
}

export interface SwipeActionsProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * A mobile-optimized swipe actions component that reveals actions
 * when swiping from either side of the content.
 * 
 * Common in mobile interfaces for operations like delete, archive, etc.
 */
export const SwipeActions: React.FC<SwipeActionsProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 0.4,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const constraints = useRef({ left: 0, right: 0 });
  const controls = useAnimation();

  // Calculate constraints based on available actions
  const calculateConstraints = () => {
    const actionsWidth = 80; // Width per action button
    const leftConstraint = leftActions.length * actionsWidth * -1;
    const rightConstraint = rightActions.length * actionsWidth;
    
    constraints.current = { left: leftConstraint, right: rightConstraint };
    return { left: leftConstraint, right: rightConstraint };
  };

  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { left, right } = calculateConstraints();
    
    // Determine if swipe was significant enough to trigger action
    if (info.offset.x < left * threshold) {
      // Swiped left enough to show right actions
      controls.start({ x: left });
      setIsOpen(true);
      setDirection('left');
    } else if (info.offset.x > right * threshold) {
      // Swiped right enough to show left actions
      controls.start({ x: right });
      setIsOpen(true);
      setDirection('right');
    } else {
      // Not swiped far enough, return to center
      controls.start({ x: 0 });
      setIsOpen(false);
      setDirection(null);
    }
  };

  // Reset to closed state
  const reset = () => {
    controls.start({ x: 0 });
    setIsOpen(false);
    setDirection(null);
  };

  // Render action buttons
  const renderActionButtons = (actions: SwipeAction[], side: 'left' | 'right') => {
    return (
      <div 
        className={cn(
          'absolute top-0 bottom-0 flex items-stretch',
          side === 'left' ? 'left-0' : 'right-0'
        )}
      >
        {actions.map((action, index) => (
          <motion.button
            key={`${side}-action-${index}`}
            className={cn(
              'flex flex-col items-center justify-center px-5',
              'text-white focus:outline-none',
            )}
            style={{ backgroundColor: action.color }}
            onClick={() => {
              action.onActivate();
              reset();
            }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl">{action.icon}</div>
            <span className="text-xs mt-1">{action.label}</span>
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {leftActions.length > 0 && renderActionButtons(leftActions, 'left')}
      {rightActions.length > 0 && renderActionButtons(rightActions, 'right')}
      
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: constraints.current.left, right: constraints.current.right }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="bg-white z-10 relative"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeActions;