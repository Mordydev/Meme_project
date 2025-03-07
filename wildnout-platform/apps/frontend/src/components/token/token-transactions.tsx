'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@/components/wallet/wallet-provider'
import { getTokenTransactions } from '@/lib/blockchain/web3'
import { formatRelativeTime } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'send' | 'receive' | 'swap' | 'other'
  amount: number
  timestamp: string
  sender: string
  recipient: string
  confirmed: boolean
}

export function TokenTransactions() {
  const { connected, publicKey } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    async function fetchTransactions() {
      if (!connected || !publicKey) {
        setTransactions([])
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        
        const txData = await getTokenTransactions(publicKey)
        
        if (isMounted) {
          setTransactions(txData)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
        if (isMounted) {
          setError('Failed to load transaction history')
          setLoading(false)
        }
      }
    }
    
    fetchTransactions()
    
    // Refresh every minute
    const interval = setInterval(fetchTransactions, 60 * 1000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [connected, publicKey])
  
  // Not connected state
  if (!connected) {
    return (
      <div className="p-4 bg-zinc-800/50 rounded-md text-center">
        Connect your wallet to view transaction history
      </div>
    )
  }
  
  // Loading state
  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex p-3 border border-zinc-800 rounded-md">
            <div className="h-10 w-10 rounded-full bg-zinc-800 mr-3"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
              <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-6 bg-zinc-800 rounded"></div>
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
  
  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="p-4 bg-zinc-800/50 rounded-md text-center">
        No transactions found for this wallet
      </div>
    )
  }
  
  // Shorten wallet address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  
  // Helper function to determine if the transaction is inbound
  const isInbound = (tx: Transaction) => {
    return tx.recipient.toLowerCase() === publicKey.toLowerCase()
  }
  
  return (
    <div className="space-y-3">
      {transactions.map(tx => (
        <div 
          key={tx.id} 
          className="flex items-center p-3 border border-zinc-800 rounded-md hover:bg-zinc-800/50 transition-colors"
        >
          {/* Transaction icon */}
          <div 
            className={`h-10 w-10 rounded-full flex items-center justify-center mr-3
              ${isInbound(tx) 
                ? 'bg-victory-green/20 text-victory-green' 
                : 'bg-flow-blue/20 text-flow-blue'}`}
          >
            {isInbound(tx) ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" transform="rotate(180 10 10)" />
              </svg>
            )}
          </div>
          
          {/* Transaction details */}
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-medium">
                {isInbound(tx) ? 'Received' : 'Sent'} {tx.amount.toLocaleString()} $WILDNOUT
              </span>
              {!tx.confirmed && (
                <span className="ml-2 text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
                  Pending
                </span>
              )}
            </div>
            <div className="text-sm text-zinc-400">
              {isInbound(tx) 
                ? `From: ${shortenAddress(tx.sender)}` 
                : `To: ${shortenAddress(tx.recipient)}`}
              {' · '}
              {formatRelativeTime(new Date(tx.timestamp))}
            </div>
          </div>
          
          {/* Transaction amount */}
          <div className={`font-medium ${isInbound(tx) ? 'text-victory-green' : 'text-flow-blue'}`}>
            {isInbound(tx) ? '+' : '-'}{tx.amount.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
