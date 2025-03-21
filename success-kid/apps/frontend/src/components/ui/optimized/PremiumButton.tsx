'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface PremiumButtonProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  gradientColors?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  effects?: {
    shine?: boolean;
    glow?: boolean;
    pulse?: boolean;
    particles?: boolean;
  }
}

/**
 * Premium Button component with high-quality visual effects
 */
export function PremiumButton({
  children,
  variant = 'solid',
  size = 'md',
  gradientColors = 'from-primary via-primary-600 to-primary-700',
  href,
  onClick,
  className = '',
  disabled = false,
  effects = {
    shine: true,
    glow: true,
    pulse: false,
    particles: false,
  }
}: PremiumButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Map size to appropriate classes
  const sizeClasses = {
    sm: 'text-sm py-2 px-3',
    md: 'text-base py-2.5 px-4',
    lg: 'text-lg py-3 px-6',
    xl: 'text-xl py-4 px-8',
  };
  
  // Get base button styles based on variant
  const getBaseStyles = () => {
    switch (variant) {
      case 'solid':
        return 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700';
      case 'outline':
        return 'bg-transparent text-primary border-2 border-primary hover:bg-primary/5 active:bg-primary/10';
      case 'gradient':
        return `bg-gradient-to-r ${gradientColors} text-white shadow-lg hover:shadow-xl active:shadow-md`;
      default:
        return 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700';
    }
  };
  
  // Construct button classes
  const buttonClasses = cn(
    "relative rounded-md font-medium transition-all duration-300 overflow-hidden",
    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    sizeClasses[size],
    getBaseStyles(),
    className
  );
  
  // Button's main content
  const buttonContent = (
    <>
      {/* Shine effect */}
      {effects.shine && !disabled && isHovered && (
        <motion.div
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0, scale: 0, x: '-100%' }}
          animate={{ opacity: 0.2, scale: 1, x: '100%' }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <div className="w-12 h-full absolute transform -rotate-12 bg-white/30 blur-sm" />
          <div className="w-4 h-full absolute transform -rotate-12 bg-white/40 blur-sm" />
        </motion.div>
      )}
      
      {/* Glow effect */}
      {effects.glow && !disabled && (
        <div className="absolute inset-0 w-full h-full transition-opacity duration-300">
          <div 
            className={cn(
              "absolute inset-0 rounded-md -z-10 opacity-0 transition-opacity duration-300",
              isHovered ? "opacity-100" : ""
            )}
            style={{
              background: variant === 'gradient' 
                ? `radial-gradient(circle at center, ${isHovered ? 'rgba(30, 136, 229, 0.3)' : 'rgba(30, 136, 229, 0)'} 0%, transparent 70%)`
                : `radial-gradient(circle at center, ${isHovered ? 'rgba(30, 136, 229, 0.3)' : 'rgba(30, 136, 229, 0)'} 0%, transparent 70%)`,
              transform: 'scale(1.2)',
            }}
          />
        </div>
      )}
      
      {/* Particles effect */}
      {effects.particles && !disabled && isHovered && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => {
            const size = 3 + Math.random() * 4;
            const startX = 5 + Math.random() * 90;
            const delay = i * 0.1;
            
            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute bg-white/60 rounded-full"
                style={{
                  width: size,
                  height: size,
                  left: `${startX}%`,
                  bottom: '-10%',
                }}
                initial={{ y: 0, opacity: 0 }}
                animate={{ 
                  y: [0, -40 - (i * 5)],
                  opacity: [0, 0.8, 0],
                  x: [0, (Math.random() - 0.5) * 30]
                }}
                transition={{
                  duration: 1 + (Math.random() * 0.5),
                  delay: delay,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            );
          })}
        </div>
      )}
      
      {/* Main content */}
      <motion.span
        className="relative z-10 flex items-center justify-center gap-2"
        animate={effects.pulse && !disabled ? {
          scale: isHovered ? [1, 1.03, 1] : 1
        } : {}}
        transition={{
          duration: 1.5,
          repeat: effects.pulse && isHovered ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.span>
    </>
  );
  
  // Use motion.button for animation effects
  const ButtonElement = (
    <motion.button
      type="button"
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {buttonContent}
    </motion.button>
  );
  
  // If href is provided, wrap in Link component
  if (href) {
    return (
      <Link href={href} className={disabled ? 'pointer-events-none' : ''}>
        {ButtonElement}
      </Link>
    );
  }
  
  // Otherwise, return the button directly
  return ButtonElement;
}

export default PremiumButton;
