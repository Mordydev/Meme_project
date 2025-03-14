'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PositionChangeProps {
  currentPosition: number;
  previousPosition?: number | null;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * PositionChange
 * 
 * Component to visualize changes in ranking position
 */
export function PositionChange({ 
  currentPosition, 
  previousPosition = null,
  showAnimation = true,
  size = 'md',
  className
}: PositionChangeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Calculate position change
  const positionChange = previousPosition !== null 
    ? previousPosition - currentPosition 
    : 0;
  
  // Size classes for different size variants
  const sizeClasses = {
    sm: 'text-xs w-5 h-5',
    md: 'text-sm w-6 h-6',
    lg: 'text-base w-8 h-8'
  };
  
  // Get color based on position change
  const getColor = (change: number) => {
    if (change > 0) return 'text-success border-success/20 bg-success/10';
    if (change < 0) return 'text-red-500 border-red-200/20 bg-red-100/10';
    return 'text-amber-500 border-amber-200/20 bg-amber-100/10';
  };
  
  // Get icon based on position change
  const getIcon = (change: number) => {
    if (change > 0) {
      return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19V5M12 5L19 12M12 5L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (change < 0) {
      return (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12H19M5 12H7M19 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };
  
  // Start animation when previousPosition changes
  useEffect(() => {
    if (previousPosition !== null && showAnimation && !prefersReducedMotion) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1500); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [previousPosition, showAnimation, prefersReducedMotion]);
  
  // If no previous position, don't show anything
  if (previousPosition === null) {
    return null;
  }
  
  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "flex items-center justify-center border rounded-full overflow-hidden",
          getColor(positionChange),
          sizeClasses[size]
        )}
      >
        <div className="w-1/2 h-1/2">
          {getIcon(positionChange)}
        </div>
      </div>
      
      <AnimatePresence>
        {isAnimating && Math.abs(positionChange) > 0 && (
          <motion.div 
            className={cn(
              "absolute left-1/2 -translate-x-1/2 font-medium",
              positionChange > 0 ? "text-success" : "text-red-500",
              size === 'sm' ? "text-xs -top-5" : size === 'md' ? "text-sm -top-6" : "text-base -top-7"
            )}
            initial={{ opacity: 0, y: positionChange > 0 ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: positionChange > 0 ? -10 : 10 }}
            transition={{ duration: 0.3 }}
          >
            {positionChange > 0 ? '+' : ''}{positionChange}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TrendIndicatorProps {
  history: number[];
  window?: number;
  showLabel?: boolean;
  className?: string;
}

/**
 * TrendIndicator
 * 
 * Component to show long-term ranking trends
 */
export function TrendIndicator({ 
  history, 
  window = 7,
  showLabel = true,
  className 
}: TrendIndicatorProps) {
  // Calculate trend using the specified window
  const calculateTrend = () => {
    if (history.length < 2) return 'stable';
    
    // Use the most recent window of data points
    const recentData = history.slice(-window);
    
    // Simple linear regression to determine trend
    const n = recentData.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    // Calculate means
    const meanX = indices.reduce((sum, x) => sum + x, 0) / n;
    const meanY = recentData.reduce((sum, y) => sum + y, 0) / n;
    
    // Calculate slope
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (indices[i] - meanX) * (recentData[i] - meanY);
      denominator += Math.pow(indices[i] - meanX, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    
    // Determine trend based on slope
    if (Math.abs(slope) < 0.1) return 'stable';
    return slope < 0 ? 'improving' : 'declining';
  };
  
  const trend = calculateTrend();
  
  // Get color based on trend
  const getColor = () => {
    switch (trend) {
      case 'improving': return 'text-success';
      case 'declining': return 'text-red-500';
      default: return 'text-amber-500';
    }
  };
  
  // Get icon based on trend
  const getIcon = () => {
    switch (trend) {
      case 'improving':
        return (
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 7L13 15L9 11L3 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 13V7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'declining':
        return (
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 17L13 9L9 13L3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 11V17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };
  
  // Get label text based on trend
  const getLabel = () => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      default: return 'Stable';
    }
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn(
        "w-6 h-6 flex items-center justify-center rounded-full border",
        getColor(),
        trend === 'improving' ? "border-success/20 bg-success/10" :
        trend === 'declining' ? "border-red-200/20 bg-red-100/10" :
        "border-amber-200/20 bg-amber-100/10"
      )}>
        <div className="w-3 h-3">
          {getIcon()}
        </div>
      </div>
      
      {showLabel && (
        <span className={cn(
          "ml-1.5 text-xs font-medium",
          getColor()
        )}>
          {getLabel()}
        </span>
      )}
    </div>
  );
}

interface MilestoneAlertProps {
  rank: number;
  milestone: number;
  isReached: boolean;
  className?: string;
}

/**
 * MilestoneAlert
 * 
 * Component to show significant ranking milestones
 */
export function MilestoneAlert({ 
  rank, 
  milestone, 
  isReached,
  className 
}: MilestoneAlertProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // If milestone is not applicable
  if ((isReached && rank > milestone) || (!isReached && rank <= milestone)) {
    return null;
  }
  
  return (
    <div className={cn(
      "flex items-center border rounded-md p-2",
      isReached 
        ? "bg-success/5 border-success/20" 
        : "bg-amber-50 border-amber-200/20",
      className
    )}>
      <div className={cn(
        "w-8 h-8 flex items-center justify-center rounded-full mr-3",
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
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
        )}
      </div>
      
      <div>
        <div className={cn(
          "font-medium",
          isReached ? "text-success" : "text-amber-700"
        )}>
          {isReached 
            ? `Milestone Reached: Top ${milestone}` 
            : `${milestone - rank} ranks to reach Top ${milestone}`}
        </div>
        
        <div className="text-xs text-muted-foreground mt-0.5">
          {isReached 
            ? "Keep it up to maintain your position!" 
            : `Continue engaging to improve your rank.`}
        </div>
      </div>
    </div>
  );
}
