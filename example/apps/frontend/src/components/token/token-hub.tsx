'use client'

import { useState } from 'react'
import { TokenPriceDisplay } from './token-price-display'
import { TokenMarketCap } from './token-market-cap'
import { TokenMilestoneTracker } from './token-milestone-tracker'
import { TokenTransactions } from './token-transactions'
import { TokenStats } from './token-stats'
import { useWallet } from '@/components/wallet/wallet-provider'
import { WalletButton } from '@/components/wallet/wallet-button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function TokenHub() {
  const { connected } = useWallet()
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
        
        <WalletButton />
      </div>
      
      {/* Token tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Market Cap */}
            <Card>
              <CardHeader>
                <CardTitle>Market Cap</CardTitle>
                <CardDescription>Current market valuation</CardDescription>
              </CardHeader>
              <CardContent>
                <TokenMarketCap />
              </CardContent>
            </Card>
            
            {/* Next Milestone Preview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Next Milestone</CardTitle>
                <CardDescription>Progress toward next target</CardDescription>
              </CardHeader>
              <CardContent>
                <TokenMilestoneTracker />
              </CardContent>
            </Card>
            
            {/* Transaction Preview */}
            <Card className="md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your recent $WILDNOUT activity</CardDescription>
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
                <TokenTransactions />
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
              <TokenMilestoneTracker />
            </CardContent>
          </Card>
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
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Token Statistics</CardTitle>
              <CardDescription>
                Key metrics and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TokenStats />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
