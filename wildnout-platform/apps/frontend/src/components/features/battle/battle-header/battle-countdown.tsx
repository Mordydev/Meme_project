'use client'

import { useState, useEffect } from 'react'
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
  
  return (
    <div className={cn("text-xl", className)}>
      {timeLeft.hours > 0 && (
        <span className="countdown-unit">
          {formatTimeUnit(timeLeft.hours)}
          <span className="text-zinc-400">h</span>
          <span className="mx-1">:</span>
        </span>
      )}
      <span className="countdown-unit">
        {formatTimeUnit(timeLeft.minutes)}
        <span className="text-zinc-400">m</span>
        <span className="mx-1">:</span>
      </span>
      <span className="countdown-unit">
        {formatTimeUnit(timeLeft.seconds)}
        <span className="text-zinc-400">s</span>
      </span>
    </div>
  )
}
