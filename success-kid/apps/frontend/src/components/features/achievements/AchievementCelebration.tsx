'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Achievement } from '@/store/useAchievementStore';
import { ConfettiEffect } from './ConfettiEffect';

/**
 * Props for AchievementCelebration component
 */
interface AchievementCelebrationProps {
  achievement: Achievement;
  onClose: () => void;
  onShare?: () => void;
  className?: string;
}

/**
 * Animation stages
 */
type CelebrationStage = 'initial' | 'badge-reveal' | 'details-reveal' | 'complete';

/**
 * Celebration overlay for achievement unlocks
 */
export function AchievementCelebration({
  achievement,
  onClose,
  onShare,
  className = '',
}: AchievementCelebrationProps) {
  const [stage, setStage] = useState<CelebrationStage>('initial');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Sequence of animations
  useEffect(() => {
    const sequence = async () => {
      // Initial delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start confetti
      setShowConfetti(true);
      
      // Badge reveal
      setStage('badge-reveal');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Details reveal
      setStage('details-reveal');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Complete stage
      setStage('complete');
      
      // Stop confetti after a while
      await new Promise(resolve => setTimeout(resolve, 3000));
      setShowConfetti(false);
    };
    
    sequence();
    
    // Play sound if available
    const sound = new Audio('/sounds/achievement.mp3');
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
        <div className="bg-primary-500 text-white p-4 text-center">
          <motion.h2
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Achievement Unlocked!
          </motion.h2>
        </div>
        
        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {/* Badge */}
          <motion.div
            className="mb-4 relative"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={stage !== 'initial' ? { 
              scale: 1, 
              opacity: 1,
              y: stage === 'badge-reveal' ? 0 : -20
            } : {}}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 25 
            }}
          >
            {/* Success Kid image in background */}
            <motion.div
              className="absolute -z-10 opacity-20"
              initial={{ opacity: 0, scale: 2 }}
              animate={stage !== 'initial' ? { opacity: 0.15, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <Image
                src="/images/success-kid-silhouette.png"
                alt="Success Kid"
                width={200}
                height={200}
                className="object-contain"
              />
            </motion.div>
            
            {/* Achievement badge */}
            <Image
              src={achievement.badgeUrl}
              alt={achievement.title}
              width={160}
              height={160}
              className="object-contain"
            />
            
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary-500"
              initial={{ opacity: 0 }}
              animate={stage !== 'initial' ? [
                { opacity: 0.8, scale: 1.2 },
                { opacity: 0, scale: 1.5 }
              ] : {}}
              transition={{ 
                duration: 1.5, 
                repeat: 2, 
                repeatType: 'loop'
              }}
              style={{ filter: 'blur(20px)', zIndex: -1 }}
            />
          </motion.div>
          
          {/* Achievement details */}
          <AnimatePresence>
            {stage === 'details-reveal' || stage === 'complete' ? (
              <motion.div
                className="text-center mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-bold text-neutral-800 mb-2">
                  {achievement.title}
                </h3>
                <p className="text-neutral-600 mb-4">
                  {achievement.description}
                </p>
                
                {/* Points reward */}
                <motion.div
                  className="bg-primary-50 text-primary-700 rounded-full px-4 py-2 inline-block font-bold"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.1, 1] }}
                  transition={{ 
                    duration: 0.6, 
                    times: [0, 0.6, 1],
                    delay: 0.3 
                  }}
                >
                  +{achievement.pointsReward} Points
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          
          {/* Buttons */}
          <AnimatePresence>
            {stage === 'complete' && (
              <motion.div
                className="flex gap-3 mt-6 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {onShare && (
                  <button
                    onClick={onShare}
                    className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex justify-center items-center gap-2"
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
                    >
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Share
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-4 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300 transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
