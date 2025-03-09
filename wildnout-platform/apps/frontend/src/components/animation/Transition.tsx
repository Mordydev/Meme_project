'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TransitionProps {
  children: React.ReactNode
  type?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'battle'
  duration?: 'instant' | 'quick' | 'standard' | 'emphasis' | 'celebration'
  delay?: 'none' | 'short' | 'medium' | 'long'
  className?: string
  animateProps?: Record<string, any>
}

/**
 * Transition component for applying consistent animations
 */
export function Transition({
  children,
  type = 'fade',
  duration = 'standard',
  delay = 'none',
  className,
  animateProps,
  ...props
}: TransitionProps) {
  const prefersReducedMotion = useReducedMotion()
  
  // Map duration names to CSS variables
  const durationMap = {
    'instant': 'var(--duration-instant)',
    'quick': 'var(--duration-quick)',
    'standard': 'var(--duration-standard)',
    'emphasis': 'var(--duration-emphasis)',
    'celebration': 'var(--duration-celebration)',
  }
  
  // Map delay names to CSS variables
  const delayMap = {
    'none': '0ms',
    'short': 'var(--delay-short)',
    'medium': 'var(--delay-medium)',
    'long': 'var(--delay-long)',
  }
  
  // If reduced motion is preferred, simplify or disable animation
  if (prefersReducedMotion) {
    // For reduced motion, only use fade with shorter duration
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 0.1,
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
  
  // Animation variants based on type
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    'slide-up': {
      initial: { y: 10, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 10, opacity: 0 }
    },
    'slide-down': {
      initial: { y: -10, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -10, opacity: 0 }
    },
    scale: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 }
    },
    battle: {
      initial: { y: 20, scale: 0.9, opacity: 0 },
      animate: { 
        y: 0, 
        scale: 1, 
        opacity: 1,
        transition: { 
          type: 'spring',
          stiffness: 400,
          damping: 15
        }
      },
      exit: { 
        y: -20, 
        scale: 0.9, 
        opacity: 0,
        transition: { duration: 0.2 }
      }
    }
  }
  
  // Get the selected variant
  const selectedVariant = variants[type]
  
  // Merge any custom animate props with the selected variant
  const animateValues = { ...selectedVariant.animate, ...animateProps }
  
  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={animateValues}
      exit={selectedVariant.exit}
      transition={{ 
        duration: duration === 'standard' ? 0.3 : undefined, // Default for standard
        ease: 'easeOut',
        delay: delay === 'none' ? 0 : parseFloat(delayMap[delay]) / 1000
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Staggered children animation container
 */
export interface StaggerContainerProps {
  children: React.ReactNode
  staggerAmount?: number
  className?: string
}

export function StaggerContainer({ 
  children, 
  staggerAmount = 0.05, 
  className,
  ...props 
}: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion()
  
  // Wrap children to apply staggered animations
  const childrenArray = React.Children.toArray(children)
  
  if (prefersReducedMotion) {
    return <div className={className} {...props}>{children}</div>
  }
  
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {childrenArray.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: i * staggerAmount,
            ease: 'easeOut'
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}
