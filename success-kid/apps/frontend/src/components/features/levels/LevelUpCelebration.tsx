'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface LevelUpCelebrationProps {
  previousLevel: number;
  newLevel: number;
  newTitle: string;
  benefits: string[];
  badgeUrl: string;
  onDismiss: () => void;
}

/**
 * LevelUpCelebration
 * 
 * Modal component to celebrate level-up events with animations and new benefit highlights.
 */
export function LevelUpCelebration({
  previousLevel,
  newLevel,
  newTitle,
  benefits,
  badgeUrl,
  onDismiss
}: LevelUpCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [stage, setStage] = useState<'initial' | 'badge' | 'benefits' | 'complete'>('initial');
  
  useEffect(() => {
    // Start animation sequence after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // Animation sequence timing
    if (isVisible) {
      // Show badge after 1s
      const badgeTimer = setTimeout(() => {
        setStage('badge');
      }, 1000);
      
      // Show benefits after 2.5s
      const benefitsTimer = setTimeout(() => {
        setStage('benefits');
      }, 2500);
      
      // Set complete after 3.5s
      const completeTimer = setTimeout(() => {
        setStage('complete');
      }, 3500);
      
      return () => {
        clearTimeout(badgeTimer);
        clearTimeout(benefitsTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible]);
  
  const handleDismiss = () => {
    setIsVisible(false);
    
    // Allow animation to complete before calling onDismiss
    setTimeout(onDismiss, 300);
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
            className="bg-card border rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Level Up Header */}
            <div className="bg-primary/10 relative overflow-hidden">
              {/* Celebration particles/confetti effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* This would be replaced with an actual confetti component */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
              </motion.div>
              
              <div className="relative py-8 px-6 text-center">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-3xl font-bold text-primary mb-2">Level Up!</h2>
                  <p className="text-muted-foreground">
                    You've reached level {newLevel}
                  </p>
                </motion.div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Badge Animation */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={stage !== 'initial' ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center mb-6"
              >
                <div className="relative w-32 h-32 mb-4">
                  {badgeUrl ? (
                    <Image
                      src={badgeUrl}
                      alt={`Level ${newLevel} Badge`}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center text-6xl">
                      {newLevel}
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">
                    {newTitle}
                  </h3>
                  <p className="text-muted-foreground">
                    You've advanced from level {previousLevel} to level {newLevel}!
                  </p>
                </div>
              </motion.div>
              
              {/* New Benefits */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={stage === 'benefits' || stage === 'complete' ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
              >
                <h4 className="font-semibold mb-2">New Benefits Unlocked:</h4>
                <ul className="space-y-2 mb-6">
                  {benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={stage === 'benefits' || stage === 'complete' ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className="flex items-center"
                    >
                      <svg 
                        className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                      <span>{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
              
              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={stage === 'complete' ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center"
              >
                <Button onClick={handleDismiss} size="lg">
                  Continue
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
