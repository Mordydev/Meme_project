'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AchievementWithProgress } from '@/types';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AchievementDetailProps {
  achievement: AchievementWithProgress | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AchievementDetail
 * 
 * Modal component to display detailed information about an achievement.
 */
export function AchievementDetail({ achievement, isOpen, onClose }: AchievementDetailProps) {
  if (!achievement) return null;
  
  // Default icon if no badge URL provided
  const defaultIcon = achievement.category === 'milestones' ? '🏅' : 
                      achievement.category === 'content' ? '✍️' :
                      achievement.category === 'engagement' ? '👋' :
                      achievement.category === 'wallet' ? '💰' : '🏆';
  
  // Special effects for difficulty levels
  const difficultyClasses = {
    common: "text-muted-foreground",
    uncommon: "text-primary",
    rare: "text-secondary-foreground",
    epic: "text-accent-foreground font-medium"
  };
  
  // Format unlock date if available
  const formattedDate = achievement.unlockedAt 
    ? new Date(achievement.unlockedAt).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      })
    : undefined;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-card border shadow-lg rounded-lg max-w-md w-full mx-4 overflow-hidden"
            >
              {/* Achievement Header */}
              <div className={cn(
                "p-6 flex flex-col items-center justify-center",
                achievement.difficulty === 'common' && "bg-muted/50",
                achievement.difficulty === 'uncommon' && "bg-primary/10",
                achievement.difficulty === 'rare' && "bg-secondary/10",
                achievement.difficulty === 'epic' && "bg-accent/10"
              )}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="relative w-24 h-24 mb-2"
                >
                  {achievement.badgeUrl ? (
                    <Image
                      src={achievement.badgeUrl}
                      alt={achievement.title}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-4xl">
                      {defaultIcon}
                    </div>
                  )}
                  
                  {!achievement.unlocked && achievement.progress > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full">
                        <svg viewBox="0 0 100 100" className="h-full w-full">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * achievement.progress / 100)}
                            className="text-primary/20"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                          {achievement.progress}%
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
                
                <div className="text-center">
                  <motion.h2 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-xl font-bold"
                  >
                    {achievement.title}
                  </motion.h2>
                  
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="mt-1"
                  >
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full uppercase",
                      difficultyClasses[achievement.difficulty]
                    )}>
                      {achievement.difficulty}
                    </span>
                  </motion.div>
                </div>
              </div>
              
              {/* Achievement Content */}
              <div className="p-6">
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="text-muted-foreground mb-4"
                >
                  {achievement.description}
                </motion.p>
                
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 mr-2 text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">{achievement.pointsReward} Success Points Reward</span>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 mr-2 text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <span className="capitalize">{achievement.category} Achievement</span>
                  </div>
                  
                  {achievement.unlocked ? (
                    <div className="bg-success/10 text-success px-3 py-2 rounded-md text-sm flex items-center mt-4">
                      <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        Unlocked {formattedDate ? `on ${formattedDate}` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-muted/30 px-3 py-2 rounded-md text-sm flex items-center mt-4">
                      <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {achievement.progress > 0 ? (
                        <span>In progress - {achievement.progress}% complete</span>
                      ) : (
                        <span>Locked - Keep participating to unlock!</span>
                      )}
                    </div>
                  )}
                </motion.div>
                
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="mt-6 flex justify-end"
                >
                  <Button onClick={onClose}>Close</Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
