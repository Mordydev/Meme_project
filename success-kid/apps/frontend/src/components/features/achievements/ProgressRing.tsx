'use client';

import React from 'react';

/**
 * Props for the ProgressRing component
 */
interface ProgressRingProps {
  progress: number; // 0-100 percentage
  size: number; // Size in pixels
  strokeWidth: number; // Width of the progress circle
  bgColor?: string; // Background circle color
  fgColor?: string; // Foreground progress color
  className?: string;
}

/**
 * Circular progress indicator component
 */
export function ProgressRing({
  progress,
  size,
  strokeWidth,
  bgColor = 'rgba(0, 0, 0, 0.1)',
  fgColor = 'rgba(30, 136, 229, 0.8)',
  className = '',
}: ProgressRingProps) {
  // Calculate dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={fgColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
      />
      
      {/* Progress text */}
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        fontSize={size / 5}
        fontWeight="bold"
        fill="white"
      >
        {progress}%
      </text>
    </svg>
  );
}
