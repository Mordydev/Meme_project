'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { getTokenPrice, getTokenMarketCap } from '@/lib/blockchain/web3'
import { formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface Transaction {
  id: string
  type: 'buy' | 'sell' | 'transfer'
  amount: number
  from: string
  to: string
  timestamp: Date
}

// Sample transaction data
const sampleTransactions: Transaction[] = [
  {
    id: 'tx-001',
    type: 'buy',
    amount: 15000,
    from: '0x12...3456',
    to: '0x78...9abc',
    timestamp: new Date(Date.now() - 1000 * 60 * 5)
  },
  {
    id: 'tx-002',
    type: 'transfer',
    amount: 7500,
    from: '0x78...9abc',
    to: '0xde...f012',
    timestamp: new Date(Date.now() - 1000 * 60 * 15)
  },
  {
    id: 'tx-003',
    type: 'buy',
    amount: 25000,
    from: '0x34...5678',
    to: '0x90...abcd',
    timestamp: new Date(Date.now() - 1000 * 60 * 25)
  },
  {
    id: 'tx-004',
    type: 'sell',
    amount: 10000,
    from: '0xbc...def0',
    to: '0x12...3456',
    timestamp: new Date(Date.now() - 1000 * 60 * 35)
  },
  {
    id: 'tx-005',
    type: 'buy',
    amount: 50000,
    from: '0x56...7890',
    to: '0xef...0123',
    timestamp: new Date(Date.now() - 1000 * 60 * 50)
  },
]

export function PublicTokenTracker() {
  const [price, setPrice] = useState<number | null>(null)
  const [change, setChange] = useState<number | null>(null)
  const [marketCap, setMarketCap] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions)
  
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  
  // Milestone definitions
  const milestones = [
    { target: 10000000, label: '$10M', description: 'Initial platform launch with core battle and community features' },
    { target: 50000000, label: '$50M', description: 'Enhanced creator tools, expanded battle formats, and improved token utility' },
    { target: 100000000, label: '$100M', description: 'Major marketing initiatives, celebrity partnerships, and platform expansion' },
    { target: 200000000, label: '$200M', description: 'Advanced features, ecosystem development, and strategic partnerships' },
    { target: 500000000, label: '$500M', description: 'Full platform vision realization with comprehensive ecosystem integration' },
  ]
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchTokenData() {
      try {
        const [priceData, marketCapData] = await Promise.all([
          getTokenPrice(),
          getTokenMarketCap()
        ])
        
        if (isMounted) {
          setPrice(priceData.price)
          setChange(priceData.change24h)
          setMarketCap(marketCapData.marketCap)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching token data:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchTokenData()
    
    return () => {
      isMounted = false
    }
  }, [])
  
  // Calculate active milestone and progress
  const currentMarketCap = marketCap || 9200000 // Fallback to sample value if still loading
  
  // Find the next milestone
  const activeMilestoneIndex = milestones.findIndex(m => m.target > currentMarketCap)
  const activeMilestone = activeMilestoneIndex >= 0 ? milestones[activeMilestoneIndex] : milestones[milestones.length - 1]
  const prevMilestone = activeMilestoneIndex > 0 ? milestones[activeMilestoneIndex - 1] : { target: 0, label: '$0' }
  
  // Calculate progress percentage to next milestone
  let progressPercentage = 0
  if (activeMilestoneIndex === 0) {
    progressPercentage = Math.min(Math.max((currentMarketCap / activeMilestone.target) * 100, 0), 100)
  } else {
    const range = activeMilestone.target - prevMilestone.target
    const current = currentMarketCap - prevMilestone.target
    progressPercentage = Math.min(Math.max((current / range) * 100, 0), 100)
  }
  
  // Format time ago function
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }
  
  return (
    <div className="space-y-8" ref={ref}>
      {/* Token Price Header */}
      <motion.div 
        className="bg-zinc-800 rounded-xl p-6 border border-zinc-700"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-display text-hype-white">$WILDNOUT</h2>
            <p className="text-zinc-400">Wild 'n Out Platform Token</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            {loading ? (
              <div className="h-8 bg-zinc-700 w-40 animate-pulse rounded"></div>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-hype-white mr-2">
                  {formatCurrency(price || 0)}
                </span>
                <span className={`text-lg ${change && change >= 0 ? 'text-victory-green' : 'text-roast-red'}`}>
                  {change && change >= 0 ? '↑' : '↓'} {Math.abs(change || 0).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-zinc-700/50 rounded-lg">
            <div className="text-sm text-zinc-400 mb-1">Market Cap</div>
            {loading ? (
              <div className="h-6 bg-zinc-600 w-24 animate-pulse rounded"></div>
            ) : (
              <div className="text-xl font-semibold text-hype-white">
                {formatCurrency(marketCap || 0)}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-zinc-700/50 rounded-lg">
            <div className="text-sm text-zinc-400 mb-1">24h Trading Volume</div>
            {loading ? (
              <div className="h-6 bg-zinc-600 w-24 animate-pulse rounded"></div>
            ) : (
              <div className="text-xl font-semibold text-hype-white">$1,245,678</div>
            )}
          </div>
          
          <div className="p-4 bg-zinc-700/50 rounded-lg">
            <div className="text-sm text-zinc-400 mb-1">Total Holders</div>
            {loading ? (
              <div className="h-6 bg-zinc-600 w-24 animate-pulse rounded"></div>
            ) : (
              <div className="text-xl font-semibold text-hype-white">4,278</div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Milestone Tracker */}
      <motion.div 
        className="bg-zinc-800 rounded-xl p-6 border border-zinc-700"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-xl font-display text-hype-white mb-4">Market Cap Milestones</h3>
        
        <div className="space-y-6">
          {/* Next milestone progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-400">Next Milestone</span>
              <span className="text-battle-yellow font-medium">{activeMilestone.label}</span>
            </div>
            
            <div className="space-y-1">
              <Progress value={progressPercentage} className="h-2" />
              
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{prevMilestone.label}</span>
                <span>{progressPercentage.toFixed(1)}% complete</span>
                <span>{activeMilestone.label}</span>
              </div>
            </div>
            
            <div className="p-3 bg-zinc-700/30 rounded text-sm text-zinc-300">
              {activeMilestone.description}
            </div>
          </div>
          
          {/* Milestone timeline */}
          <div className="relative pt-2">
            {/* Timeline line */}
            <div className="absolute left-3 top-1 h-full w-0.5 bg-zinc-700"></div>
            
            <div className="space-y-5">
              {milestones.map((milestone, index) => {
                const isPast = currentMarketCap >= milestone.target
                const isCurrent = index === activeMilestoneIndex
                
                return (
                  <div key={milestone.label} className="flex">
                    {/* Milestone marker */}
                    <div 
                      className={`h-6 w-6 rounded-full flex-shrink-0 z-10 flex items-center justify-center 
                        ${isPast 
                          ? 'bg-victory-green/20 border-2 border-victory-green text-victory-green' 
                          : isCurrent 
                            ? 'bg-battle-yellow/20 border-2 border-battle-yellow text-battle-yellow' 
                            : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400'
                        }`}
                    >
                      {isPast && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isCurrent && (
                        <div className="h-2 w-2 rounded-full bg-battle-yellow"></div>
                      )}
                    </div>
                    
                    {/* Milestone content */}
                    <div className="ml-4 pb-5">
                      <div className="flex justify-between items-baseline">
                        <h5 className={`font-medium ${isPast ? 'text-victory-green' : isCurrent ? 'text-battle-yellow' : 'text-zinc-400'}`}>
                          {milestone.label}
                        </h5>
                        <span className="text-sm text-zinc-400">
                          {formatCurrency(milestone.target)}
                        </span>
                      </div>
                      <p className={`text-sm ${!isPast && !isCurrent ? 'text-zinc-500' : 'text-zinc-300'}`}>
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Transaction Feed */}
      <motion.div 
        className="bg-zinc-800 rounded-xl p-6 border border-zinc-700"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-xl font-display text-hype-white mb-4">Recent Transactions</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="py-3 px-4 text-left text-zinc-400 font-medium">Type</th>
                <th className="py-3 px-4 text-left text-zinc-400 font-medium">Amount</th>
                <th className="py-3 px-4 text-left text-zinc-400 font-medium">From</th>
                <th className="py-3 px-4 text-left text-zinc-400 font-medium">To</th>
                <th className="py-3 px-4 text-left text-zinc-400 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-zinc-700/50 hover:bg-zinc-700/20">
                  <td className="py-3 px-4">
                    <span 
                      className={`inline-block px-2 py-1 rounded text-xs font-medium 
                        ${tx.type === 'buy' ? 'bg-victory-green/20 text-victory-green' : 
                          tx.type === 'sell' ? 'bg-roast-red/20 text-roast-red' : 
                          'bg-flow-blue/20 text-flow-blue'}`}
                    >
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {tx.amount.toLocaleString()} $WILDNOUT
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    {tx.from}
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    {tx.to}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-sm">
                    {formatTimeAgo(tx.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-center">
          <Link 
            href="/sign-up" 
            className="inline-flex items-center text-battle-yellow hover:text-battle-yellow/80 font-medium transition-colors"
          >
            View More Transactions
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </motion.div>
      
      {/* Registration CTA */}
      <motion.div 
        className="bg-zinc-800 rounded-xl p-6 border border-zinc-700"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-display text-hype-white mb-2">Want More Token Features?</h3>
            <p className="text-zinc-400">
              Connect your wallet, track your holdings, and access exclusive holder benefits.
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/sign-up" 
              className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-4 py-2 rounded-md whitespace-nowrap transition-colors"
            >
              Sign Up
            </Link>
            <Link 
              href="/sign-in" 
              className="bg-transparent hover:bg-hype-white/10 text-hype-white border border-hype-white font-medium px-4 py-2 rounded-md whitespace-nowrap transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
