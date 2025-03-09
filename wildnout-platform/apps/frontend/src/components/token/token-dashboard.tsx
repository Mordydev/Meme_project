'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useWallet } from '@/components/wallet/wallet-provider'
import { TokenPriceDisplay } from './token-price-display'
import { TokenMarketCap } from './token-market-cap'
import { MilestoneTracker } from './milestone-tracker'
import { TokenTransactions } from './token-transactions'
import { TokenStats } from './token-stats'
import { HolderBenefits } from './holder-benefits'
import { WalletConnectionFlow } from '@/components/wallet/wallet-connection'

export function TokenDashboard() {
  const { connected, publicKey, balance, holderTier } = useWallet()
  const [activeTab, setActiveTab] = useState('overview')
  
  return (
    <div className="space-y-6">
      {/* Token price header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display text-hype-white">$WILDNOUT</h1>
          <div className="mt-1">
            <TokenPriceDisplay size="lg" />
          </div>
        </div>
        
        {connected ? (
          <div className="flex flex-col items-end">
            <div className="text-sm text-zinc-400">Your Balance</div>
            <div className="text-xl font-semibold">{balance?.toLocaleString() || '0'} $WILDNOUT</div>
            <div className="text-xs flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-1 
                ${holderTier === 'bronze' ? 'bg-amber-700' : 
                holderTier === 'silver' ? 'bg-zinc-300' : 
                holderTier === 'gold' ? 'bg-amber-400' : 
                holderTier === 'platinum' ? 'bg-purple-500' :
                'bg-zinc-500'}`}>
              </div>
              <span className="capitalize">{holderTier} Tier</span>
            </div>
          </div>
        ) : (
          <WalletConnectionFlow 
            triggerElement={
              <button className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-4 py-2 rounded-md transition-colors">
                Connect Wallet
              </button>
            }
          />
        )}
      </div>
      
      {/* Token tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="benefits">Holder Benefits</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Market Cap */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Market Cap</CardTitle>
                <CardDescription>Current market valuation</CardDescription>
              </CardHeader>
              <CardContent>
                <TokenMarketCap />
              </CardContent>
            </Card>
            
            {/* Next Milestone Preview */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Next Milestone</CardTitle>
                <CardDescription>Progress toward next target</CardDescription>
              </CardHeader>
              <CardContent>
                <MilestoneTracker compact />
              </CardContent>
            </Card>
            
            {/* Holder Benefits Preview */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Token Holder Benefits</CardTitle>
                <CardDescription>
                  {connected 
                    ? `Benefits for your ${holderTier} tier`
                    : 'Connect wallet to see your benefits'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto pr-1">
                  <HolderBenefits />
                </div>
              </CardContent>
            </Card>
            
            {/* Transaction Preview */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your recent activity</CardDescription>
                </div>
                {connected && (
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-sm text-battle-yellow hover:underline"
                  >
                    View All
                  </button>
                )}
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto pr-1">
                  <TokenTransactions />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Market Cap Milestones</CardTitle>
              <CardDescription>
                Track our journey to $500M+ market cap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MilestoneTracker />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="benefits">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Holder Benefits</CardTitle>
                <CardDescription>
                  {connected 
                    ? `Your benefits and rewards as a ${balance?.toLocaleString() || '0'} $WILDNOUT holder`
                    : 'Connect your wallet to see holder benefits'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HolderBenefits />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {connected 
                  ? 'Your $WILDNOUT token transactions' 
                  : 'Connect your wallet to view transactions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TokenTransactions />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
