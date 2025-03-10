'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/components/wallet/wallet-provider'
import { WalletButton } from '@/components/wallet/wallet-button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getHolderTier, MIN_HOLDER_BALANCE } from '@/lib/blockchain/web3'

export interface Benefit {
  id: string
  title: string
  description: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  icon: React.ReactNode
}

interface HolderBenefitsProps {
  userHoldings?: number
  connectedWallet?: boolean
}

export function HolderBenefits({ userHoldings, connectedWallet }: HolderBenefitsProps) {
  const { connected, balance, holderTier } = useWallet()
  const [activeTier, setActiveTier] = useState<string>('none')
  const [progressToNextTier, setProgressToNextTier] = useState<number>(0)
  const [nextTierThreshold, setNextTierThreshold] = useState<number>(0)
  
  // Define tier thresholds
  const tierThresholds = {
    none: 0,
    bronze: MIN_HOLDER_BALANCE, // 1000
    silver: 10000,
    gold: 50000,
    platinum: 250000
  }
  
  // Define benefits by tier
  const benefits: Benefit[] = [
    {
      id: 'exclusive-battles',
      title: 'Exclusive Battle Access',
      description: 'Participate in token-holder only battles with unique rewards',
      tier: 'bronze',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 'profile-badge',
      title: 'Holder Profile Badge',
      description: 'Show off your holder status with a special profile badge',
      tier: 'bronze',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      id: 'voting-power',
      title: 'Enhanced Voting Power',
      description: 'Your votes count more in platform governance',
      tier: 'silver',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'creator-spotlight',
      title: 'Creator Spotlight Eligibility',
      description: 'Get featured in the Creator Spotlight section',
      tier: 'silver',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      id: 'premium-features',
      title: 'Premium Platform Features',
      description: 'Access advanced creation tools and premium features',
      tier: 'gold',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'early-access',
      title: 'Early Feature Access',
      description: 'Be the first to try new platform features before general release',
      tier: 'gold',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'celebrity-battles',
      title: 'Celebrity Battle Invitations',
      description: 'Chance to participate in battles with Wild 'n Out cast members',
      tier: 'platinum',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      id: 'governance-rights',
      title: 'Platform Governance Rights',
      description: 'Direct influence on platform development decisions',
      tier: 'platinum',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ]
  
  // Calculate progress to next tier
  useEffect(() => {
    const userBalance = balance || 0
    const currentTier = holderTier
    let progress = 0
    let nextThreshold = 0
    
    // Calculate next tier and progress
    if (currentTier === 'none' && userBalance > 0) {
      nextThreshold = tierThresholds.bronze
      progress = (userBalance / nextThreshold) * 100
    } else if (currentTier === 'bronze') {
      nextThreshold = tierThresholds.silver
      progress = ((userBalance - tierThresholds.bronze) / (tierThresholds.silver - tierThresholds.bronze)) * 100
    } else if (currentTier === 'silver') {
      nextThreshold = tierThresholds.gold
      progress = ((userBalance - tierThresholds.silver) / (tierThresholds.gold - tierThresholds.silver)) * 100
    } else if (currentTier === 'gold') {
      nextThreshold = tierThresholds.platinum
      progress = ((userBalance - tierThresholds.gold) / (tierThresholds.platinum - tierThresholds.gold)) * 100
    } else if (currentTier === 'platinum') {
      nextThreshold = tierThresholds.platinum
      progress = 100
    }
    
    setActiveTier(currentTier)
    setProgressToNextTier(Math.min(Math.max(progress, 0), 100))
    setNextTierThreshold(nextThreshold)
  }, [balance, holderTier])
  
  const getNextTier = (currentTier: string) => {
    switch (currentTier) {
      case 'none': return 'bronze'
      case 'bronze': return 'silver'
      case 'silver': return 'gold'
      case 'gold': return 'platinum'
      case 'platinum': return 'platinum'
      default: return 'bronze'
    }
  }
  
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-700'
      case 'silver': return 'bg-zinc-300'
      case 'gold': return 'bg-amber-400'
      case 'platinum': return 'bg-purple-500'
      default: return 'bg-zinc-500'
    }
  }
  
  const getBenefitsForTier = (tier: 'bronze' | 'silver' | 'gold' | 'platinum') => {
    // For each tier, we include all benefits from that tier and below
    const tierRanking = ['bronze', 'silver', 'gold', 'platinum']
    const tierIndex = tierRanking.indexOf(tier)
    
    return benefits.filter(benefit => {
      const benefitTierIndex = tierRanking.indexOf(benefit.tier)
      return benefitTierIndex <= tierIndex
    })
  }
  
  // If not connected, show connect prompt
  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holder Benefits</CardTitle>
          <CardDescription>Connect your wallet to see available benefits</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          <div className="my-6 text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="mb-6">Connect your wallet to see your holder tier and unlock exclusive benefits.</p>
            <WalletButton />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Display current tier and benefits
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Holder Benefits</span>
          <Badge 
            className={`${
              activeTier === 'none' ? 'bg-zinc-700' : 
              activeTier === 'bronze' ? 'bg-amber-700' : 
              activeTier === 'silver' ? 'bg-zinc-300 text-zinc-900' : 
              activeTier === 'gold' ? 'bg-amber-400 text-amber-900' : 
              'bg-purple-500'
            }`}
          >
            {activeTier === 'none' ? 'Not a holder' : `${activeTier.charAt(0).toUpperCase() + activeTier.slice(1)} Tier`}
          </Badge>
        </CardTitle>
        <CardDescription>
          {activeTier === 'none' 
            ? `Hold at least ${MIN_HOLDER_BALANCE.toLocaleString()} $WILDNOUT to unlock benefits` 
            : activeTier === 'platinum'
              ? 'You have unlocked all benefits!'
              : `Unlock more benefits as you increase your holdings`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current balance */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Balance</span>
            <span>{balance?.toLocaleString() || 0} $WILDNOUT</span>
          </div>
          
          {/* Progress to next tier */}
          {activeTier !== 'platinum' && (
            <>
              <div className="flex justify-between text-sm">
                <span>Next Tier: {getNextTier(activeTier)}</span>
                <span>{nextTierThreshold.toLocaleString()} $WILDNOUT</span>
              </div>
              <Progress value={progressToNextTier} className="h-2" />
              <p className="text-xs text-zinc-400">
                {progressToNextTier < 100 
                  ? `${Math.round(progressToNextTier)}% progress to ${getNextTier(activeTier)} tier`
                  : 'Ready to advance to next tier!'
                }
              </p>
            </>
          )}
        </div>
        
        {/* Show benefits */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Your Benefits</h3>
          
          {activeTier === 'none' ? (
            <div className="bg-zinc-800/50 rounded-md p-4 text-center text-zinc-400">
              <p>Purchase at least {MIN_HOLDER_BALANCE.toLocaleString()} $WILDNOUT tokens to unlock holder benefits.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getBenefitsForTier(activeTier as 'bronze' | 'silver' | 'gold' | 'platinum').map(benefit => (
                <div key={benefit.id} className="flex">
                  <div className="text-battle-yellow mr-3">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{benefit.title}</h4>
                    <p className="text-sm text-zinc-400">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
