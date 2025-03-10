'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BattleCountdownProps {
  endTime: string
  className?: string
  onComplete?: () => void
}

export function BattleCountdown({ 
  endTime,
  className,
  onComplete
}: BattleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())
  
  // Calculate time left between now and end time
  function calculateTimeLeft() {
    const difference = +new Date(endTime) - +new Date()
    
    // If difference is negative, time has passed
    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 }
    }
    
    // Calculate hours, minutes, seconds
    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    }
  }
  
  useEffect(() => {
    // Update the countdown every second
    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)
      
      // Check if countdown has completed
      if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        onComplete?.()
      }
    }, 1000)
    
    // Clear timeout on component unmount
    return () => clearTimeout(timer)
  }, [timeLeft, endTime, onComplete])
  
  // Format the time units with leading zeros
  const formatTimeUnit = (unit: number) => unit.toString().padStart(2, '0')
  
  // Animation variants using design system tokens
  const timerVariants = {
    pulse: {
      scale: [1, 1.03, 1],
      transition: {
        duration: 2,
        ease: 'easeInOut',
        repeat: Infinity,
        times: [0, 0.5, 1]
      }
    }
  }
  
  // Get time unit with animation when it changes
  const TimeUnit = ({ value, unit, showSeparator = true }) => (
    <motion.span
      key={value}
      initial={{ opacity: 0.7, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        ease: 'easeOut'
      }}
      className="countdown-unit"
    >
      {formatTimeUnit(value)}
      <span className="text-zinc-400">{unit}</span>
      {showSeparator && <span className="mx-1">:</span>}
    </motion.span>
  )
  
  return (
    <motion.div 
      className={cn("text-xl", className)}
      variants={timerVariants}
      animate={"pulse"}
      style={{ 
        // Use design tokens for animation
        transitionTimingFunction: 'var(--easing-standard)',
      }}
    >
      {timeLeft.hours > 0 && (
        <TimeUnit value={timeLeft.hours} unit="h" />
      )}
      <TimeUnit value={timeLeft.minutes} unit="m" />
      <TimeUnit value={timeLeft.seconds} unit="s" showSeparator={false} />
    </motion.div>
  )
}
