'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

// Temporary market data
const mockMarketData = {
  currentPrice: 0.00023,
  change24h: 5.6,
  volume24h: 125000,
  marketCap: 230000,
  circulatingSupply: 3500000,
  milestoneName: '$500K',
  milestoneProgress: 46,
  transactions: [
    { type: 'buy', amount: 12500, value: 2.875, time: '5 minutes ago', address: '0x8a...3e4b' },
    { type: 'sell', amount: 5000, value: 1.15, time: '12 minutes ago', address: '0x7f...9a2c' },
    { type: 'buy', amount: 30000, value: 6.9, time: '23 minutes ago', address: '0x3d...6f1a' },
    { type: 'buy', amount: 18000, value: 4.14, time: '42 minutes ago', address: '0x2b...4e7d' },
    { type: 'sell', amount: 7500, value: 1.725, time: '1 hour ago', address: '0x9c...5b3f' },
  ]
};

export default function MarketPage() {
  const [marketData, setMarketData] = useState(mockMarketData);
  
  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Random price fluctuation between -0.5% and +0.5%
      const priceChange = mockMarketData.currentPrice * (Math.random() * 0.01 - 0.005);
      setMarketData(prev => ({
        ...prev,
        currentPrice: prev.currentPrice + priceChange,
        change24h: prev.change24h + (Math.random() * 0.2 - 0.1)
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };
  
  // Format price with proper decimal places
  const formatPrice = (price: number) => {
    return price.toFixed(8);
  };
  
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Market Overview</h1>
        <p className="text-gray-600">Track Success Kid token performance and market activity</p>
      </header>
      
      {/* Market Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Current Price</h3>
          <p className="text-2xl font-bold">${formatPrice(marketData.currentPrice)}</p>
          <span className={`text-sm font-medium ${marketData.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}% (24h)
          </span>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">24h Volume</h3>
          <p className="text-2xl font-bold">${formatNumber(marketData.volume24h)}</p>
          <span className="text-sm text-gray-500">
            {formatNumber(marketData.volume24h / marketData.currentPrice)} SKC
          </span>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Market Cap</h3>
          <p className="text-2xl font-bold">${formatNumber(marketData.marketCap)}</p>
          <span className="text-sm text-gray-500">
            {formatNumber(marketData.circulatingSupply)} SKC Circulating
          </span>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Next Milestone</h3>
          <p className="text-2xl font-bold">{marketData.milestoneName}</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${marketData.milestoneProgress}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-500 mt-1 inline-block">
            {marketData.milestoneProgress}% Complete
          </span>
        </Card>
      </div>
      
      {/* Milestone Tracker */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Market Cap Milestones</h2>
        <div className="relative pt-8">
          {/* Milestone line */}
          <div className="h-1 bg-gray-200 absolute top-0 left-0 right-0 mt-4"></div>
          
          {/* Milestone markers */}
          <div className="flex justify-between relative">
            {[
              { name: '$100K', complete: true },
              { name: '$500K', complete: false, current: true },
              { name: '$1M', complete: false },
              { name: '$5M', complete: false },
              { name: '$10M', complete: false },
              { name: '$50M', complete: false },
              { name: '$100M', complete: false }
            ].map((milestone, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 mb-2
                    ${milestone.complete ? 'bg-success text-white' : 
                      milestone.current ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {milestone.complete ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    milestone.current ? (
                      <span className="text-xs font-bold">↗</span>
                    ) : (
                      <span className="text-xs font-bold">•</span>
                    )
                  )}
                </div>
                <span className={`text-xs font-medium ${milestone.current ? 'text-primary font-bold' : 'text-gray-500'}`}>
                  {milestone.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      {/* Recent Transactions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-right">Amount (SKC)</th>
                <th className="px-4 py-2 text-right">Value (USD)</th>
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">Address</th>
              </tr>
            </thead>
            <tbody>
              {marketData.transactions.map((tx, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className={`px-4 py-3 ${tx.type === 'buy' ? 'text-green-600' : 'text-red-600'} font-medium`}>
                    {tx.type === 'buy' ? 'Buy' : 'Sell'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatNumber(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ${tx.value.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {tx.time}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-sm">
                    {tx.address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
