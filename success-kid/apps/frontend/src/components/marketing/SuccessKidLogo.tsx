'use client';

import React from 'react';
import { motion } from 'framer-motion';
import tokens from '@/theme/tokens';

interface SuccessKidLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function SuccessKidLogo({ size = 200, animated = true, className = '' }: SuccessKidLogoProps) {
  // Animation variants
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.5, ease: "easeInOut" },
        opacity: { duration: 0.3 }
      }
    }
  };

  const fistVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        delay: 0.5, 
        duration: 0.8, 
        ease: tokens.animation.easings.emphatic 
      }
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background Circle */}
        <motion.circle 
          cx="100" 
          cy="100" 
          r="90" 
          stroke={tokens.colors.primary.DEFAULT}
          strokeWidth="2"
          initial={animated ? "hidden" : "visible"}
          animate="visible"
          variants={pathVariants}
          fill="none"
        />
        
        {/* Success Kid Face SVG Representation */}
        <motion.g
          initial={animated ? "hidden" : "visible"}
          animate="visible"
          variants={fistVariants}
        >
          {/* Simplified head/face */}
          <circle cx="100" cy="80" r="35" fill="#FFD3AE" />
          
          {/* Hair */}
          <path d="M75 55C85 35 110 35 125 55" stroke="#663931" strokeWidth="6" strokeLinecap="round" />
          
          {/* Eyes */}
          <circle cx="85" cy="75" r="4" fill="#663931" />
          <circle cx="115" cy="75" r="4" fill="#663931" />
          
          {/* Smiling mouth */}
          <path d="M85 90C95 100 105 100 115 90" stroke="#663931" strokeWidth="3" strokeLinecap="round" />
          
          {/* Raised fist */}
          <motion.g 
            initial={animated ? { rotate: -10, y: 10 } : { rotate: 0, y: 0 }}
            animate={{ rotate: 0, y: 0 }}
            transition={{ 
              delay: 1,
              duration: 0.5, 
              type: "spring",
              stiffness: 300,
              damping: 15
            }}
          >
            <rect x="80" y="105" width="40" height="45" rx="10" fill="#FFD3AE" />
            <path d="M80 125L120 125" stroke="#663931" strokeWidth="2" />
            <path d="M85 135L115 135" stroke="#663931" strokeWidth="2" />
          </motion.g>
        </motion.g>
      </svg>
      
      {/* Dynamic glow effect */}
      {animated && (
        <motion.div 
          className="absolute inset-0 -z-10 rounded-full opacity-20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.3 }}
          transition={{ 
            delay: 1.2,
            duration: 1.5, 
            ease: "easeOut" 
          }}
          style={{ 
            background: `radial-gradient(circle, ${tokens.colors.primary.DEFAULT} 0%, transparent 70%)`,
            filter: 'blur(15px)'
          }}
        />
      )}
    </div>
  );
}
