'use client'

import { useEffect, useState } from 'react'
import { getTokenPrice } from '@/lib/blockchain/web3'
import { formatCurrency } from '@/lib/utils'

interface TokenPriceDisplayProps {
  showChange?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function TokenPriceDisplay({ showChange = true, size = 'md' }: TokenPriceDisplayProps) {
  const [price, setPrice] = useState<number | null>(null)
  const [change, setChange] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchPrice() {
      try {
        const data = await getTokenPrice()
        
        if (isMounted) {
          setPrice(data.price)
          setChange(data.change24h)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching token price:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchPrice()
    
    // Refresh price every 60 seconds
    const interval = setInterval(fetchPrice, 60000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold'
  }
  
  if (loading) {
    return (
      <div className={`animate-pulse bg-zinc-800 h-${size === 'sm' ? 4 : size === 'md' ? 5 : 6} w-24 rounded`}></div>
    )
  }
  
  return (
    <div className="flex items-center">
      <div className={sizeClasses[size]}>{formatCurrency(price || 0)}</div>
      {showChange && change !== null && (
        <div 
          className={`ml-2 ${size === 'lg' ? 'text-base' : 'text-sm'} ${change >= 0 ? 'text-victory-green' : 'text-roast-red'}`}
        >
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  )
}
