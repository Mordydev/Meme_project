'use client';

import React from 'react';
import { Milestone } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { CheckCircle, Circle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MilestoneMarkersProps {
  milestones: Milestone[];
  currentMarketCap: number;
  className?: string;
}

/**
 * MilestoneMarkers Component
 * 
 * Displays the individual milestone points along the progress bar.
 */
export default function MilestoneMarkers({ 
  milestones, 
  currentMarketCap,
  className 
}: MilestoneMarkersProps) {
  // Sort milestones by value
  const sortedMilestones = [...milestones].sort((a, b) => a.value - b.value);
  
  return (
    <TooltipProvider>
      <div className={`grid grid-cols-${Math.min(sortedMilestones.length, 7)} gap-2 ${className || ''}`}>
      {sortedMilestones.map((milestone, index) => {
        const isCompleted = currentMarketCap >= milestone.value;
        
        return (
          <div key={milestone.id} className="flex flex-col items-center">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center mb-2 ${
              isCompleted ? 'bg-primary text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
            }`}>
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs font-medium text-center cursor-help">
                  {formatCurrency(milestone.value, 0)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-semibold">{milestone.label}</div>
                  {milestone.description && (
                    <div className="text-neutral-300">{milestone.description}</div>
                  )}
                  {milestone.achievedAt && (
                    <div className="mt-1 text-neutral-400">
                      Achieved on {formatDate(milestone.achievedAt)}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      })}
      </div>
    </TooltipProvider>
  );
}
