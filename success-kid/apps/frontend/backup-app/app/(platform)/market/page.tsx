import React from 'react';
import { DashboardHeader } from '@/components/layout';
import { PageLayout } from '@/components/layout';

/**
 * Market Page - Shows token market data and milestone tracking
 */
export default function MarketPage() {
  return (
    <PageLayout>
      <DashboardHeader 
        title="Market Data" 
        description="Track the Success Kid token and market milestones"
        action={
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Connect Wallet
          </button>
        }
      />
      
      {/* Token Price Card */}
      <div className="mt-8 border rounded-lg bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">SKC Token</h2>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold">$0.0028</span>
              <span className="text-green-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
                </svg>
                8.2%
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[100px]">
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="font-medium">$24,835</p>
            </div>
            <div className="min-w-[100px]">
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="font-medium">$280,000</p>
            </div>
            <div className="min-w-[100px]">
              <p className="text-sm text-muted-foreground">Holders</p>
              <p className="font-medium">3,542</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Market Cap Milestone Tracker */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Market Cap Milestones</h2>
        <div className="border rounded-lg bg-card p-6">
          {/* Progress Track */}
          <div className="relative">
            <div className="absolute h-2 w-full bg-muted rounded-full">
              <div 
                className="absolute h-2 bg-primary rounded-full" 
                style={{ width: '56%' }}
              />
            </div>
            
            {/* Milestone Markers */}
            <div className="flex justify-between relative pt-8">
              {[
                { value: "$100K", reached: true, date: "Apr 5, 2025" },
                { value: "$250K", reached: true, date: "May 12, 2025" },
                { value: "$500K", reached: false, date: "Target" },
                { value: "$1M", reached: false, date: "Target" },
                { value: "$5M", reached: false, date: "Target" }
              ].map((milestone, i) => (
                <div 
                  key={i} 
                  className="flex flex-col items-center"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <div 
                    className={`h-4 w-4 rounded-full ${
                      milestone.reached ? 'bg-primary' : 'bg-muted border border-primary/50'
                    } absolute top-0`}
                  />
                  <div className="pt-2 text-center">
                    <p className={`font-medium ${milestone.reached ? 'text-primary' : ''}`}>
                      {milestone.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {milestone.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Current Progress */}
          <div className="mt-10 bg-muted/50 rounded-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Current Progress</p>
                <p className="text-xl font-bold">$280,000</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Next Milestone</p>
                <p className="text-muted-foreground">
                  $220,000 to reach <span className="font-medium">$500K</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Value</th>
                  <th className="text-left p-4">Address</th>
                  <th className="text-left p-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { 
                    type: "Buy", 
                    amount: "15,000 SKC", 
                    value: "$42.00", 
                    address: "0x742...8F4c",
                    time: "10 minutes ago" 
                  },
                  { 
                    type: "Sell", 
                    amount: "5,200 SKC", 
                    value: "$14.56", 
                    address: "0x31A...9E2d",
                    time: "25 minutes ago" 
                  },
                  { 
                    type: "Buy", 
                    amount: "32,500 SKC", 
                    value: "$91.00", 
                    address: "0x91B...6A7e",
                    time: "42 minutes ago" 
                  },
                  { 
                    type: "Buy", 
                    amount: "8,700 SKC", 
                    value: "$24.36", 
                    address: "0x47D...3F2b",
                    time: "1 hour ago" 
                  },
                  { 
                    type: "Sell", 
                    amount: "12,300 SKC", 
                    value: "$34.44", 
                    address: "0x65C...1D8a",
                    time: "2 hours ago" 
                  }
                ].map((tx, i) => (
                  <tr key={i}>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tx.type === "Buy" 
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-4">{tx.amount}</td>
                    <td className="p-4">{tx.value}</td>
                    <td className="p-4">
                      <a href="#" className="text-primary hover:underline">
                        {tx.address}
                      </a>
                    </td>
                    <td className="p-4 text-muted-foreground">{tx.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
