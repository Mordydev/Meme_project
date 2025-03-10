'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white'
  className?: string
}

/**
 * Spinner loading animation
 */
export function Spinner({ 
  size = 'md', 
  color = 'primary',
  className 
}: SpinnerProps) {
  const prefersReducedMotion = useReducedMotion()
  
  // Size mappings
  const sizeMap = {
    'sm': 'size-4',
    'md': 'size-8',
    'lg': 'size-12'
  }
  
  // Color mappings
  const colorMap = {
    'primary': 'text-battle-yellow',
    'secondary': 'text-flow-blue',
    'white': 'text-hype-white'
  }
  
  return (
    <div className={cn("relative", sizeMap[size], className)}>
      <motion.svg
        className={cn("animate-spin", colorMap[color])}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={prefersReducedMotion ? { rotate: 0 } : { rotate: 360 }}
        transition={{
          duration: 1,
          ease: "linear",
          repeat: Infinity
        }}
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </motion.svg>
    </div>
  )
}

export interface PulseProps {
  children: React.ReactNode
  count?: number
  className?: string
}

/**
 * Pulse loading animation - ideal for cards and content blocks
 */
export function Pulse({ 
  children, 
  count = 3,
  className 
}: PulseProps) {
  const prefersReducedMotion = useReducedMotion()
  
  // If reduced motion is preferred, don't animate
  if (prefersReducedMotion) {
    return (
      <div className={className}>
        {children}
      </div>
    )
  }
  
  return (
    <div className={className}>
      <motion.div
        animate={{
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export interface ProgressBarProps {
  progress: number
  color?: 'primary' | 'secondary' | 'success'
  showPercentage?: boolean
  height?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

/**
 * Animated progress bar
 */
export function ProgressBar({
  progress,
  color = 'primary',
  showPercentage = false,
  height = 'md',
  animated = true,
  className
}: ProgressBarProps) {
  const prefersReducedMotion = useReducedMotion()
  
  // Ensure progress is within 0-100 range
  const normalizedProgress = Math.min(100, Math.max(0, progress))
  
  // Color mappings
  const colorMap = {
    'primary': 'bg-battle-yellow',
    'secondary': 'bg-flow-blue',
    'success': 'bg-victory-green'
  }
  
  // Height mappings
  const heightMap = {
    'sm': 'h-1',
    'md': 'h-2',
    'lg': 'h-3'
  }
  
  return (
    <div className={cn("w-full bg-zinc-800 rounded-full overflow-hidden", heightMap[height], className)}>
      <motion.div
        className={cn(colorMap[color], "rounded-full h-full")}
        initial={{ width: 0 }}
        animate={{ width: `${normalizedProgress}%` }}
        transition={{ 
          duration: animated && !prefersReducedMotion ? 0.6 : 0,
          ease: "easeOut"
        }}
      />
      {showPercentage && (
        <div className="text-xs mt-1 text-right">
          {Math.round(normalizedProgress)}%
        </div>
      )}
    </div>
  )
}

export interface SkeletonProps {
  width?: string
  height?: string
  className?: string
  circle?: boolean
}

/**
 * Skeleton loading placeholder
 */
export function Skeleton({ 
  width, 
  height,
  circle = false,
  className 
}: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <div
      className={cn(
        "bg-zinc-800 relative overflow-hidden", 
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      style={{ 
        width: width, 
        height: height 
      }}
    >
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent"
          animate={{ x: ["0%", "50%", "100%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
    </div>
  )
}

export interface BattleLoadingProps {
  text?: string
  className?: string
}

/**
 * Battle loading state with Wild 'n Out branding
 */
export function BattleLoading({
  text = "Loading battle",
  className
}: BattleLoadingProps) {
  const prefersReducedMotion = useReducedMotion()
  const chars = "WILDNOUT".split('')
  
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-8", className)}>
      <div className="flex items-center justify-center gap-1">
        {prefersReducedMotion ? (
          <div className="text-battle-yellow text-2xl font-display">WILD 'N OUT</div>
        ) : (
          chars.map((char, i) => (
            <motion.div
              key={i}
              className="text-battle-yellow text-2xl font-display"
              animate={{
                y: [-4, 0, 4, 0, -4],
                scale: char === "'" ? 1 : [1, 1.2, 1, 1, 1]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            >
              {char}
            </motion.div>
          ))
        )}
      </div>
      <div className="text-hype-white/60 text-sm">{text}</div>
      <ProgressBar 
        progress={70} 
        color="primary" 
        height="sm" 
        className="w-40 mt-2"
        animated={false}
      />
    </div>
  )
}
