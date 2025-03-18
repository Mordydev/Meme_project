'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMilestoneData } from '@/hooks/useMarketData';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import confetti from 'canvas-confetti';

interface EnhancedMilestoneTrackerProps {
  className?: string;
}

export function EnhancedMilestoneTracker({ className = '' }: EnhancedMilestoneTrackerProps) {
  const { data, isLoading, error, refetch } = useMilestoneData();
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedMilestones, setCelebratedMilestones] = useState<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();
  
  // Extract and format milestone data for cleaner rendering
  const milestones = data?.data?.milestones || [];
  const currentMarketCap = data?.data?.currentMarketCap || 0;
  const nextMilestone = data?.data?.nextMilestone || null;
  
  // Check if there's a newly achieved milestone to celebrate
  const checkForNewMilestones = useCallback(() => {
    if (!milestones.length) return;
    
    const recentlyAchieved = milestones.find(
      m => m.achievedAt && 
      !celebratedMilestones.has(m.id) &&
      new Date(m.achievedAt).getTime() > Date.now() - 60 * 60 * 1000 // Achieved in the last hour
    );
    
    if (recentlyAchieved) {
      setSelectedMilestone(recentlyAchieved.id);
      setShowCelebration(true);
      
      // Remember this milestone was celebrated
      setCelebratedMilestones(prev => {
        const updated = new Set(prev);
        updated.add(recentlyAchieved.id);
        return updated;
      });
      
      // Save celebrated milestones to local storage
      const savedMilestones = JSON.parse(localStorage.getItem('celebratedMilestones') || '[]');
      savedMilestones.push(recentlyAchieved.id);
      localStorage.setItem('celebratedMilestones', JSON.stringify(savedMilestones));
      
      // Trigger celebration effects
      if (!prefersReducedMotion) {
        triggerCelebrationEffects();
      }
    }
  }, [milestones, celebratedMilestones, prefersReducedMotion]);
  
  // Load celebrated milestones from local storage on mount
  useEffect(() => {
    const savedMilestones = JSON.parse(localStorage.getItem('celebratedMilestones') || '[]');
    setCelebratedMilestones(new Set(savedMilestones));
  }, []);
  
  // Check for new milestones when data changes
  useEffect(() => {
    checkForNewMilestones();
  }, [data, checkForNewMilestones]);
  
  // Auto-hide celebration after 8 seconds
  useEffect(() => {
    if (showCelebration) {
      const timeout = setTimeout(() => {
        setShowCelebration(false);
      }, 8000);
      
      return () => clearTimeout(timeout);
    }
  }, [showCelebration]);
  
  // Trigger celebration effects (confetti)
  const triggerCelebrationEffects = () => {
    const duration = 5 * 1000;
    const end = Date.now() + duration;
    
    // Run the confetti animation in a loop
    (function frame() {
      // Launch a few confetti from the left edge
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#1E88E5', '#FFC107', '#4CAF50']
      });
      
      // Launch a few confetti from the right edge
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#1E88E5', '#FFC107', '#4CAF50'] 
      });
      
      // Keep launching until duration is up
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };
  
  // Handle milestone click
  const handleMilestoneClick = (id: string) => {
    setSelectedMilestone(id === selectedMilestone ? null : id);
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
  };
  
  if (error) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center text-lg">
            <span>Market Cap Milestones</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleRefresh}
              aria-label="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
              </svg>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-red-500">Error loading milestone data. Please try again later.</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center text-lg">
            <span>Market Cap Milestones</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleRefresh}
              aria-label="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
              </svg>
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            // Loading skeleton
            <div className="pt-6">
              <div className="h-1.5 bg-neutral-200 rounded-full w-full mb-8"></div>
              <div className="flex justify-between">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse"></div>
                    <div className="mt-2 w-12 h-3 bg-neutral-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-12 relative">
              {/* Current market cap display */}
              <div className="absolute top-0 left-0 right-0 flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-500">Current Market Cap</span>
                <span className="font-bold">${currentMarketCap.toLocaleString()}</span>
              </div>
              
              {/* Milestone track bar */}
              <div className="h-2 bg-neutral-200 rounded-full relative">
                {/* Progress fill */}
                <motion.div
                  className="absolute left-0 h-full bg-primary rounded-full"
                  style={{ width: '0%' }}
                  animate={{ 
                    width: `${Math.min(
                      100, 
                      nextMilestone ? 
                        (currentMarketCap / milestones[milestones.length - 1].value) * 100 :
                        100
                    )}%` 
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                
                {/* Milestone markers on the track */}
                {milestones.map((milestone) => {
                  const position = (milestone.value / milestones[milestones.length - 1].value) * 100;
                  const isComplete = !!milestone.achievedAt;
                  const isCurrent = milestone.id === nextMilestone?.id;
                  
                  return (
                    <div 
                      key={milestone.id}
                      className="absolute top-1/2 -translate-y-1/2" 
                      style={{ left: `${position}%` }}
                    >
                      <div className={`
                        w-4 h-4 rounded-full 
                        ${isComplete ? 'bg-success' : isCurrent ? 'bg-primary' : 'bg-neutral-300'}
                        relative z-10
                      `}></div>
                    </div>
                  );
                })}
              </div>
              
              {/* Milestone labels and interaction points */}
              <div className="flex justify-between mt-6 relative">
                {milestones.map((milestone, index) => {
                  const position = (milestone.value / milestones[milestones.length - 1].value) * 100;
                  const isComplete = !!milestone.achievedAt;
                  const isCurrent = milestone.id === nextMilestone?.id;
                  
                  // Adjust position to keep labels within container
                  let adjustedPosition = position;
                  if (index === 0) adjustedPosition = Math.max(0, position);
                  if (index === milestones.length - 1) adjustedPosition = Math.min(100, position);
                  
                  return (
                    <div 
                      key={milestone.id}
                      className="flex flex-col items-center"
                      style={{ 
                        position: 'absolute',
                        left: `${adjustedPosition}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              className={`
                                w-8 h-8 rounded-full flex items-center justify-center
                                cursor-pointer mb-2 z-10
                                ${isComplete 
                                  ? 'bg-success text-white' 
                                  : isCurrent 
                                    ? 'bg-primary text-white' 
                                    : 'bg-neutral-200 text-neutral-500'}
                              `}
                              onClick={() => handleMilestoneClick(milestone.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isComplete ? (
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="text-xs font-bold">
                                  {isCurrent ? '↗' : '•'}
                                </span>
                              )}
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="font-semibold">{milestone.label}</p>
                            <p className="text-xs">{milestone.description}</p>
                            {isComplete && milestone.achievedAt && (
                              <p className="text-xs text-success-600 mt-1">
                                Achieved on {format(new Date(milestone.achievedAt), 'PPP')}
                              </p>
                            )}
                            {isCurrent && (
                              <p className="text-xs text-primary mt-1">
                                {nextMilestone?.progress}% progress
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Milestone Label */}
                      <span className={`
                        text-xs whitespace-nowrap
                        ${isCurrent ? 'text-primary font-bold' : 'text-neutral-500'}
                      `}>
                        {milestone.label}
                      </span>
                      
                      {/* Progress indicator for current milestone */}
                      {isCurrent && nextMilestone && (
                        <div className="mt-1">
                          <div className="text-xs text-neutral-500 text-center">
                            {nextMilestone.progress}%
                          </div>
                        </div>
                      )}
                      
                      {/* Milestone details dialog */}
                      <AnimatePresence>
                        {selectedMilestone === milestone.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full mt-3 bg-white dark:bg-neutral-800 border rounded-lg shadow-lg p-3 z-20 w-48"
                            style={{ left: '50%', transform: 'translateX(-50%)' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <h3 className="font-bold text-sm">{milestone.label}</h3>
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                              {milestone.description}
                            </p>
                            {milestone.achievedAt && (
                              <p className="text-xs text-success-600 mt-1">
                                Achieved on {format(new Date(milestone.achievedAt), 'PPP')}
                              </p>
                            )}
                            {isCurrent && (
                              <div className="mt-2">
                                <div className="w-full bg-neutral-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-primary h-1.5 rounded-full" 
                                    style={{ width: `${nextMilestone?.progress || 0}%` }}
                                  />
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-neutral-500">
                                  <span>${currentMarketCap.toLocaleString()}</span>
                                  <span>${milestone.value.toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
              
              {/* Next milestone progress (if any) */}
              {nextMilestone && (
                <div className="mt-12 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Progress to {nextMilestone.label}</h3>
                    <span className="text-sm font-bold">{nextMilestone.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-neutral-200 rounded-full h-2.5">
                    <motion.div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: '0%' }}
                      animate={{ width: `${nextMilestone.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-1 text-xs text-neutral-500">
                    <span>${currentMarketCap.toLocaleString()}</span>
                    <span>
                      ${nextMilestone.value.toLocaleString()} 
                      <span className="text-neutral-400 ml-1">
                        (${(nextMilestone.value - currentMarketCap).toLocaleString()} to go)
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
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
              className="bg-white dark:bg-neutral-800 rounded-lg p-8 max-w-md text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-600"
                onClick={() => setShowCelebration(false)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="mb-4">
                <span className="text-6xl inline-block" role="img" aria-label="celebration">🎉</span>
              </div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-2">Milestone Achieved!</h2>
                
                {milestones.find(m => m.id === selectedMilestone) && (
                  <>
                    <h3 className="text-xl text-primary mb-4">
                      {milestones.find(m => m.id === selectedMilestone)?.label}
                    </h3>
                    
                    <p className="mb-6 text-neutral-600 dark:text-neutral-300">
                      {milestones.find(m => m.id === selectedMilestone)?.description}
                    </p>
                  </>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary text-white px-6 py-2 rounded-md font-medium"
                  onClick={() => setShowCelebration(false)}
                >
                  Awesome!
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
