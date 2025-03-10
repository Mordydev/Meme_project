'use client'

import { useEffect, useState } from 'react'
import { getTokenMarketCap, getTokenMilestones } from '@/lib/blockchain/web3'
import { formatCurrency } from '@/lib/utils'

// Define milestone type
interface Milestone {
  id: string
  target: number  // Target market cap in USD
  label: string   // Display label (e.g. "$10M")
  description: string
  achieved: boolean
  benefits?: string[]
}

export function TokenMilestoneTracker() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [currentMarketCap, setCurrentMarketCap] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Calculate percentage progress to next milestone
  const calculateProgress = (): number => {
    // Find the next unachieved milestone
    const nextMilestone = milestones.find(m => !m.achieved)
    
    if (!nextMilestone) {
      // All milestones achieved
      return 100
    }
    
    // Find the previous milestone
    const prevIndex = milestones.indexOf(nextMilestone) - 1
    const prevMilestone = prevIndex >= 0 ? milestones[prevIndex] : { target: 0 }
    
    // Calculate progress percentage between previous and next milestone
    const range = nextMilestone.target - prevMilestone.target
    const progress = currentMarketCap - prevMilestone.target
    
    if (range <= 0) return 0
    return Math.min(Math.max((progress / range) * 100, 0), 100)
  }
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch market cap
        const marketCapData = await getTokenMarketCap()
        
        // Fetch milestones
        const milestonesData = await getTokenMilestones()
        
        if (isMounted) {
          setCurrentMarketCap(marketCapData.marketCap)
          
          // Process milestones
          const processedMilestones = milestonesData.map((milestone: any) => ({
            ...milestone,
            achieved: marketCapData.marketCap >= milestone.target
          })).sort((a: Milestone, b: Milestone) => a.target - b.target)
          
          setMilestones(processedMilestones)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching milestone data:', error)
        if (isMounted) {
          setError('Failed to load milestone data')
          setLoading(false)
        }
      }
    }
    
    fetchData()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])
  
  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-zinc-800 h-4 w-full rounded mb-2"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center">
              <div className="animate-pulse bg-zinc-800 h-8 w-8 rounded-full mr-3"></div>
              <div className="animate-pulse bg-zinc-800 h-4 w-32 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-4 bg-roast-red/10 border border-roast-red rounded-md text-roast-red">
        {error}
      </div>
    )
  }
  
  // Empty state
  if (milestones.length === 0) {
    return (
      <div className="p-4 bg-zinc-800/50 rounded-md text-center">
        No milestone data available
      </div>
    )
  }
  
  // Calculate current progress
  const progressPercentage = calculateProgress()
  
  // Find next milestone
  const nextMilestone = milestones.find(m => !m.achieved)
  
  return (
    <div className="space-y-6">
      {/* Current market cap */}
      <div className="flex justify-between items-baseline">
        <h3 className="text-lg font-semibold">Market Cap</h3>
        <div className="text-xl font-bold">{formatCurrency(currentMarketCap)}</div>
      </div>
      
      {/* Progress bar */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block text-battle-yellow">
              Progress to {nextMilestone ? nextMilestone.label : 'All milestones achieved'}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold inline-block text-battle-yellow">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-zinc-800">
          <div 
            style={{ width: `${progressPercentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-battle-yellow transition-all duration-500"
          ></div>
        </div>
      </div>
      
      {/* Milestones list */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="flex">
            <div className="mr-4 relative">
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 
                  ${milestone.achieved 
                    ? 'bg-victory-green/20 border-victory-green text-victory-green' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
              >
                {milestone.achieved ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {/* Connecting line between milestone points */}
              {index < milestones.length - 1 && (
                <div 
                  className={`absolute left-1/2 transform -translate-x-1/2 top-8 w-0.5 h-8 
                    ${milestone.achieved ? 'bg-victory-green' : 'bg-zinc-700'}`}
                ></div>
              )}
            </div>
            
            <div className={`flex-1 pb-8 ${milestone.achieved ? '' : 'opacity-60'}`}>
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold">{milestone.label}</h4>
                <div className="text-sm text-zinc-400">{formatCurrency(milestone.target)}</div>
              </div>
              <p className="text-sm mt-1">{milestone.description}</p>
              
              {milestone.benefits && milestone.benefits.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-xs text-zinc-400 mb-1">Benefits</h5>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {milestone.benefits.map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
