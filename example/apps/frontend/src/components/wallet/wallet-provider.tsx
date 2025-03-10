'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { ConnectionProvider, WalletProvider, useWallet as useWalletAdapter } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { getTokenBalance, getHolderTier, isQualifiedHolder } from '@/lib/blockchain/web3'

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

// Default to devnet or mainnet-beta depending on environment
const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet')

// Set up wallet adapters
const wallets = [
  new PhantomWalletAdapter()
]

// Create a context for simplifying access to wallet
type HolderTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'

type WalletContextType = {
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  publicKey: string | null
  balance: number | null
  holderTier: HolderTier
  isQualifiedHolder: boolean
  loading: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  refreshBalance: () => Promise<void>
}

const defaultContext: WalletContextType = {
  connected: false,
  connecting: false,
  disconnecting: false,
  publicKey: null,
  balance: null,
  holderTier: 'none',
  isQualifiedHolder: false,
  loading: false,
  error: null,
  connect: async () => {},
  disconnect: async () => {},
  refreshBalance: async () => {}
}

const WalletContext = createContext<WalletContextType>(defaultContext)

export function useWallet() {
  return useContext(WalletContext)
}

// Wallet content provider that uses wallet adapter internally
function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const { 
    connected, 
    connecting,
    disconnecting,
    publicKey, 
    select, 
    connect: adapterConnect, 
    disconnect: adapterDisconnect
  } = useWalletAdapter()
  
  const [balance, setBalance] = useState<number | null>(null)
  const [holderTier, setHolderTier] = useState<HolderTier>('none')
  const [isHolder, setIsHolder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Connect to wallet
  const connect = useCallback(async () => {
    try {
      setError(null)
      // Select Phantom wallet
      select('phantom')
      // Connect using adapter
      await adapterConnect()
    } catch (e) {
      console.error('Failed to connect wallet:', e)
      setError('Failed to connect wallet. Please try again.')
    }
  }, [select, adapterConnect])
  
  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      setError(null)
      await adapterDisconnect()
      // Reset state
      setBalance(null)
      setHolderTier('none')
      setIsHolder(false)
    } catch (e) {
      console.error('Failed to disconnect wallet:', e)
      setError('Failed to disconnect wallet. Please try again.')
    }
  }, [adapterDisconnect])
  
  // Refresh token balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null)
      setHolderTier('none')
      setIsHolder(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Get token balance
      const walletPublicKey = publicKey.toString()
      const tokenBalance = await getTokenBalance(walletPublicKey)
      
      // Update state
      setBalance(tokenBalance)
      setHolderTier(getHolderTier(tokenBalance))
      setIsHolder(await isQualifiedHolder(walletPublicKey))
    } catch (e) {
      console.error('Error fetching token balance:', e)
      setError('Failed to fetch token balance')
    } finally {
      setLoading(false)
    }
  }, [publicKey])
  
  // Fetch balance when connected
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance()
    }
  }, [connected, publicKey, refreshBalance])
  
  // Build context value
  const contextValue: WalletContextType = {
    connected,
    connecting,
    disconnecting,
    publicKey: publicKey?.toString() || null,
    balance,
    holderTier,
    isQualifiedHolder: isHolder,
    loading,
    error,
    connect,
    disconnect,
    refreshBalance
  }
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

// Root wallet provider component
export function WalletConnectionProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

// Re-export WalletMultiButton for convenience
export { WalletMultiButton }
