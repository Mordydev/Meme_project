'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useLevelStore } from '@/store/useLevelStore';
import { ConfettiEffect } from './ConfettiEffect';
import { LevelBadge } from './LevelBadge';

/**
 * Props for LevelUpCelebration component
 */
interface LevelUpCelebrationProps {
  onClose: () => void;
  className?: string;
}

/**
 * Animation stages
 */
type CelebrationStage = 'initial' | 'reveal' | 'benefits' | 'complete';

/**
 * Celebration overlay for level up events
 */
export function LevelUpCelebration({
  onClose,
  className = '',
}: LevelUpCelebrationProps) {
  const { userData, previousLevel } = useLevelStore();
  const [stage, setStage] = useState<CelebrationStage>('initial');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Only show celebration if we have the data and previous level
  if (!userData || previousLevel === null) {
    return null;
  }
  
  // Sequence of animations
  useEffect(() => {
    const sequence = async () => {
      // Initial delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start confetti
      setShowConfetti(true);
      
      // Level reveal
      setStage('reveal');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Benefits reveal
      setStage('benefits');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Complete stage
      setStage('complete');
      
      // Stop confetti after a while
      await new Promise(resolve => setTimeout(resolve, 3000));
      setShowConfetti(false);
    };
    
    sequence();
    
    // Play sound if available
    const sound = new Audio('/sounds/level-up.mp3');
    sound.volume = 0.5;
    sound.play().catch(err => console.error('Error playing sound:', err));
    
    // Clean up timers if component unmounts
    return () => {
      setShowConfetti(false);
    };
  }, []);
  
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${className}`}>
      {/* Confetti layer */}
      {showConfetti && <ConfettiEffect />}
      
      {/* Backdrop with blur */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={stage === 'complete' ? onClose : undefined}
      />
      
      {/* Celebration content */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-11/12 max-w-md"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="bg-primary-600 text-white p-6 text-center">
          <motion.h2
            className="text-3xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Level Up!
          </motion.h2>
        </div>
        
        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {/* Success Kid image in background */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-20"
            initial={{ opacity: 0, scale: 2 }}
            animate={stage !== 'initial' ? { opacity: 0.1, scale: 1 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <Image
              src="/images/success-kid-original.png"
              alt="Success Kid"
              width={300}
              height={300}
              className="object-contain"
            />
          </motion.div>
          
          {/* Level badges */}
          <AnimatePresence>
            {stage !== 'initial' && (
              <motion.div
                className="flex items-center justify-center gap-12 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Previous level */}
                <div className="text-center opacity-60">
                  <LevelBadge level={previousLevel} size="lg" showLabel={false} />
                  <div className="mt-2 text-neutral-600 font-medium">
                    Level {previousLevel}
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="text-primary-500">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="32" 
                    height="32" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
                
                {/* New level - animated entry */}
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                  transition={{ 
                    duration: 1, 
                    times: [0, 0.6, 1],
                    delay: 0.3 
                  }}
                >
                  <LevelBadge 
                    level={userData.level} 
                    size="lg" 
                    showLabel={false}
                    badgeUrl={userData.badges.current}
                  />
                  <div className="mt-2 text-primary-700 font-bold">
                    Level {userData.level}
                  </div>
                  <div className="text-sm text-primary-600">
                    {userData.title}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* New benefits */}
          <AnimatePresence>
            {(stage === 'benefits' || stage === 'complete') && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-center font-semibold text-neutral-800 mb-3">
                  New Benefits Unlocked
                </h3>
                
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <ul className="space-y-2">
                    {userData.benefits.map((benefit, index) => (
                      <motion.li
                        key={index}
                        className="flex items-center gap-2 text-neutral-700"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="text-primary-500"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {benefit}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Continue button */}
          <AnimatePresence>
            {stage === 'complete' && (
              <motion.button
                className="mt-6 bg-primary-500 text-white py-2 px-6 rounded-lg hover:bg-primary-600 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onClick={onClose}
              >
                Continue
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
