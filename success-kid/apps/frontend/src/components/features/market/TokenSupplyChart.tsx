'use client';

import { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { formatCompactNumber } from '@/lib/utils';
import { TokenAllocation } from '@/types';

interface TokenSupplyChartProps {
  totalSupply: number;
  circulatingSupply: number;
  burned: number;
  allocations: TokenAllocation[];
  isLoading?: boolean;
  className?: string;
}

export function TokenSupplyChart({
  totalSupply,
  circulatingSupply,
  burned,
  allocations,
  isLoading = false,
  className = '',
}: TokenSupplyChartProps) {
  const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null);
  
  // Format numbers
  const formattedTotal = formatCompactNumber(totalSupply);
  const formattedCirculating = formatCompactNumber(circulatingSupply);
  const circulatingPercentage = ((circulatingSupply / totalSupply) * 100).toFixed(1);
  const formattedBurned = formatCompactNumber(burned);
  const burnedPercentage = ((burned / totalSupply) * 100).toFixed(1);
  
  // Create a simplified donut chart
  const renderDonutChart = () => {
    const totalDegrees = 360;
    let currentDegree = 0;
    
    return (
      <div className="relative mx-auto h-64 w-64">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-sm font-medium text-neutral-600">Circulating</div>
          <div className="text-xl font-bold">{circulatingPercentage}%</div>
        </div>
        
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          {allocations.map((allocation, index) => {
            const percentage = allocation.percentage / 100;
            const degrees = totalDegrees * percentage;
            
            // Generate the SVG path for the arc
            const startAngle = currentDegree;
            currentDegree += degrees;
            const endAngle = currentDegree;
            
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            
            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);
            
            const largeArcFlag = degrees > 180 ? 1 : 0;
            
            const d = `
              M 50 50
              L ${x1} ${y1}
              A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
              Z
            `;
            
            const isSelected = selectedAllocation === allocation.id;
            
            return (
              <path
                key={allocation.id}
                d={d}
                fill={allocation.color}
                stroke="white"
                strokeWidth={isSelected ? 1.5 : 0.5}
                onClick={() => setSelectedAllocation(prevId => 
                  prevId === allocation.id ? null : allocation.id
                )}
                className={`
                  cursor-pointer transition-all duration-200
                  ${isSelected ? 'transform scale-105' : ''}
                `}
              />
            );
          })}
          
          {/* Inner circle for donut hole */}
          <circle cx="50" cy="50" r="20" fill="white" />
        </svg>
      </div>
    );
  };
  
  // Render allocation legend
  const renderAllocationLegend = () => {
    return (
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {allocations.map(allocation => {
          const isSelected = selectedAllocation === allocation.id;
          
          return (
            <div 
              key={allocation.id}
              className={`
                flex cursor-pointer items-center rounded-md
                border p-2 text-sm transition-all
                ${isSelected ? 'border-primary bg-primary-50' : 'border-neutral-200'}
              `}
              onClick={() => setSelectedAllocation(prevId => 
                prevId === allocation.id ? null : allocation.id
              )}
            >
              <div 
                className="mr-2 h-3 w-3 rounded-sm"
                style={{ backgroundColor: allocation.color }}
              />
              <div className="flex-1">
                <span className="font-medium">{allocation.name}</span>
                <span className="ml-1 text-neutral-500">
                  ({allocation.percentage}%)
                </span>
              </div>
              <div className="text-right font-mono">
                {formatCompactNumber(allocation.amount)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render allocation details
  const renderAllocationDetails = () => {
    if (!selectedAllocation) return null;
    
    const allocation = allocations.find(a => a.id === selectedAllocation);
    if (!allocation) return null;
    
    return (
      <div className="mt-4 rounded-md bg-neutral-50 p-4">
        <div className="mb-1 text-lg font-medium">{allocation.name}</div>
        <div className="mb-2 text-sm text-neutral-600">{allocation.description}</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-neutral-500">Total Allocation</div>
            <div className="text-lg font-bold">{formatCompactNumber(allocation.amount)}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Percentage</div>
            <div className="text-lg font-bold">{allocation.percentage}%</div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Token Supply</CardTitle>
        <CardDescription>Allocation and circulation of SKC tokens</CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="mx-auto h-64 w-64 animate-pulse rounded-full bg-neutral-100"></div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-neutral-100"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-md border border-neutral-200 p-4 text-center">
                <div className="text-sm text-neutral-500">Total Supply</div>
                <div className="text-xl font-bold">{formattedTotal}</div>
              </div>
              <div className="rounded-md border border-neutral-200 p-4 text-center">
                <div className="text-sm text-neutral-500">Circulating</div>
                <div className="text-xl font-bold">{formattedCirculating}</div>
                <div className="text-xs text-neutral-500">{circulatingPercentage}% of Total</div>
              </div>
              <div className="rounded-md border border-neutral-200 p-4 text-center">
                <div className="text-sm text-neutral-500">Burned</div>
                <div className="text-xl font-bold">{formattedBurned}</div>
                <div className="text-xs text-neutral-500">{burnedPercentage}% of Total</div>
              </div>
            </div>
            
            <div className="mt-6">
              {renderDonutChart()}
              {renderAllocationLegend()}
              {renderAllocationDetails()}
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="text-sm text-neutral-500">
        Click on segments or legend items for details
      </CardFooter>
    </Card>
  );
}
