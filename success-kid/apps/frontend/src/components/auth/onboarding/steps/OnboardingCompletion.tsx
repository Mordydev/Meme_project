'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AchievementUnlock } from '@/components/auth/achievements/AchievementUnlock';

interface OnboardingCompletionProps {
  onComplete: () => void;
}

export function OnboardingCompletion({ 
  onComplete,
}: OnboardingCompletionProps) {
  const [showAchievement, setShowAchievement] = useState(false);
  
  // Show achievement after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAchievement(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Achievement data
  const achievement = {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Completed the platform onboarding process',
    iconUrl: '/badge-first-steps.svg', // This would be a real path in production
    points: 100,
  };
  
  return (
    <div className="text-center">
      <AnimatePresence>
        {showAchievement ? (
          <motion.div
            key="achievement"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AchievementUnlock
              achievement={achievement}
              onDismiss={() => setShowAchievement(false)}
            />
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-8"
            >
              <Button onClick={onComplete} size="lg">
                Start Exploring
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="completion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0, -5, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop"
              }}
              className="mb-6 inline-block text-6xl"
            >
              🎉
            </motion.div>
            
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Congratulations!
            </h2>
            
            <p className="mb-6 text-gray-600">
              You've completed the onboarding process and are ready to start your journey!
            </p>
            
            <div className="mx-auto mb-6 h-2 w-full max-w-xs rounded-full bg-gray-200">
              <motion.div 
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1 }}
              />
            </div>
            
            <p className="animate-pulse text-lg font-semibold text-primary">
              Unlocking achievement...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
