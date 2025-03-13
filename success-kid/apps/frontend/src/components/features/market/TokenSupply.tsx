'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useMarketData } from '@/components/providers/market';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useSupplyData, TokenAllocation } from '@/hooks/useMarketData';

interface TokenSupplyProps {
  className?: string;
}

export default function TokenSupply({ className = '' }: TokenSupplyProps) {
  const { data, isLoading, error } = useSupplyData();
  const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null);
  const { formatNumber, formatPercentage } = useMarketData();
  
  // Format large numbers with commas and abbreviations as needed
  const formatTokenAmount = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };
  
  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {formatTokenAmount(data.amount)} SKC ({data.percentage}%)
          </p>
          <p className="text-xs mt-1">{data.description}</p>
        </div>
      );
    }
    return null;
  };
  
  // Render the allocation details
  const renderAllocationDetails = (allocation: TokenAllocation) => {
    return (
      <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="font-semibold text-lg">{allocation.name}</h3>
        <div className="mt-2 space-y-2">
          <p><span className="text-gray-500">Amount:</span> {new Intl.NumberFormat('en-US').format(allocation.amount)} SKC</p>
          <p><span className="text-gray-500">Percentage:</span> {allocation.percentage}%</p>
          <p><span className="text-gray-500">Description:</span> {allocation.description}</p>
        </div>
      </div>
    );
  };
  
  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error loading supply data. Please try again later.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-4">Token Supply Distribution</h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : data?.data ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="flex flex-col space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Total Supply</h3>
                  <p className="text-2xl font-bold">
                    {formatTokenAmount(data.data.totalSupply)} SKC
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Circulating Supply</h3>
                  <p className="text-2xl font-bold">
                    {formatTokenAmount(data.data.circulatingSupply)} SKC
                  </p>
                  <p className="text-sm text-gray-500">
                    {Math.round((data.data.circulatingSupply / data.data.totalSupply) * 100)}% of Total Supply
                  </p>
                </div>
                
                {data.data.burned > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500">Burned Tokens</h3>
                    <p className="text-2xl font-bold">
                      {formatTokenAmount(data.data.burned)} SKC
                    </p>
                    <p className="text-sm text-gray-500">
                      {((data.data.burned / data.data.totalSupply) * 100).toFixed(2)}% of Total Supply
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="flex flex-col h-full">
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.data.allocations}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        nameKey="name"
                        onClick={(entry) => setSelectedAllocation(entry.id)}
                      >
                        {data.data.allocations.map((entry) => (
                          <Cell 
                            key={entry.id} 
                            fill={entry.color}
                            stroke={entry.id === selectedAllocation ? '#fff' : 'none'}
                            strokeWidth={entry.id === selectedAllocation ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {selectedAllocation && (
                  renderAllocationDetails(
                    data.data.allocations.find(a => a.id === selectedAllocation) || data.data.allocations[0]
                  )
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-right">
            Last updated: {format(new Date(data.data.lastUpdated), 'PPp')}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p>No supply data available</p>
        </div>
      )}
    </Card>
  );
}

function format(date: Date, format: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}
