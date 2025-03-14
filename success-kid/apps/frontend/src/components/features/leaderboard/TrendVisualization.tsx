'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  filled?: boolean;
  className?: string;
}

/**
 * Sparkline
 * 
 * A simple sparkline visualization for trend data
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  stroke = 'currentColor',
  filled = false,
  className
}: SparklineProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Ensure we have some data
  if (!data || data.length < 2) {
    return <div className={cn("text-muted-foreground text-xs", className)}>No data</div>;
  }
  
  // Normalize dimensions
  const normalizedData = [...data];
  const maxValue = Math.max(...normalizedData);
  const minValue = Math.min(...normalizedData);
  const range = maxValue - minValue || 1;
  
  // Create points for the polyline
  const points = normalizedData.map((value, index) => {
    const x = (index / (normalizedData.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  // Determine trend
  const firstValue = normalizedData[0];
  const lastValue = normalizedData[normalizedData.length - 1];
  const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
  
  // Create filled area points if requested
  const areaPoints = filled ? 
    `${points} ${width},${height} 0,${height}` : 
    undefined;
  
  // Animation variants
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { type: "spring", duration: 1.5, bounce: 0 },
        opacity: { duration: 0.3 }
      }
    }
  };
  
  // Animation variants for filled area
  const areaVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        opacity: { duration: 0.5, delay: 0.3 }
      }
    }
  };
  
  return (
    <svg 
      width={width} 
      height={height} 
      className={cn(
        trend === 'up' ? 'text-success' : 
        trend === 'down' ? 'text-red-500' : 
        'text-amber-500',
        className
      )}
    >
      {filled && areaPoints && (
        <motion.polygon
          points={areaPoints}
          fill="currentColor"
          fillOpacity={0.1}
          initial={prefersReducedMotion ? "visible" : "hidden"}
          animate="visible"
          variants={areaVariants}
        />
      )}
      
      <motion.polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={prefersReducedMotion ? "visible" : "hidden"}
        animate="visible"
        variants={pathVariants}
      />
    </svg>
  );
}

interface TrendIndicatorProps {
  data: number[];
  showSparkline?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * TrendIndicator
 * 
 * Component to visualize trend direction with optional sparkline
 */
export function TrendIndicator({
  data,
  showSparkline = true,
  showLabel = true,
  size = 'md',
  className
}: TrendIndicatorProps) {
  // Ensure we have some data
  if (!data || data.length < 2) {
    return null;
  }
  
  // Calculate trend
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
  
  // Size variations
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  // Icon definitions
  const trendIcons = {
    up: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 7L13 15L9 11L3 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 13V7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 17L13 9L9 13L3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 11V17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    stable: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };
  
  // Label text
  const trendLabels = {
    up: 'Improving',
    down: 'Declining',
    stable: 'Stable'
  };
  
  // Get color based on trend
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-red-500';
      default: return 'text-amber-500';
    }
  };
  
  // Calculate percentage change
  const percentChange = firstValue !== 0 
    ? Math.round(((lastValue - firstValue) / Math.abs(firstValue)) * 100) 
    : lastValue > 0 ? 100 : 0;
  
  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn(
        "flex items-center",
        getTrendColor(trend),
        sizeClasses[size]
      )}>
        <div className={cn(
          "w-6 h-6 flex items-center justify-center rounded-full border",
          trend === 'up' ? "border-success/20 bg-success/10" :
          trend === 'down' ? "border-red-200/20 bg-red-100/10" :
          "border-amber-200/20 bg-amber-100/10"
        )}>
          <div className="w-3 h-3">
            {trendIcons[trend]}
          </div>
        </div>
        
        {showLabel && (
          <span className="ml-1.5 font-medium">
            {trendLabels[trend]} {Math.abs(percentChange)}%
          </span>
        )}
      </div>
      
      {showSparkline && (
        <Sparkline 
          data={data} 
          filled 
          className="ml-2"
          width={size === 'sm' ? 60 : size === 'md' ? 80 : 100} 
          height={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
        />
      )}
    </div>
  );
}

interface RankProgressProps {
  current: number;
  target: number;
  className?: string;
}

/**
 * RankProgress
 * 
 * Component to visualize progress toward next rank
 */
export function RankProgress({
  current,
  target,
  className
}: RankProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Calculate progress percentage
  const progress = Math.max(0, Math.min(100, (current / target) * 100));
  
  // Animation variants
  const progressVariants = {
    hidden: { width: '0%' },
    visible: { 
      width: `${progress}%`,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <div className="text-muted-foreground">Progress to Next Rank</div>
        <div className="font-medium">{Math.round(progress)}%</div>
      </div>
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={prefersReducedMotion ? "visible" : "hidden"}
          animate="visible"
          variants={progressVariants}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div className="text-muted-foreground">{current.toLocaleString()}</div>
        <div className="text-muted-foreground">{target.toLocaleString()}</div>
      </div>
    </div>
  );
}
