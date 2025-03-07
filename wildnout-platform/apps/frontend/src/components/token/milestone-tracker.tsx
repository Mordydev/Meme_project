'use client'

import { useEffect, useState } from 'react'
import { getTokenMilestones, getTokenMarketCap } from '@/lib/blockchain/web3'
import { formatCurrency } from '@/lib/utils'

type Milestone = {
  id: string
  level: number
  target: number
  title: string
  description: string
  achieved: boolean
  achievedAt?: string
}

export function MilestoneTracker() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [currentMarketCap, setCurrentMarketCap] = useState<number | null>(null)
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchData() {
      try {
        // Fetch milestones and market cap in parallel
        const [milestonesData, marketCapData] = await Promise.all([
          getTokenMilestones(),
          getTokenMarketCap()
        ])
        
        if (isMounted) {
          setMilestones(milestonesData)
          setCurrentMarketCap(marketCapData.marketCap)
          
          // Find next milestone
          const next = milestonesData
            .filter(m => !m.achieved)
            .sort((a, b) => a.target - b.target)[0] || null
            
          setNextMilestone(next)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching milestone data:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchData()
    
    // Refresh milestone data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-40 bg-zinc-800 rounded"></div>
        <div className="h-4 w-full bg-zinc-800 rounded"></div>
        <div className="h-20 w-full bg-zinc-800 rounded"></div>
      </div>
    )
  }
  
  if (!nextMilestone || milestones.length === 0) {
    return (
      <div className="p-4 border border-zinc-800 rounded-lg">
        <p className="text-zinc-400">No milestones available</p>
      </div>
    )
  }
  
  // Calculate progress percentage
  const progressPercentage = currentMarketCap && nextMilestone
    ? Math.min(100, (currentMarketCap / nextMilestone.target) * 100)
    : 0
  
  // Get previous achieved milestone for reference
  const previousMilestone = milestones
    .filter(m => m.achieved)
    .sort((a, b) => b.target - a.target)[0]
  
  return (
    <div className="p-4 border border-zinc-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Next Milestone</h3>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-400">
          {previousMilestone 
            ? formatCurrency(previousMilestone.target)
            : '$0'}
        </span>
        <span className="text-sm text-zinc-400">
          {formatCurrency(nextMilestone.target)}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-4 bg-zinc-800 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-battle-yellow"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="mb-2">
        <h4 className="font-semibold">{nextMilestone.title}</h4>
        <p className="text-sm text-zinc-400">{nextMilestone.description}</p>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-400">Current: {formatCurrency(currentMarketCap || 0)}</span>
        <span className="text-zinc-400">
          {formatCurrency(Math.max(0, (nextMilestone.target - (currentMarketCap || 0))))} to go
        </span>
      </div>
      
      {/* Achievement counter */}
      <div className="mt-4 text-sm text-zinc-400">
        {milestones.filter(m => m.achieved).length} of {milestones.length} milestones achieved
      </div>
    </div>
  )
}
