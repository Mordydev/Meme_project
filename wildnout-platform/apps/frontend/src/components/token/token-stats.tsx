'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface TokenStats {
  totalSupply: number
  circulatingSupply: number
  holders: number
  marketCap: number
  volume24h: number
  volumeChange: number
}

export function TokenStats() {
  const [stats, setStats] = useState<TokenStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/token/stats`,
          { next: { revalidate: 300 } } // Cache for 5 minutes
        )
        
        if (!response.ok) {
          throw new Error(`Failed to fetch token stats: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (isMounted) {
          setStats(data)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching token stats:', error)
        if (isMounted) {
          setError('Failed to load token statistics')
          setLoading(false)
        }
      }
    }
    
    fetchStats()
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])
  
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="animate-pulse p-4 bg-zinc-800/50 rounded-md">
            <div className="h-4 w-24 bg-zinc-700 rounded mb-2"></div>
            <div className="h-6 w-16 bg-zinc-700 rounded"></div>
          </div>
        ))}
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
  
  // No data state
  if (!stats) {
    return (
      <div className="p-4 bg-zinc-800/50 rounded-md text-center">
        No token statistics available
      </div>
    )
  }
  
  // Stats card component
  const StatCard = ({ title, value, suffix }: { title: string, value: string | number, suffix?: string }) => (
    <div className="p-4 bg-zinc-800/50 rounded-md">
      <div className="text-sm text-zinc-400 mb-1">{title}</div>
      <div className="text-lg font-semibold">
        {value}
        {suffix && <span className="text-sm text-zinc-400 ml-1">{suffix}</span>}
      </div>
    </div>
  )
  
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <StatCard 
        title="Market Cap" 
        value={formatCurrency(stats.marketCap)} 
      />
      
      <StatCard 
        title="24h Volume" 
        value={formatCurrency(stats.volume24h)}
        suffix={stats.volumeChange >= 0 
          ? `+${stats.volumeChange.toFixed(2)}%` 
          : `${stats.volumeChange.toFixed(2)}%`} 
      />
      
      <StatCard 
        title="Total Supply" 
        value={stats.totalSupply.toLocaleString()} 
        suffix="WILDNOUT"
      />
      
      <StatCard 
        title="Circulating Supply" 
        value={stats.circulatingSupply.toLocaleString()} 
        suffix="WILDNOUT"
      />
      
      <StatCard 
        title="Holders" 
        value={stats.holders.toLocaleString()} 
      />
      
      <StatCard 
        title="Holder Ratio" 
        value={(stats.holders / stats.circulatingSupply * 100).toFixed(2)} 
        suffix="%"
      />
    </div>
  )
}
