'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  points: number;
}

interface AchievementUnlockProps {
  achievement: Achievement;
  onDismiss: () => void;
  onViewDetails?: () => void;
}

export function AchievementUnlock({ 
  achievement, 
  onDismiss,
  onViewDetails,
}: AchievementUnlockProps) {
  const [countedPoints, setCountedPoints] = useState(0);
  
  // Animate points counting up
  useEffect(() => {
    if (countedPoints < achievement.points) {
      const timer = setTimeout(() => {
        setCountedPoints(prev => 
          Math.min(prev + Math.ceil(achievement.points / 20), achievement.points)
        );
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [countedPoints, achievement.points]);
  
  // Particle animation effect
  const particles = Array.from({ length: 20 }, (_, i) => i);
  
  return (
    <div className="text-center">
      <div className="relative mb-6 inline-block">
        {/* Particle effects */}
        {particles.map((p) => (
          <motion.div
            key={p}
            className="absolute rounded-full bg-primary"
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0,
              opacity: 0.8,
            }}
            animate={{ 
              x: Math.random() * 200 - 100, 
              y: Math.random() * 200 - 100, 
              scale: Math.random() * 0.5 + 0.5,
              opacity: 0,
            }}
            transition={{ 
              duration: Math.random() * 1 + 1,
              delay: Math.random() * 0.2,
              ease: "easeOut"
            }}
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
            }}
          />
        ))}
        
        {/* Achievement badge */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 15
          }}
          className="relative z-10 rounded-full bg-white p-2 shadow-xl"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-600 text-white">
            {/* We'd normally use an actual badge image here */}
            <span className="text-5xl">🏆</span>
          </div>
        </motion.div>
      </div>
      
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-2 text-2xl font-bold text-gray-900"
      >
        Achievement Unlocked!
      </motion.h2>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mb-6"
      >
        <h3 className="mb-1 text-xl font-semibold text-primary">
          {achievement.title}
        </h3>
        <p className="text-gray-600">
          {achievement.description}
        </p>
      </motion.div>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mb-8 inline-block rounded-lg bg-primary/10 px-6 py-3"
      >
        <div className="text-sm text-gray-600">Points Earned</div>
        <div className="text-3xl font-bold text-primary">+{countedPoints}</div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-col justify-center space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0"
      >
        <Button
          onClick={onDismiss}
        >
          Continue
        </Button>
        {onViewDetails && (
          <Button
            variant="outline"
            onClick={onViewDetails}
          >
            View Details
          </Button>
        )}
      </motion.div>
    </div>
  );
}
