'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useMilestoneData } from '@/hooks/useMarketData';
import { useMarketData } from '@/components/providers/market';
import { format } from 'date-fns';

interface MilestoneTrackerProps {
  className?: string;
}

export default function MilestoneTracker({ className = '' }: MilestoneTrackerProps) {
  const { data, isLoading, error } = useMilestoneData();
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { formatNumber } = useMarketData();
  
  // Show celebration effect when a milestone is reached
  useEffect(() => {
    if (data?.data) {
      const recentlyAchieved = data.data.milestones.find(
        m => m.achievedAt && new Date(m.achievedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
      
      if (recentlyAchieved) {
        setSelectedMilestone(recentlyAchieved.id);
        setShowCelebration(true);
        
        // Hide celebration after 5 seconds
        const timer = setTimeout(() => {
          setShowCelebration(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [data?.data]);
  
  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <p className="text-red-500">Error loading milestone data. Please try again later.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Market Cap Milestones</h2>
        {data?.data && (
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Market Cap</div>
            <div className="text-xl font-bold">${new Intl.NumberFormat('en-US').format(data.data.currentMarketCap)}</div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : data?.data ? (
        <div className="relative pt-12">
          {/* Milestone line */}
          <div className="h-1 bg-gray-200 absolute top-0 left-0 right-0 mt-4"></div>
          
          {/* Milestone markers */}
          <div className="flex justify-between relative">
            {data.data.milestones.map((milestone) => {
              const isComplete = !!milestone.achievedAt;
              const isCurrent = milestone.id === data.data.nextMilestone?.id;
              
              return (
                <div key={milestone.id} className="flex flex-col items-center">
                  <motion.div
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 mb-2 cursor-pointer
                      ${isComplete 
                        ? 'bg-success text-white' 
                        : isCurrent 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-200 text-gray-500'}`}
                    onClick={() => setSelectedMilestone(milestone.id === selectedMilestone ? null : milestone.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isComplete ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      isCurrent ? (
                        <span className="text-xs font-bold">↗</span>
                      ) : (
                        <span className="text-xs font-bold">•</span>
                      )
                    )}
                  </motion.div>
                  <span className={`text-xs font-medium ${isCurrent ? 'text-primary font-bold' : 'text-gray-500'}`}>
                    {milestone.label}
                  </span>
                  
                  {/* Progress indicator for current milestone */}
                  {isCurrent && (
                    <div className="mt-1 flex flex-col items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                        <motion.div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: '0%' }}
                          animate={{ width: `${data.data.nextMilestone.progress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {data.data.nextMilestone.progress}%
                      </span>
                    </div>
                  )}
                  
                  {/* Milestone details when selected */}
                  <AnimatePresence>
                    {selectedMilestone === milestone.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-20 max-w-xs"
                      >
                        <h3 className="font-bold text-sm">{milestone.label}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{milestone.description}</p>
                        {milestone.achievedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Achieved on {format(new Date(milestone.achievedAt), 'PPP')}
                          </p>
                        )}
                        {isCurrent && (
                          <p className="text-xs text-primary mt-1">
                            ${new Intl.NumberFormat('en-US').format(data.data.currentMarketCap)} / ${new Intl.NumberFormat('en-US').format(milestone.value)}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32">
          <p>No milestone data available</p>
        </div>
      )}
      
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && selectedMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 text-6xl">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Milestone Achieved!</h2>
              {data?.data && (
                <p className="text-lg mb-4">
                  We've reached {data.data.milestones.find(m => m.id === selectedMilestone)?.label}!
                </p>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-white px-4 py-2 rounded"
                onClick={() => setShowCelebration(false)}
              >
                Awesome!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
