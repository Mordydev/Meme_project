'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { Milestone } from '@/types';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { X, Share2, Trophy, ArrowUpRight, Rocket, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image';

/**
 * MilestoneCelebration props interface
 */
interface MilestoneCelebrationProps {
  milestone: Milestone | null;
  isVisible: boolean;
  onClose: () => void;
  onShare?: () => void;
}

/**
 * Milestone Celebration Component
 * 
 * Displays a celebratory animation and information when a market cap milestone is reached.
 */
export function MilestoneCelebration({ 
  milestone, 
  isVisible, 
  onClose,
  onShare
}: MilestoneCelebrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [hasPlayed, setHasPlayed] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Get milestone icon based on milestone id
  const getMilestoneIcon = (id: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'milestone_100k': <Rocket className="w-20 h-20 text-primary" />,
      'milestone_500k': <TrendingUp className="w-20 h-20 text-primary" />,
      'milestone_1m': <Trophy className="w-20 h-20 text-primary" />,
      'milestone_5m': <Star className="w-20 h-20 text-primary" />,
      'milestone_10m': <Rocket className="w-20 h-20 text-primary" />,
      'milestone_50m': <Trophy className="w-20 h-20 text-primary" />,
      'milestone_100m': <Trophy className="w-20 h-20 text-primary" />,
    };
    
    return iconMap[id] || <Trophy className="w-20 h-20 text-primary" />;
  };
  
  // Play celebration animations when component becomes visible
  useEffect(() => {
    if (isVisible && milestone && containerRef.current && !hasPlayed) {
      setHasPlayed(true);
      setAnimationComplete(false);
      playCelebrationAnimations();
      
      // Mark animation as complete after delay to prevent retriggering
      const timer = setTimeout(() => {
        setAnimationComplete(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, milestone, hasPlayed, playCelebrationAnimations]);
  
  // Separate effect to reset state when component is hidden
  useEffect(() => {
    if (!isVisible && hasPlayed) {
      setHasPlayed(false);
      setAnimationComplete(false);
    }
  }, [isVisible, hasPlayed]);
  
  // Setup canvas confetti
  useEffect(() => {
    if (confettiCanvasRef.current && isVisible && !prefersReducedMotion) {
      const canvas = confettiCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      // Set canvas size
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Create confetti instance
      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true
      });
      
      // Store confetti instance
      return () => {
        myConfetti.reset();
      };
    }
  }, [isVisible, prefersReducedMotion]);
  
  // Play celebration animations using GSAP and confetti
  const playCelebrationAnimations = useCallback(() => {
    // Only play full animations if reduced motion is not preferred
    if (!prefersReducedMotion) {
      // GSAP animation for the container and content
      gsap.timeline()
        .fromTo(
          containerRef.current, 
          { scale: 0.5, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        )
        .fromTo(
          '.milestone-value', 
          { scale: 0.8, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' },
          '-=0.2'
        )
        .fromTo(
          '.milestone-text', 
          { y: 20, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
          '-=0.3'
        );
      
      // Fire confetti
      fireConfetti();
    }
  }, [prefersReducedMotion, fireConfetti]);
  
  // Confetti animation function
  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#1E88E5', '#FFC107', '#4CAF50'], // Brand colors
      disableForReducedMotion: true
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    // Fire confetti from left and right sides
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.2, y: 0.7 }
    });
    
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.8, y: 0.7 }
    });

    // Fire confetti in the middle
    fire(0.5, {
      spread: 60,
      decay: 0.91,
      scalar: 1.2
    });
    
    // Delayed additional burst
    setTimeout(() => {
      fire(0.3, {
        spread: 100,
        startVelocity: 30,
        decay: 0.92,
        scalar: 1
      });
    }, 300);
  }, []);
  
  if (!milestone) return null;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            // Close only if the background is clicked
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Confetti Canvas (Positioned absolutely) */}
          {!prefersReducedMotion && (
            <canvas 
              ref={confettiCanvasRef}
              className="fixed inset-0 pointer-events-none z-50"
            />
          )}
          
          {/* Celebration Card */}
          <div 
            ref={containerRef}
            className="relative max-w-md w-full bg-background rounded-xl shadow-xl border border-primary overflow-hidden"
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-background opacity-50" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-neutral-100 transition-colors z-10"
              aria-label="Close celebration"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Celebration Content */}
            <div className="p-6 pt-12 text-center relative z-10">
              {/* Success Kid Illustration */}
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center shadow-lg">
                    {milestone.id && getMilestoneIcon(milestone.id)}
                  </div>
                  
                  {/* Surrounding stars animation */}
                  {!prefersReducedMotion && !animationComplete && (
                    <>
                      <motion.div 
                        className="absolute w-5 h-5 text-secondary"
                        initial={{ opacity: 0, x: -20, y: -20 }}
                        animate={{ 
                          opacity: [0, 1, 0], 
                          x: [-20, -30, -40], 
                          y: [-20, -35, -50],
                          scale: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 2, 
                          times: [0, 0.5, 1],
                          repeat: 1
                        }}
                      >
                        <Star />
                      </motion.div>
                      
                      <motion.div 
                        className="absolute w-4 h-4 text-primary-300"
                        initial={{ opacity: 0, x: 20, y: -20 }}
                        animate={{ 
                          opacity: [0, 1, 0], 
                          x: [20, 35, 50], 
                          y: [-20, -30, -40],
                          scale: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 2,
                          times: [0, 0.5, 1],
                          delay: 0.3,
                          repeat: 1
                        }}
                      >
                        <Star />
                      </motion.div>
                      
                      <motion.div 
                        className="absolute w-3 h-3 text-accent"
                        initial={{ opacity: 0, x: 10, y: 25 }}
                        animate={{ 
                          opacity: [0, 1, 0], 
                          x: [10, 20, 30], 
                          y: [25, 40, 55],
                          scale: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 2,
                          times: [0, 0.5, 1],
                          delay: 0.5,
                          repeat: 1
                        }}
                      >
                        <Star />
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </div>
              
              {/* Milestone Heading */}
              <motion.h2
                className="text-2xl font-bold mb-2 milestone-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-primary">{milestone.name || 'Milestone Achieved!'}</span>
              </motion.h2>
              
              {/* Milestone Value */}
              <motion.div
                className="text-4xl font-bold text-primary mb-4 milestone-value"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                {typeof milestone.targetValue === 'string' 
                  ? formatCurrency(parseFloat(milestone.targetValue), 0) 
                  : formatCurrency(milestone.value || 0, 0)}
              </motion.div>
              
              {/* Milestone Description */}
              <motion.p
                className="text-neutral-600 mb-6 milestone-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {milestone.description || `The Success Kid Token has reached a market capitalization of ${formatCurrency(milestone.value || parseFloat(milestone.targetValue || '0'), 0)}! Thanks to our amazing community for this achievement.`}
              </motion.p>
              
              {/* Achievement Date */}
              {milestone.achievedAt && (
                <motion.p
                  className="text-sm text-neutral-500 mb-6 milestone-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Achieved on {new Date(milestone.achievedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </motion.p>
              )}
              
              {/* Actions */}
              <motion.div
                className="flex gap-3 justify-center milestone-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Continue
                </Button>
                
                {onShare && (
                  <Button
                    onClick={onShare}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Achievement
                  </Button>
                )}
              </motion.div>
            </div>
            
            {/* Bottom Stats Bar */}
            <motion.div
              className="bg-primary-50 p-4 border-t border-primary-100 flex justify-between items-center relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {milestone.nextMilestoneId ? (
                <div className="text-sm text-neutral-600">
                  <p className="font-medium">Next Milestone</p>
                  <p className="text-primary font-bold">
                    {typeof milestone.nextTargetValue === 'string' 
                      ? formatCurrency(parseFloat(milestone.nextTargetValue), 0) 
                      : formatCurrency(milestone.nextMilestoneValue || parseFloat(milestone.targetValue || '0') * 5, 0)}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-neutral-600">
                  <p className="font-medium">All Milestones Achieved!</p>
                  <p className="text-primary">Congratulations to the community!</p>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary-600 hover:bg-primary-100"
                onClick={() => {
                  window.open('https://dexscreener.com', '_blank');
                }}
              >
                View Chart <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
