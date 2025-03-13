'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  position?: 'center' | 'top' | 'bottom';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  maxWidth = 'max-w-md',
  position = 'center',
}) => {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
    
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);
  
  // Handle click outside
  const handleOutsideClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };
  
  // Get animation variants based on position
  const getModalVariants = () => {
    switch (position) {
      case 'top':
        return {
          hidden: { opacity: 0, y: -50, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -50, scale: 0.95 },
        };
      case 'bottom':
        return {
          hidden: { opacity: 0, y: 50, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 50, scale: 0.95 },
        };
      default:
        return {
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
        };
    }
  };
  
  // Get positioning classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'items-start pt-16';
      case 'bottom':
        return 'items-end pb-16';
      default:
        return 'items-center';
    }
  };
  
  if (!mounted) return null;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto overflow-x-hidden">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOutsideClick}
          />
          
          {/* Modal */}
          <div className={cn("flex w-full px-4", getPositionClasses())}>
            <motion.div
              ref={modalRef}
              className={cn(
                "relative my-8 w-full overflow-hidden rounded-lg bg-white shadow-xl dark:bg-neutral-800",
                maxWidth,
                className
              )}
              variants={getModalVariants()}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
