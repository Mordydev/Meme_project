'use client'

import { useState } from 'react'
import { useWallet } from '@/components/wallet/wallet-provider'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'

interface WalletConnectionFlowProps {
  triggerElement?: React.ReactNode
  onSuccess?: (publicKey: string) => void
}

export function WalletConnectionFlow({ 
  triggerElement, 
  onSuccess 
}: WalletConnectionFlowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'intro' | 'connecting' | 'success' | 'error'>('intro')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const { 
    connected, 
    connecting, 
    publicKey, 
    balance, 
    holderTier,
    isQualifiedHolder, 
    connect, 
    error: walletError 
  } = useWallet()
  
  // Handle connection
  const handleConnect = async () => {
    if (connected && publicKey) {
      // Already connected
      setStep('success')
      onSuccess?.(publicKey)
      return
    }
    
    try {
      setStep('connecting')
      setErrorMessage(null)
      await connect()
      
      // Check for connection errors
      if (walletError) {
        setErrorMessage(walletError)
        setStep('error')
        return
      }
      
      setStep('success')
      
      // Callback when successfully connected
      if (publicKey) {
        onSuccess?.(publicKey)
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setErrorMessage('Failed to connect wallet. Please try again.')
      setStep('error')
    }
  }
  
  // Reset flow state when dialog is closed
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Small delay to avoid visual glitches
      setTimeout(() => {
        setStep('intro')
        setErrorMessage(null)
      }, 200)
    }
  }
  
  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  // Get holder tier badge color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-700'
      case 'silver': return 'bg-zinc-300 text-zinc-900'
      case 'gold': return 'bg-amber-400 text-amber-900'
      case 'platinum': return 'bg-purple-500'
      default: return 'bg-zinc-500'
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Custom trigger button or default */}
      <DialogTrigger asChild>
        {triggerElement || (
          <Button variant="default" className="w-full">
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        {step === 'intro' && (
          <>
            <DialogHeader>
              <DialogTitle>Connect Your Wallet</DialogTitle>
              <DialogDescription>
                Connect your Phantom wallet to access holder benefits and view your $WILDNOUT tokens.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Why Connect?</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <span className="h-6 w-6 rounded-full flex items-center justify-center bg-victory-green/20 text-victory-green mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Verify your token holdings
                      </li>
                      <li className="flex items-center">
                        <span className="h-6 w-6 rounded-full flex items-center justify-center bg-victory-green/20 text-victory-green mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Unlock exclusive holder benefits
                      </li>
                      <li className="flex items-center">
                        <span className="h-6 w-6 rounded-full flex items-center justify-center bg-victory-green/20 text-victory-green mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        View your transaction history
                      </li>
                      <li className="flex items-center">
                        <span className="h-6 w-6 rounded-full flex items-center justify-center bg-victory-green/20 text-victory-green mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Participate in holder-only battles
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">What You'll Need</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm">
                      <p className="mb-2">To connect, you'll need:</p>
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-battle-yellow/20 text-battle-yellow mr-2">1</span>
                          Phantom wallet (browser extension or mobile app)
                        </li>
                        <li className="flex items-center">
                          <span className="h-6 w-6 rounded-full flex items-center justify-center bg-battle-yellow/20 text-battle-yellow mr-2">2</span>
                          A Solana account with $WILDNOUT tokens
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <a 
                      href="https://phantom.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-battle-yellow hover:underline"
                    >
                      Don't have Phantom yet? Download here →
                    </a>
                  </CardFooter>
                </Card>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleConnect} className="w-full">
                Connect Phantom Wallet
              </Button>
            </DialogFooter>
          </>
        )}
        
        {step === 'connecting' && (
          <>
            <DialogHeader>
              <DialogTitle>Connecting Wallet</DialogTitle>
              <DialogDescription>
                Please approve the connection request in your Phantom wallet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="animate-bounce mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-battle-yellow" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                  <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                  <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>
              </div>
              <p className="text-center mb-2">
                Please check your Phantom wallet for a connection request.
              </p>
              <p className="text-center text-sm text-zinc-400">
                A pop-up should appear. If you don't see it, check if it's behind another window.
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('intro')} disabled={connecting}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
        
        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle>Wallet Connected</DialogTitle>
              <DialogDescription>
                Your Phantom wallet has been successfully connected.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Wallet Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-zinc-400">Address</p>
                        <p className="font-mono text-sm">{publicKey ? formatAddress(publicKey) : 'Loading...'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">$WILDNOUT Balance</p>
                        <p className="font-semibold">{balance?.toLocaleString() || 'Loading...'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Holder Tier</p>
                        <div className="flex items-center">
                          <span className={`h-2.5 w-2.5 rounded-full mr-2 ${getTierColor(holderTier)}`}></span>
                          <span className="capitalize">{holderTier}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {balance && balance > 0 && (
                  <div className="bg-victory-green/20 border border-victory-green/30 rounded-md p-4 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2 text-victory-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-victory-green font-medium">
                      {isQualifiedHolder 
                        ? 'Holder benefits unlocked!'
                        : 'Wallet connected successfully!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Continue to Token Hub
              </Button>
            </DialogFooter>
          </>
        )}
        
        {step === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle>Connection Error</DialogTitle>
              <DialogDescription>
                There was a problem connecting to your wallet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <div className="bg-roast-red/20 border border-roast-red/30 rounded-md p-4 mb-4">
                <p className="text-roast-red">
                  {errorMessage || 'Failed to connect your wallet. Please try again.'}
                </p>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Troubleshooting</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center bg-battle-yellow/20 text-battle-yellow mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Make sure Phantom is installed and unlocked
                    </li>
                    <li className="flex items-start">
                      <span className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center bg-battle-yellow/20 text-battle-yellow mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Refresh the page and try connecting again
                    </li>
                    <li className="flex items-start">
                      <span className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center bg-battle-yellow/20 text-battle-yellow mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Check if your wallet has the correct network selected (Solana Mainnet)
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep('intro')} className="sm:flex-1">
                Go Back
              </Button>
              <Button onClick={handleConnect} className="sm:flex-1">
                Try Again
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
