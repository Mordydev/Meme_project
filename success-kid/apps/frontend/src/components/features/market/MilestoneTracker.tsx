'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/optimized/GlassCard';
import { 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/optimized/glass/card-components';
import { motion } from 'framer-motion';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import { Milestone, NextMilestone } from '@/types';

interface MilestoneTrackerProps {
  currentMarketCap: number;
  milestones: Milestone[];
  nextMilestone: NextMilestone;
  isLoading?: boolean;
  className?: string;
}

export function MilestoneTracker({
  currentMarketCap,
  milestones,
  nextMilestone,
  isLoading = false,
  className = '',
}: MilestoneTrackerProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  
  // Determine completed milestones
  const completedMilestones = milestones.filter(m => m.achievedAt);
  const latestCompletedMilestone = completedMilestones.length > 0 
    ? completedMilestones[completedMilestones.length - 1] 
    : null;
  
  // Handle milestone click
  const handleMilestoneClick = (id: string) => {
    setSelectedMilestone(prev => prev === id ? null : id);
  };
  
  // Format market cap
  const formattedMarketCap = formatCurrency(currentMarketCap);
  
  // Render milestone markers
  const renderMilestones = () => {
    if (milestones.length === 0) return null;
    
    return (
      <div className="relative mt-2 h-16">
        {/* Milestone track */}
        <div className="absolute top-5 h-2 w-full rounded-full bg-neutral-200" />
        
        {/* Progress bar */}
        <motion.div 
          className="absolute top-5 h-2 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${nextMilestone.progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        
        {/* Milestone markers */}
        {milestones.map((milestone, index) => {
          const position = (index / (milestones.length - 1)) * 100;
          const isCompleted = !!milestone.achievedAt;
          const isSelected = selectedMilestone === milestone.id;
          const isNext = !milestone.achievedAt && nextMilestone.id === milestone.id;
          
          return (
            <div 
              key={milestone.id}
              className="absolute top-3"
              style={{ left: `${position}%` }}
            >
              <button
                className={`
                  flex h-6 w-6 transform items-center justify-center rounded-full 
                  border-2 border-white shadow transition-all
                  ${isCompleted ? 'bg-primary' : isNext ? 'bg-primary-300' : 'bg-neutral-300'}
                  ${isSelected ? 'scale-125' : ''}
                  hover:scale-110
                `}
                onClick={() => handleMilestoneClick(milestone.id)}
                aria-label={`${milestone.label} milestone - ${isCompleted ? 'Completed' : isNext ? 'In progress' : 'Upcoming'}`}
              >
                {isCompleted && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              
              {/* Milestone label */}
              <div className={`mt-2 text-center text-xs font-medium ${isNext ? 'text-primary-600' : ''}`}>
                {milestone.label}
              </div>
              
              {/* Milestone details (visible when selected) */}
              {isSelected && (
                <div className="absolute -translate-x-1/2 rounded-md bg-white p-2 shadow-md">
                  <div className="text-sm font-medium">{milestone.label}</div>
                  <div className="text-xs text-neutral-600">{milestone.description}</div>
                  {milestone.achievedAt && (
                    <div className="mt-1 text-xs text-accent-500">
                      Achieved on {new Date(milestone.achievedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <GlassCard 
      className={className}
      gradientBackground={true} 
      gradientBorder={true}
      borderGlow={true}
      borderGlowIntensity="strong"
      gradientColors="from-secondary/10 via-white/90 to-primary/10"
      shadowStyle="premium"
    >
      <CardHeader>
        <CardTitle>Market Cap Milestones</CardTitle>
        <CardDescription>Track our progress through key market milestones</CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-36 animate-pulse rounded-md bg-neutral-100"></div>
        ) : (
          <>
            {/* Current market cap */}
            <div className="mb-4 flex items-baseline">
              <div className="text-3xl font-bold">{formattedMarketCap}</div>
              <div className="ml-2 text-sm text-neutral-500">Current Market Cap</div>
            </div>
            
            {/* Progress to next milestone */}
            <div className="mb-2 flex justify-between text-sm">
              <div className="font-medium text-neutral-700">
                {latestCompletedMilestone?.label || '$0'}
              </div>
              <div className="font-medium text-primary-600">
                {nextMilestone.progress.toFixed(1)}% to {nextMilestone.label}
              </div>
            </div>
            
            {/* Milestone track */}
            {renderMilestones()}
          </>
        )}
      </CardContent>
      
      <CardFooter className="text-sm text-neutral-500">
        Click on milestones for details
      </CardFooter>
    </GlassCard>
  );
}
