'use client';

import React from 'react';
import { 
  DashboardLayout,
  SectionContainer,
  CardGrid 
} from '@/components/layout';

/**
 * Market Page - Provides market data visualization and token information
 * Demonstrates another example of the layout components
 */
export default function MarketPage() {
  return (
    <DashboardLayout
      title="Market"
      subtitle="Monitor token performance, market trends, and milestone progress"
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
        </svg>
      }
      actions={
        <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors">
          Connect Wallet
        </button>
      }
    >
      {/* Market Overview Section */}
      <SectionContainer
        title="Market Overview"
        description="Current token statistics and performance"
      >
        <CardGrid columns={{ default: 1, md: 2, lg: 4 }} gap="md">
          {/* Market Overview Cards */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-500 dark:text-gray-400">Current Price</h3>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">$0.0425</div>
            <p className="mt-1 text-sm text-green-500">+3.25% (24h)</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-500 dark:text-gray-400">Market Cap</h3>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">$425,000</div>
            <p className="mt-1 text-sm text-green-500">+5.12% (24h)</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-500 dark:text-gray-400">24h Volume</h3>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">$32,450</div>
            <p className="mt-1 text-sm text-gray-500">256 transactions</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-500 dark:text-gray-400">Holders</h3>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">1,256</div>
            <p className="mt-1 text-sm text-green-500">+12 today</p>
          </div>
        </CardGrid>
      </SectionContainer>
      
      {/* Market Milestone Tracker */}
      <SectionContainer
        title="Market Milestone Tracker"
        description="Progress toward community market cap goals"
        className="mt-8"
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="relative">
            {/* Progress bar */}
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '42.5%' }} />
            </div>
            
            {/* Milestone markers */}
            <div className="mt-8 grid grid-cols-7 gap-2">
              {['$100K', '$250K', '$500K', '$1M', '$2.5M', '$5M', '$10M'].map((milestone, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center mb-2 ${
                    index < 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index < 2 ? '✓' : (index + 1)}
                  </div>
                  <div className="text-xs font-medium text-center">{milestone}</div>
                </div>
              ))}
            </div>
            
            {/* Current progress */}
            <div className="mt-4 text-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current Progress: $425,000 / $500,000 to next milestone (85%)
              </span>
            </div>
          </div>
        </div>
      </SectionContainer>
      
      {/* Recent Transactions */}
      <SectionContainer
        title="Recent Transactions"
        description="Latest token transfers and market activity"
        className="mt-8"
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          index % 2 === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {index % 2 === 0 ? 'B' : 'S'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {index % 2 === 0 ? 'Buy' : 'Sell'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            0x1a2b...3c4d
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{(Math.random() * 1000).toFixed(0)} SKC</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">$0.0{(Math.random() * 10).toFixed(4)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {Math.floor(Math.random() * 60)} mins ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionContainer>
    </DashboardLayout>
  );
}
