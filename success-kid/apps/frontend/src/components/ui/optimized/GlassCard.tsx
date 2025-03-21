'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glassOpacity?: number;
  glassBlur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hoverEffect?: boolean;
  border?: boolean;
  borderGlow?: boolean;
  borderGlowIntensity?: 'light' | 'medium' | 'strong';
  borderGlowColor?: string;
  gradientBackground?: boolean;
  gradientColors?: string;
  gradientBorder?: boolean;
  shadowStyle?: 'soft' | 'medium' | 'strong' | 'premium';
  onClick?: () => void;
}

/**
 * Glass Card component for creating modern, frosted glass UI elements
 */
export function GlassCard({
  children,
  className = '',
  glassOpacity = 0.6,
  glassBlur = 'lg',
  hoverEffect = false,
  border = false,
  borderGlow = false,
  borderGlowIntensity = 'medium',
  borderGlowColor = 'primary',
  gradientBackground = false,
  gradientColors = 'from-primary/10 via-white/90 to-secondary/10',
  gradientBorder = false,
  shadowStyle = 'premium',
  onClick,
}: GlassCardProps) {
  // Log for debugging
  console.log('GlassCard rendering with:', {
    borderGlow,
    borderGlowIntensity,
    gradientBorder,
    shadowStyle
  });
  
  // Map shadow intensity to Tailwind classes
  const shadowClasses = {
    soft: 'shadow-sm hover:shadow-md',
    medium: 'shadow-md hover:shadow-lg',
    strong: 'shadow-lg hover:shadow-xl',
    premium: 'shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]'
  };
  
  // Map blur size to Tailwind class
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
    '2xl': 'backdrop-blur-2xl'
  };
  
  // Generate border style - REMOVED since we're applying border to the outer container now
  
  // Map border glow intensity to opacity values
  const borderGlowIntensityMap = {
    light: 'shadow-[0_0_15px_rgba(30,136,229,0.25)]',
    medium: 'shadow-[0_0_25px_rgba(30,136,229,0.35)]',
    strong: 'shadow-[0_0_35px_rgba(30,136,229,0.5)]'
  };
  
  // We'll use a separate element for the border glow effect
  const borderGlowElement = borderGlow ? (
    <div className={`absolute inset-0 rounded-lg ${borderGlowIntensityMap[borderGlowIntensity]} animate-pulse-glow z-[-5]`}></div>
  ) : null;
  
  // We'll create a gradient border effect if enabled
  const gradientBorderElement = gradientBorder ? (
    <div className="absolute inset-0 rounded-lg p-[1.5px] overflow-hidden z-[-2]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-secondary/60 to-primary/70 animate-gradient-rotation"></div>
    </div>
  ) : null;
  
  return (
    <motion.div
      className={cn(
        "relative rounded-lg overflow-hidden",
        border && !gradientBorder && "border border-white/30 dark:border-white/10", // Apply standard border only if gradient border is disabled
        hoverEffect && "transition-all duration-300 hover:-translate-y-1",
        shadowClasses[shadowStyle],
        onClick && "cursor-pointer",
        "debug-glass-card", // Add a debug class
        className
      )}
      onClick={onClick}
      whileHover={hoverEffect ? { scale: 1.02 } : {}}
    >
      {/* Border glow effect - separate element */}
      {borderGlowElement}
      
      {/* Gradient border if enabled */}
      {gradientBorderElement}
      
      {/* Single unified background layer */}
      <div 
        className={`absolute inset-0 -z-10 ${gradientBackground ? `bg-gradient-to-br ${gradientColors}` : ''}`} 
        // Extend slightly beyond boundaries to prevent edge artifacts
        style={{ 
          margin: '-1px',
          // If gradient background is enabled, use gradient with white base
          // Otherwise use simple semi-transparent white
          ...(gradientBackground ? {
            backgroundBlendMode: 'normal',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
          } : {
            backgroundColor: `rgba(255, 255, 255, ${glassOpacity})`
          })
        }} 
      />
      
      {/* Glass blur effect - applied over the background */}
      <div className={cn(
        "absolute inset-0 -z-10",
        blurClasses[glassBlur]
      )} />
      
      {/* Actual content */}
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}

export default GlassCard;
