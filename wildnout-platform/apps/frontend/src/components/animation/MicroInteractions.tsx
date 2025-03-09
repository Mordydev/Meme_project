'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Highlight Component
 * Emphasizes content with subtle animations
 */
export interface HighlightProps {
  children: React.ReactNode
  type?: 'pulse' | 'glow' | 'wiggle'
  className?: string
}

export function Highlight({ children, type = 'pulse', className }: HighlightProps) {
  const animations = {
    pulse: {
      animate: {
        opacity: [1, 0.7, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    },
    glow: {
      animate: {
        boxShadow: [
          '0 0 0 rgba(233, 227, 54, 0)',
          '0 0 8px rgba(233, 227, 54, 0.5)',
          '0 0 0 rgba(233, 227, 54, 0)'
        ],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    },
    wiggle: {
      animate: {
        rotate: [0, -2, 0, 2, 0],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut'
        }
      }
    }
  }

  return (
    <motion.div
      className={className}
      {...animations[type]}
    >
      {children}
    </motion.div>
  )
}

/**
 * HoverEffect Component
 * Applies interactive effects on hover
 */
export interface HoverEffectProps {
  children: React.ReactNode
  type?: 'float' | 'grow' | 'glow'
  className?: string
}

export function HoverEffect({ children, type = 'float', className }: HoverEffectProps) {
  const hoverEffects = {
    float: {
      initial: { y: 0 },
      whileHover: { y: -5, transition: { duration: 0.2, ease: 'easeOut' } }
    },
    grow: {
      initial: { scale: 1 },
      whileHover: { scale: 1.05, transition: { duration: 0.2, ease: 'easeOut' } }
    },
    glow: {
      initial: { boxShadow: '0 0 0 rgba(233, 227, 54, 0)' },
      whileHover: { 
        boxShadow: '0 0 15px rgba(233, 227, 54, 0.5)',
        transition: { duration: 0.3, ease: 'easeOut' }
      }
    }
  }

  return (
    <motion.div
      className={cn("transition-all", className)}
      {...hoverEffects[type]}
    >
      {children}
    </motion.div>
  )
}

/**
 * Counter Component
 * Animated number counter with formatting options
 */
export interface CounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  formatter?: (value: number) => string
  className?: string
}

export function Counter({ 
  value, 
  duration = 1.5, 
  prefix = '',
  suffix = '',
  formatter = (v) => v.toLocaleString(),
  className 
}: CounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0)
  
  React.useEffect(() => {
    let startTime: number | null = null
    const startValue = displayValue
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      // Use easeOutExpo for a nice counting effect
      const easeOutProgress = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(startValue + (value - startValue) * easeOutProgress)
      
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    
    window.requestAnimationFrame(step)
  }, [value, duration, displayValue])
  
  return (
    <span className={cn("font-display font-bold", className)}>
      {prefix}{formatter(Math.round(displayValue))}{suffix}
    </span>
  )
}

/**
 * NotificationBadge Component
 * Displays notifications count with animation
 */
export interface NotificationBadgeProps {
  count: number
  maxCount?: number
  color?: 'primary' | 'secondary' | 'destructive'
  className?: string
}

export function NotificationBadge({ 
  count, 
  maxCount = 99,
  color = 'destructive', 
  className 
}: NotificationBadgeProps) {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString()
  
  const colorClasses = {
    primary: "bg-battle-yellow text-wild-black",
    secondary: "bg-flow-blue text-hype-white",
    destructive: "bg-roast-red text-hype-white"
  }
  
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "min-w-5 h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-medium",
        colorClasses[color],
        className
      )}
    >
      {displayCount}
    </motion.div>
  )
}
