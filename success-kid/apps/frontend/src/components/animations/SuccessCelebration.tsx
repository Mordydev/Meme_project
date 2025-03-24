'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface SuccessCelebrationType {
  type: 'confetti' | 'fireworks' | 'achievement' | 'milestone';
  duration?: number;
}

interface SuccessCelebrationProps {
  show: boolean;
  onComplete?: () => void;
  className?: string;
  type?: SuccessCelebrationType['type'];
  duration?: number;
  message?: string;
  icon?: React.ReactNode;
  particleCount?: number;
}

/**
 * SuccessCelebration - Displays celebratory animations for key achievements
 * 
 * @example
 * <SuccessCelebration 
 *   show={showCelebration} 
 *   type="achievement" 
 *   message="Level Up!"
 *   onComplete={() => setShowCelebration(false)}
 * />
 */
export function SuccessCelebration({
  show,
  onComplete,
  className,
  type = 'confetti',
  duration = 3000,
  message,
  icon,
  particleCount = 50,
}: SuccessCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Set up visibility and auto-hide timer
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [duration, onComplete, show]);
  
  // Create particles for the celebration effect
  const renderParticles = () => {
    // Skip for reduced motion
    if (prefersReducedMotion) return null;
    
    // Generate an array of particle elements
    return Array.from({ length: particleCount }).map((_, index) => {
      // Randomize properties for varied particles
      const size = Math.random() * 10 + 5;
      const rotationStart = Math.random() * 360;
      
      // Position and speed will vary based on celebration type
      let xOffset, yOffset, duration, delay;
      
      switch(type) {
        case 'confetti':
          // Confetti falls from the top with slight x variance
          xOffset = (Math.random() - 0.5) * window.innerWidth;
          yOffset = -100 - Math.random() * 300;
          duration = 2 + Math.random() * 2;
          delay = Math.random() * 0.3;
          break;
        
        case 'fireworks':
          // Fireworks explode outward from center
          const angle = Math.random() * Math.PI * 2;
          const distance = 30 + Math.random() * 100;
          xOffset = Math.cos(angle) * distance;
          yOffset = Math.sin(angle) * distance;
          duration = 0.8 + Math.random() * 0.4;
          delay = Math.random() * 0.2;
          break;
          
        case 'achievement':
        case 'milestone':
        default:
          // Particles burst out from bottom
          xOffset = (Math.random() - 0.5) * window.innerWidth * 0.8;
          yOffset = 100 + Math.random() * 200;
          duration = 1 + Math.random() * 1.5;
          delay = Math.random() * 0.5;
          break;
      }
      
      // Generate vibrant colors appropriate for Success Kid brand
      const colors = [
        '#1E88E5', // Primary
        '#FFC107', // Secondary
        '#4CAF50', // Accent
        '#90CAF9', // Light Primary
        '#FFECB3', // Light Secondary
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      return (
        <motion.div
          key={`particle-${index}`}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            top: '50%',
            left: '50%',
            zIndex: 10,
          }}
          initial={{
            scale: 0,
            x: 0,
            y: 0,
            rotate: rotationStart,
            opacity: 1
          }}
          animate={{
            scale: [0, 1, 0.8, 0],
            x: [0, xOffset * 0.3, xOffset],
            y: [0, yOffset * 0.3, yOffset],
            rotate: [rotationStart, rotationStart + 360],
            opacity: [0, 1, 0.8, 0]
          }}
          transition={{
            duration,
            delay,
            ease: "easeOut",
          }}
        />
      );
    });
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 flex items-center justify-center z-50 pointer-events-none",
            className
          )}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Celebration message */}
          {message && (
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 text-center z-20 mb-12"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                delay: 0.1
              }}
            >
              {/* Icon */}
              {icon && (
                <motion.div 
                  className="text-primary text-5xl mx-auto mb-3"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ 
                    scale: [0.5, 1.2, 1],
                    opacity: 1
                  }}
                  transition={{ 
                    duration: 0.8,
                    times: [0, 0.6, 1],
                    delay: 0.2
                  }}
                >
                  {icon}
                </motion.div>
              )}
              
              {/* Success message */}
              <motion.h2
                className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {message}
              </motion.h2>
            </motion.div>
          )}
          
          {/* Particles */}
          {renderParticles()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
