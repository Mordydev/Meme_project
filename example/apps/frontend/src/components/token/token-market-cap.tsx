'use client'

import { useEffect, useState } from 'react'
import { getTokenMarketCap } from '@/lib/blockchain/web3'
import { formatCurrency } from '@/lib/utils'

export function TokenMarketCap() {
  const [marketCap, setMarketCap] = useState<number | null>(null)
  const [fullyDiluted, setFullyDiluted] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchMarketCap() {
      try {
        const data = await getTokenMarketCap()
        
        if (isMounted) {
          setMarketCap(data.marketCap)
          setFullyDiluted(data.fullyDiluted)
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
    
    // Refresh market cap every 5 minutes
    const interval = setInterval(fetchMarketCap, 5 * 60 * 1000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])
  
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse bg-zinc-800 h-6 w-48 rounded"></div>
        <div className="animate-pulse bg-zinc-800 h-4 w-36 rounded"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-1">
      <div className="flex flex-col">
        <span className="text-zinc-400 text-sm">Market Cap</span>
        <span className="text-xl font-semibold">{formatCurrency(marketCap || 0)}</span>
      </div>
      
      {fullyDiluted !== null && (
        <div className="flex flex-col">
          <span className="text-zinc-400 text-sm">Fully Diluted</span>
          <span>{formatCurrency(fullyDiluted)}</span>
        </div>
      )}
    </div>
  )
}
