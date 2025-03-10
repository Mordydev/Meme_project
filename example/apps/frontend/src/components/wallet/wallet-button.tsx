'use client'

import React, { useState } from 'react'
import { useWallet } from './wallet-provider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function WalletButton() {
  const { connected, connecting, publicKey, balance, holderTier, connect, disconnect } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  
  const renderWalletStatus = () => {
    if (connecting) {
      return (
        <Button variant="outline" disabled>
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting
          </div>
        </Button>
      )
    }
    
    if (connected && publicKey) {
      return (
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(true)}
          className="flex items-center"
        >
          <div className="w-2 h-2 rounded-full bg-victory-green mr-2"></div>
          {shortenAddress(publicKey)}
        </Button>
      )
    }
    
    return (
      <Button onClick={connect}>
        Connect Wallet
      </Button>
    )
  }
  
  return (
    <>
      {renderWalletStatus()}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Wallet Connected</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-zinc-400">Wallet Address</p>
              <p className="font-mono text-hype-white break-all">{publicKey}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-zinc-400">$WILDNOUT Balance</p>
              <p className="text-xl font-semibold text-hype-white">
                {balance?.toLocaleString() || 'Loading...'}
              </p>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-zinc-400">Holder Tier</p>
              <div className="flex items-center">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${
                    holderTier === 'none' ? 'bg-zinc-500' :
                    holderTier === 'bronze' ? 'bg-amber-700' :
                    holderTier === 'silver' ? 'bg-zinc-300' :
                    holderTier === 'gold' ? 'bg-amber-400' :
                    'bg-purple-500'
                  }`}
                ></div>
                <p className="capitalize">{holderTier}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                disconnect()
                setIsOpen(false)
              }}
            >
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
