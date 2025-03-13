'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
}

interface AchievementUnlockProps {
  achievement: Achievement;
  points: number;
  onDismiss: () => void;
  onViewDetails?: () => void;
}

export default function AchievementUnlock({
  achievement,
  points,
  onDismiss,
  onViewDetails
}: AchievementUnlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Show achievement with a slight delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    
    // Allow animation to complete before calling onDismiss
    setTimeout(onDismiss, 300);
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, type: 'spring', bounce: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto my-4 max-w-md p-4 sm:bottom-4 sm:right-4 sm:left-auto"
        >
          <div className="overflow-hidden rounded-lg border border-primary/20 bg-white shadow-xl">
            <div className="bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">Achievement Unlocked!</h3>
                <button
                  onClick={handleDismiss}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Dismiss"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex">
                <div className="mr-4 flex-shrink-0">
                  {/* Achievement icon - fallback to a placeholder if iconUrl isn't available */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {achievement.iconUrl ? (
                      <img
                        src={achievement.iconUrl}
                        alt={achievement.title}
                        className="h-12 w-12"
                      />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold">{achievement.title}</h4>
                  <p className="text-gray-600">{achievement.description}</p>
                  
                  <div className="mt-2 flex items-center text-green-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-1 h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">+{points} Success Points</span>
                  </div>
                </div>
              </div>
              
              {onViewDetails && (
                <div className="mt-4 text-right">
                  <button
                    onClick={onViewDetails}
                    className="text-sm font-medium text-primary hover:text-primary-dark hover:underline"
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
