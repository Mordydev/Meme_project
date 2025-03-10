'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TokenPriceDisplay } from '@/components/token/token-price-display'
import { getTokenMarketCap } from '@/lib/blockchain/web3'

export function TokenMetricsPreview() {
  const [marketCap, setMarketCap] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchMarketCap() {
      try {
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
    
    fetchMarketCap()
    
    return () => {
      isMounted = false
    }
  }, [])
  
  // Calculate progress to next milestone
  const currentMarketCap = marketCap || 9200000 // Fallback value if not loaded
  const nextMilestone = 10000000
  const progressPercentage = Math.min(Math.round((currentMarketCap / nextMilestone) * 100), 100)
  
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-display text-hype-white mb-6">
                $WILDNOUT Token
              </h2>
              <p className="text-zinc-300 mb-6">
                The $WILDNOUT token powers our platform, giving holders exclusive benefits, enhanced features, and a stake in our growing community.
              </p>
              <div className="bg-zinc-800 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">Current Price</span>
                  <span className="text-hype-white font-medium">
                    <TokenPriceDisplay showChange={false} />
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">Market Cap</span>
                  <span className="text-hype-white font-medium">
                    {loading ? (
                      <div className="animate-pulse bg-zinc-700 h-5 w-20 rounded"></div>
                    ) : (
                      `$${(marketCap || 0).toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400">Next Milestone</span>
                  <span className="text-hype-white font-medium">$10M</span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-battle-yellow rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Progress to $10M</span>
                    <span>{progressPercentage}%</span>
                  </div>
                </div>
              </div>
              
              <Link 
                href="/token" 
                className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-6 py-2 rounded-md inline-block transition-colors"
              >
                View Token Details
              </Link>
            </motion.div>
          </div>
          
          <div className="w-full md:w-1/2">
            <motion.div
              className="bg-zinc-800 rounded-lg p-6 h-64 flex items-center justify-center border border-zinc-700"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-center">
                <div className="text-3xl font-display text-battle-yellow mb-2">
                  Token Chart Placeholder
                </div>
                <div className="text-zinc-400">
                  Price history visualization coming soon
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
