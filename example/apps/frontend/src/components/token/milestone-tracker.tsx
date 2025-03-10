'use client'

import { useEffect, useState, useRef } from 'react'
import { getTokenMarketCap } from '@/lib/blockchain/web3'
import { formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'

interface Milestone {
  id: string
  target: number  // Market cap value
  label: string   // Display label
  description: string
}

interface MilestoneTrackerProps {
  milestones?: Milestone[]
  initialMarketCap?: number
  compact?: boolean
}

export function MilestoneTracker({
  milestones: propMilestones,
  initialMarketCap,
  compact = false
}: MilestoneTrackerProps) {
  const [marketCap, setMarketCap] = useState<number>(initialMarketCap || 0)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [progressPercentage, setProgressPercentage] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(!initialMarketCap)
  const [celebrating, setCelebrating] = useState<boolean>(false)
  const previousMilestoneRef = useRef<number | null>(null)
  
  // Default milestones if none provided
  const defaultMilestones: Milestone[] = [
    { id: 'milestone-10m', target: 10000000, label: '$10M', description: 'Initial community building milestone' },
    { id: 'milestone-50m', target: 50000000, label: '$50M', description: 'Enhanced platform features unlocked' },
    { id: 'milestone-100m', target: 100000000, label: '$100M', description: 'Major marketing and development expansion' },
    { id: 'milestone-200m', target: 200000000, label: '$200M', description: 'Integration with major platforms' },
    { id: 'milestone-500m', target: 500000000, label: '$500M', description: 'Full ecosystem deployment' },
  ]
  
  useEffect(() => {
    setMilestones(propMilestones || defaultMilestones)
  }, [propMilestones])
  
  // Fetch market cap data and set up real-time updates
  useEffect(() => {
    let isMounted = true
    
    // Skip fetch if we already have initial data
    const shouldFetch = !initialMarketCap
    
    async function fetchMarketCap() {
      try {
        setLoading(true)
        const data = await getTokenMarketCap()
        
        if (isMounted) {
          setMarketCap(data.marketCap)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching market cap:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    if (shouldFetch) {
      fetchMarketCap()
    }
    
    // Refresh market cap periodically
    const interval = setInterval(fetchMarketCap, 5 * 60 * 1000) // Every 5 minutes
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [initialMarketCap])
  
  // Calculate active milestone and progress
  useEffect(() => {
    if (milestones.length === 0 || marketCap === 0) {
      return
    }
    
    // Find the last milestone we've hit and the next one
    let currentIndex = -1
    for (let i = 0; i < milestones.length; i++) {
      if (marketCap >= milestones[i].target) {
        currentIndex = i
      } else {
        break
      }
    }
    
    const nextIndex = currentIndex + 1
    const newActiveIndex = nextIndex < milestones.length ? nextIndex : milestones.length - 1
    
    // Calculate progress percentage
    let progress = 0
    if (newActiveIndex > 0) {
      const previousTarget = milestones[newActiveIndex - 1].target
      const currentTarget = milestones[newActiveIndex].target
      const range = currentTarget - previousTarget
      const current = marketCap - previousTarget
      progress = Math.min(Math.max((current / range) * 100, 0), 100)
    } else if (newActiveIndex === 0) {
      progress = Math.min(Math.max((marketCap / milestones[0].target) * 100, 0), 100)
    } else {
      progress = 100
    }
    
    setActiveIndex(newActiveIndex)
    setProgressPercentage(progress)
    
    // Check if we just crossed a milestone
    const prevMilestoneIndex = previousMilestoneRef.current !== null 
      ? milestones.findIndex(m => m.target === previousMilestoneRef.current)
      : -2 // Initialize to a value that won't match any index
    
    if (prevMilestoneIndex !== -1 && currentIndex > prevMilestoneIndex) {
      // We've crossed a milestone, trigger celebration!
      setCelebrating(true)
      setTimeout(() => setCelebrating(false), 5000) // Show celebration for 5 seconds
    }
    
    // Store current milestone for next comparison
    previousMilestoneRef.current = currentIndex >= 0 ? milestones[currentIndex].target : null
    
  }, [milestones, marketCap])
  
  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse space-y-3" data-testid="loading-skeleton">
        <div className="h-4 bg-zinc-800 w-1/2 rounded"></div>
        <div className="h-2 bg-zinc-800 w-full rounded-full"></div>
        <div className="h-8 bg-zinc-800 w-3/4 rounded"></div>
      </div>
    )
  }
  
  // Get current and next milestone
  const activeMilestone = activeIndex < milestones.length ? milestones[activeIndex] : milestones[milestones.length - 1]
  const prevMilestone = activeIndex > 0 ? milestones[activeIndex - 1] : null
  
  return (
    <div className="space-y-3">
      {/* Header with current market cap */}
      <div className="flex justify-between items-baseline">
        <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold`}>Market Cap</h3>
        <span className={`${compact ? 'text-base' : 'text-xl'} font-bold`}>
          {formatCurrency(marketCap)}
        </span>
      </div>
      
      {/* Next milestone info */}
      <div className="space-y-1">
        <div className="flex justify-between items-baseline text-sm">
          <span>Next Milestone: {activeMilestone.label}</span>
          <span>{formatCurrency(activeMilestone.target)}</span>
        </div>
        
        {/* Progress bar */}
        <Progress value={progressPercentage} className="h-2" />
        
        <div className="flex justify-between text-xs text-zinc-400">
          <span>
            {prevMilestone ? prevMilestone.label : '$0'}
          </span>
          <span>
            {progressPercentage.toFixed(1)}% complete
          </span>
          <span>
            {activeMilestone.label}
          </span>
        </div>
      </div>
      
      {/* Milestone description */}
      {!compact && (
        <div className="p-4 bg-zinc-800/50 rounded-md">
          <p className="text-sm">{activeMilestone.description}</p>
        </div>
      )}
      
      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
            >
              <div className="text-4xl md:text-6xl font-bold text-battle-yellow mb-4">
                Milestone Reached!
              </div>
              <div className="text-2xl md:text-3xl text-hype-white">
                {prevMilestone ? prevMilestone.label : 'First milestone'} market cap achieved!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Milestone timeline (non-compact mode only) */}
      {!compact && (
        <div className="pt-4">
          <h4 className="text-sm font-medium mb-4">Market Cap Journey</h4>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-1 h-full w-0.5 bg-zinc-700"></div>
            
            <div className="space-y-6">
              {milestones.map((milestone, index) => {
                const isActive = index === activeIndex
                const isPast = marketCap >= milestone.target
                const isFuture = !isPast && !isActive
                
                return (
                  <div key={milestone.id} className="flex">
                    {/* Milestone marker */}
                    <div 
                      className={`h-6 w-6 rounded-full flex-shrink-0 z-10 flex items-center justify-center 
                        ${isPast 
                          ? 'bg-victory-green/20 border-2 border-victory-green text-victory-green' 
                          : isActive 
                            ? 'bg-battle-yellow/20 border-2 border-battle-yellow text-battle-yellow' 
                            : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400'
                        }`}
                    >
                      {isPast && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-battle-yellow"></div>
                      )}
                    </div>
                    
                    {/* Milestone content */}
                    <div className="ml-4 pb-6">
                      <div className="flex justify-between items-baseline">
                        <h5 className={`font-medium ${isPast ? 'text-victory-green' : isActive ? 'text-battle-yellow' : 'text-zinc-400'}`}>
                          {milestone.label}
                        </h5>
                        <span className="text-sm text-zinc-400">
                          {formatCurrency(milestone.target)}
                        </span>
                      </div>
                      <p className={`text-sm ${isFuture ? 'text-zinc-500' : 'text-zinc-300'}`}>
                        {milestone.description}
                      </p>
                      
                      {isPast && (
                        <div className="mt-1 text-xs text-victory-green">
                          Achieved
                        </div>
                      )}
                      {isActive && (
                        <div className="mt-1 text-xs text-battle-yellow">
                          In progress - {progressPercentage.toFixed(1)}% complete
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
