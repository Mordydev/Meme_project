'use client';

import React, { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export interface GlowingEffectProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  hoverGlow?: boolean;
  permanentGlow?: boolean;
  pulseGlow?: boolean;
  glowSize?: 'sm' | 'md' | 'lg';
  glowOpacity?: number;
  disable?: boolean;
  glowOnContent?: boolean;
}

/**
 * GlowingEffect - Adds a premium glowing effect to highlight important elements
 * 
 * @example
 * <GlowingEffect>
 *   <Button>Premium Button</Button>
 * </GlowingEffect>
 * 
 * @example
 * <GlowingEffect hoverGlow glowColor="rgba(255, 193, 7, 0.6)">
 *   <Card>Hover for glow effect</Card>
 * </GlowingEffect>
 */
export function GlowingEffect({
  children,
  className,
  glowColor = 'rgba(30, 136, 229, 0.5)', // Primary color
  hoverGlow = true,
  permanentGlow = false,
  pulseGlow = false,
  glowSize = 'md',
  glowOpacity = 0.5,
  disable = false,
  glowOnContent = false,
}: GlowingEffectProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Skip effect if reduced motion is preferred or explicitly disabled
  if (prefersReducedMotion || disable) {
    return <div className={className}>{children}</div>;
  }
  
  // Determine if glow should be shown
  const showGlow = permanentGlow || (hoverGlow && isHovered);
  
  // Set glow size based on prop
  const sizeMap = {
    sm: 'blur-sm',
    md: 'blur-md',
    lg: 'blur-xl',
  };
  
  const blurSize = sizeMap[glowSize];
  
  // Dynamically set glow color with opacity
  const color = glowColor;
  
  // Handle mouse events for hover effect
  const handleMouseEnter = () => {
    if (hoverGlow) {
      setIsHovered(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (hoverGlow) {
      setIsHovered(false);
    }
  };
  
  // Define pulse animation variants
  const pulseVariants = {
    pulse: {
      opacity: [glowOpacity * 0.7, glowOpacity, glowOpacity * 0.7],
      scale: [0.98, 1.02, 0.98],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    },
    hover: {
      opacity: glowOpacity,
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    permanent: {
      opacity: glowOpacity,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hidden: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };
  
  // Determine which animation variant to use
  let animationVariant = 'hidden';
  if (showGlow) {
    if (pulseGlow) {
      animationVariant = 'pulse';
    } else if (hoverGlow && isHovered) {
      animationVariant = 'hover';
    } else if (permanentGlow) {
      animationVariant = 'permanent';
    }
  }
  
  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glowing background effect */}
      <motion.div
        className={cn(
          "absolute -inset-1",
          blurSize,
          glowOnContent ? "z-10" : "z-0",
          "opacity-0", // Start with opacity 0
        )}
        animate={animationVariant}
        variants={pulseVariants}
        initial="hidden"
        style={{
          background: color,
          borderRadius: 'inherit',
        }}
      />
      
      {/* Actual content */}
      <div className={cn(
        "relative",
        glowOnContent ? "z-0" : "z-10",
      )}>
        {children}
      </div>
    </div>
  );
}
