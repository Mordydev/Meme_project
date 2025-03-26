'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Image from 'next/image';

interface PointCelebrationProps {
  amount: number;
  onComplete: () => void;
}

/**
 * Full-screen celebration for significant point earnings
 */
export function PointCelebration({ amount, onComplete }: PointCelebrationProps) {
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // Trigger confetti effect
  useEffect(() => {
    if (prefersReducedMotion) {
      // Skip animation for users who prefer reduced motion
      return;
    }
    
    if (confettiCanvasRef.current) {
      const myConfetti = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true
      });
      
      // Fire complex celebration for major achievements
      const end = Date.now() + 2000;
      
      const colors = ['#FFC107', '#1E88E5', '#4CAF50'];
      
      (function frame() {
        myConfetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        
        myConfetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
      
      // Also fire a burst from the bottom
      setTimeout(() => {
        myConfetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.9 },
          colors: colors
        });
      }, 500);
    }
    
    // Set a timeout to call onComplete
    const timeout = setTimeout(() => {
      onComplete();
    }, 2000);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [onComplete, prefersReducedMotion]);
  
  // If user prefers reduced motion, do minimal animation
  if (prefersReducedMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-white/80 rounded-lg p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Points Milestone!</h2>
          <div className="text-4xl font-bold text-amber-600 mb-4">+{amount.toLocaleString()}</div>
          <p className="text-neutral-700">Congratulations on your achievement!</p>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      {/* Canvas for confetti */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-50"
      />
      
      {/* Main celebration content */}
      <motion.div
        initial={{ scale: 0.5, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        className="relative bg-white/90 rounded-xl p-8 shadow-xl text-center max-w-md backdrop-blur-sm"
      >
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="relative w-32 h-32">
            <Image 
              src="/images/success-kid.png" 
              alt="Success Kid" 
              width={128}
              height={128}
              className="object-contain"
            />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-primary mt-12 mb-1">
          Points Milestone!
        </h2>
        
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: [0.5, 1.2, 1] }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl font-bold text-amber-600 mb-4"
        >
          +{amount.toLocaleString()}
        </motion.div>
        
        <p className="text-neutral-700 mb-2">
          Impressive achievement! Keep up the momentum.
        </p>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-neutral-500"
        >
          You're making great progress on your Success Kid journey!
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
