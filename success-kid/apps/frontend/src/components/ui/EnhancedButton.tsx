'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EnhancedButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  shine?: boolean;
  glow?: boolean;
  icon?: ReactNode;
}

export function EnhancedButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className,
  onClick,
  disabled = false,
  fullWidth = false,
  shine = true,
  glow = true,
  icon
}: EnhancedButtonProps) {
  // Base classes for all button variants
  const baseClasses = "relative inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none overflow-hidden";
  
  // Size classes
  const sizeClasses = {
    sm: "text-sm px-3 py-1.5 h-9",
    md: "text-base px-4 py-2 h-10",
    lg: "text-lg px-6 py-2.5 h-12"
  };
  
  // Variant classes
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-600 active:bg-primary-700",
    secondary: "bg-secondary text-black hover:bg-secondary-600 active:bg-secondary-700",
    outline: "border border-gray-300 bg-transparent text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800/50",
    glass: "bg-white/30 backdrop-blur-md border border-white/30 text-gray-800 shadow-sm hover:bg-white/40 dark:bg-gray-800/30 dark:text-gray-200 dark:hover:bg-gray-800/40"
  };
  
  // Additional width class if fullWidth is true
  const widthClass = fullWidth ? "w-full" : "";
  
  // Combine classes
  const buttonClasses = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    widthClass,
    className
  );
  
  // Button content with animations
  const content = (
    <>
      {/* Shine effect animation */}
      {shine && (variant === 'primary' || variant === 'secondary') && (
        <motion.span 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
          style={{ 
            willChange: 'transform',
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Hover glow effect with improved animation */}
      {glow && (
        <motion.span 
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.9 }}
          whileHover={{ 
            opacity: 1, 
            scale: 1.08,
            transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1.0] } 
          }}
          style={{ pointerEvents: 'none' }}
        >
          <motion.span 
            className={`absolute inset-0 ${
              variant === 'primary' ? 'bg-primary-400' : 
              variant === 'secondary' ? 'bg-secondary-400' : 
              'bg-primary-100'
            } blur-lg opacity-45`}
            animate={{ 
              opacity: [0.3, 0.45, 0.3],
              scale: [1, 1.08, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "reverse", 
              ease: "easeInOut"
            }}
          />
        </motion.span>
      )}
      
      {/* Button content */}
      <span className="relative z-10 flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </span>
    </>
  );
  
  // Render either a link or a button with enhanced scaling animation on click
  if (href) {
    return (
      <motion.div
        whileTap={{ scale: 0.95 }}
        whileHover={shine || glow ? { scale: 1.05, y: -2 } : { scale: 1.05, y: -2 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          mass: 1,
          duration: 0.4
        }}
      >
        <Link 
          href={href} 
          className={cn(buttonClasses, 'group')}
          {...(disabled ? { 'aria-disabled': true, tabIndex: -1 } : {})}
        >
          {content}
        </Link>
      </motion.div>
    );
  }
  
  return (
    <motion.button
      className={cn(buttonClasses, 'group')}
      onClick={onClick}
      disabled={disabled}
      type="button"
      whileTap={{ scale: 0.95 }}
      whileHover={shine || glow ? { scale: 1.05, y: -2 } : { scale: 1.05, y: -2 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        mass: 1,
        duration: 0.4
      }}
    >
      {content}
    </motion.button>
  );
}

export default EnhancedButton;
