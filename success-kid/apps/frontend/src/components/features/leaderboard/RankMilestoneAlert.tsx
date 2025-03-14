'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RankMilestoneAlertProps {
  rank: number;
  milestone: number;
  isReached: boolean;
  className?: string;
}

/**
 * RankMilestoneAlert
 * 
 * Component to show significant ranking milestones
 */
export function RankMilestoneAlert({ 
  rank, 
  milestone, 
  isReached,
  className 
}: RankMilestoneAlertProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // If milestone is not applicable
  if ((isReached && rank > milestone) || (!isReached && rank <= milestone)) {
    return null;
  }
  
  // Calculate percentage to goal if not reached
  const percentToGoal = isReached ? 100 : Math.min(100, Math.max(0, (1 - (rank - milestone) / milestone) * 100));
  
  return (
    <div className={cn(
      "flex items-center border rounded-md p-3",
      isReached 
        ? "bg-success/5 border-success/20" 
        : "bg-amber-50 border-amber-200/20",
      className
    )}>
      <div className={cn(
        "w-10 h-10 flex items-center justify-center rounded-full mr-4",
        isReached ? "bg-success/10 text-success" : "bg-amber-100/50 text-amber-700"
      )}>
        {isReached ? (
          <motion.div
            initial={prefersReducedMotion ? { scale: 1 } : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        ) : (
          <div className="text-lg font-bold">
            {milestone}
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <div className={cn(
          "font-medium",
          isReached ? "text-success" : "text-amber-700"
        )}>
          {isReached 
            ? `Milestone Reached: Top ${milestone}` 
            : `${rank - milestone} ranks to reach Top ${milestone}`}
        </div>
        
        <div className="text-sm text-muted-foreground mt-1">
          {isReached 
            ? "Keep it up to maintain your position!" 
            : `Continue engaging to improve your rank.`}
        </div>
        
        {!isReached && (
          <div className="mt-2 w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${percentToGoal}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * RankMilestoneBadge
 * 
 * Compact badge for rank milestones
 */
export function RankMilestoneBadge({
  rank,
  milestone,
  isReached,
  className
}: RankMilestoneAlertProps) {
  // If milestone is not applicable
  if ((isReached && rank > milestone) || (!isReached && rank <= milestone)) {
    return null;
  }
  
  return (
    <div className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      isReached 
        ? "bg-success/10 text-success" 
        : "bg-amber-100 text-amber-800",
      className
    )}>
      {isReached ? (
        <>
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Top {milestone}
        </>
      ) : (
        <>
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8L12 16M12 8L16 12M12 8L8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Top {milestone}
        </>
      )}
    </div>
  );
}
