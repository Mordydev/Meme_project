'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'

export interface CelebrationProps {
  children: React.ReactNode
  type?: 'victory' | 'achievement' | 'milestone' | 'battle-win'
  autoPlay?: boolean
  play?: boolean
  className?: string
  confettiOptions?: Record<string, any>
  onComplete?: () => void
}

/**
 * Celebration component for achievement and victory animations
 */
export function Celebration({
  children,
  type = 'achievement',
  autoPlay = true,
  play: playProp,
  className,
  confettiOptions,
  onComplete,
  ...props
}: CelebrationProps) {
  const prefersReducedMotion = useReducedMotion()
  const [play, setPlay] = useState(autoPlay)
  const [isComplete, setIsComplete] = useState(false)
  
  // Allow external control of the animation via the play prop
  useEffect(() => {
    if (playProp !== undefined) {
      setPlay(playProp)
    }
  }, [playProp])
  
  // Reset complete state when play changes to true
  useEffect(() => {
    if (play) {
      setIsComplete(false)
    }
  }, [play])
  
  // Fire confetti effect on play
  useEffect(() => {
    if (play && !prefersReducedMotion) {
      // Default confetti based on celebration type
      const defaultOptions = {
        victory: {
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E9E336', '#36E95C', '#3654E9'] // Wild 'n Out colors
        },
        achievement: {
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#E9E336'] // Battle Yellow
        },
        milestone: {
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 },
          startVelocity: 30,
          colors: ['#E9E336', '#36E95C'] // Yellow and Green
        },
        'battle-win': {
          particleCount: 80,
          spread: 120,
          origin: { y: 0.7 },
          angle: 135,
          colors: ['#E9E336', '#36E95C', '#FFFFFF'] // Full brand palette
        }
      }
      
      const options = {
        ...defaultOptions[type],
        ...confettiOptions
      }
      
      // Fire the confetti
      confetti(options)
      
      // For some types, add a second confetti burst
      if (type === 'milestone' || type === 'battle-win') {
        setTimeout(() => {
          confetti({
            ...options,
            origin: { y: 0.7, x: 0.8 },
            angle: 60
          })
        }, 300)
      }
    }
  }, [play, type, prefersReducedMotion, confettiOptions])
  
  // Animation variants based on celebration type
  const variants = {
    victory: {
      initial: { scale: 0.5, y: 20, opacity: 0 },
      animate: { 
        scale: 1, 
        y: 0, 
        opacity: 1, 
        transition: { 
          duration: 0.8,
          ease: 'backOut',
          times: [0, 0.6, 0.8, 1],
          y: { duration: 0.4, ease: 'easeOut' }
        }
      }
    },
    achievement: {
      initial: { scale: 0.8, rotate: -5, opacity: 0 },
      animate: { 
        scale: 1, 
        rotate: 0, 
        opacity: 1, 
        transition: { 
          type: 'spring',
          stiffness: 400,
          damping: 10
        }
      }
    },
    milestone: {
      initial: { scale: 0.5, opacity: 0 },
      animate: { 
        scale: [0.5, 1.1, 0.95, 1],
        opacity: [0, 1, 1, 1], 
        transition: { 
          duration: 1.2,
          times: [0, 0.5, 0.8, 1],
          ease: 'easeOut'
        }
      }
    },
    'battle-win': {
      initial: { scale: 0.7, y: 30, opacity: 0 },
      animate: { 
        scale: [0.7, 1.1, 1],
        y: [30, -10, 0],
        opacity: [0, 1, 1], 
        transition: { 
          duration: 0.8,
          times: [0, 0.7, 1],
          ease: 'easeOut'
        }
      }
    }
  }
  
  // Get the selected variant
  const selectedVariant = variants[type]
  
  // If reduced motion is preferred, simplify animation
  if (prefersReducedMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    )
  }
  
  const handleAnimationComplete = () => {
    setIsComplete(true)
    onComplete?.()
  }
  
  return (
    <AnimatePresence>
      {play && (
        <motion.div
          initial={selectedVariant.initial}
          animate={selectedVariant.animate}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          onAnimationComplete={handleAnimationComplete}
          className={cn("flex items-center justify-center", className)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export interface AchievementBadgeProps {
  name: string
  icon?: React.ReactNode
  unlocked?: boolean
  animate?: boolean
  className?: string
}

/**
 * Achievement Badge component with celebration effects
 */
export function AchievementBadge({
  name,
  icon,
  unlocked = true,
  animate = false,
  className,
  ...props
}: AchievementBadgeProps) {
  return (
    <Celebration
      type="achievement"
      autoPlay={animate && unlocked}
      className={cn("inline-block", className)}
      {...props}
    >
      <div 
        className={cn(
          "relative size-16 rounded-full flex items-center justify-center shadow-md",
          unlocked 
            ? "bg-gradient-to-br from-battle-yellow to-victory-green text-wild-black" 
            : "bg-zinc-800 text-zinc-600"
        )}
      >
        {icon || (
          <span className="text-xl font-display font-bold">
            {name.substring(0, 1).toUpperCase()}
          </span>
        )}
        {unlocked && (
          <span className="absolute -bottom-1 -right-1 size-6 bg-victory-green rounded-full text-wild-black flex items-center justify-center text-sm">
            ✓
          </span>
        )}
      </div>
      <div className="text-center mt-2 font-medium text-sm">
        {name}
      </div>
    </Celebration>
  )
}
