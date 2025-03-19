'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface SuccessKidLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: 'default' | 'outline' | 'minimal' | 'glow';
  color?: 'primary' | 'secondary' | 'accent' | 'white';
}

export function SuccessKidLogo({ 
  size = 100, 
  className = '',
  animated = true,
  variant = 'default',
  color = 'primary'
}: SuccessKidLogoProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Define color values based on the color prop
  const getColorValues = () => {
    switch (color) {
      case 'secondary':
        return {
          main: 'bg-secondary',
          light: 'bg-secondary/30',
          silhouette: 'bg-black opacity-80',
        };
      case 'accent':
        return {
          main: 'bg-accent',
          light: 'bg-accent/30',
          silhouette: 'bg-black opacity-80',
        };
      case 'white':
        return {
          main: 'bg-white',
          light: 'bg-white/30',
          silhouette: 'bg-black opacity-80',
        };
      default: // primary
        return {
          main: 'bg-primary',
          light: 'bg-primary/30',
          silhouette: 'bg-black opacity-80',
        };
    }
  };
  
  const colors = getColorValues();
  
  // Animation variants for the logo
  const logoVariants = {
    initial: { scale: 0.9, opacity: 0.5 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.5,
        yoyo: Infinity,
        repeatDelay: 5
      }
    }
  };

  // Fist pump animation
  const fistVariants = {
    initial: { rotate: 0 },
    animate: { 
      rotate: prefersReducedMotion ? 0 : [0, 15, 0],
      transition: { 
        duration: 1.5, 
        repeat: Infinity, 
        repeatDelay: 4
      }
    }
  };
  
  // Glow animation
  const glowVariants = {
    initial: { opacity: 0.3, scale: 0.9 },
    animate: {
      opacity: prefersReducedMotion ? 0.3 : [0.3, 0.6, 0.3],
      scale: prefersReducedMotion ? 0.9 : [0.9, 1.1, 0.9],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse'
      }
    }
  };

  // Define the logo based on variant
  const renderLogo = () => {
    // Minimal variant (just the circle with colors)
    if (variant === 'minimal') {
      return (
        <div className={`absolute inset-0 rounded-full ${colors.main}`}>
          {/* Simple gradient overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      );
    }
    
    // Outline variant
    if (variant === 'outline') {
      return (
        <>
          <div className={`absolute inset-2 rounded-full bg-white`} />
          <div className={`absolute inset-3 rounded-full border-2 ${color === 'white' ? 'border-white' : `border-${color}`}`}>
            {/* Simplified Success Kid silhouette */}
            <motion.div
              variants={animated ? fistVariants : {}}
              className="absolute bottom-0 left-1/2 h-1/2 w-1/2 -translate-x-1/2"
            >
              <div className="absolute bottom-0 left-1/2 h-1/2 w-1/2 -translate-x-1/2 bg-black opacity-60 rounded-full"></div>
              <div className="absolute bottom-0 right-0 h-1/3 w-1/3 bg-black opacity-60 rounded-full"></div>
            </motion.div>
          </div>
        </>
      );
    }
    
    // Default and glow variants (full color with silhouette)
    return (
      <div className={`absolute inset-0 rounded-full ${colors.main} overflow-hidden`}>
        {/* Success Kid silhouette */}
        <motion.div
          variants={animated ? fistVariants : {}}
          className="relative h-1/2 w-1/2 absolute inset-0 flex items-center justify-center"
        >
          {/* Simplified Success Kid silhouette - can be enhanced with SVG */}
          <div className="absolute bottom-0 left-1/2 h-1/2 w-1/2 -translate-x-1/2 bg-black opacity-80 rounded-full"></div>
          <div className="absolute bottom-0 right-0 h-1/3 w-1/3 bg-black opacity-80 rounded-full"></div>
        </motion.div>
      </div>
    );
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial="initial"
      animate={animated ? "animate" : "initial"}
      variants={logoVariants}
    >
      {/* Main logo */}
      {renderLogo()}
      
      {/* Glow effect for glow variant or default */}
      {(variant === 'glow' || variant === 'default') && (
        <motion.div 
          className={`absolute -inset-2 rounded-full ${colors.light} blur-md -z-10`}
          variants={variant === 'glow' && animated ? glowVariants : {}}
        />
      )}
    </motion.div>
  );
}

export default SuccessKidLogo;
