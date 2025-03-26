'use client';

import React, { useRef, useEffect } from 'react';
import { PriceDataPoint } from '@/types';
import { formatCurrency } from '@/lib/format';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ChartAreaProps {
  data: PriceDataPoint[];
  onMouseMove?: (dataPoint: { price: number; timestamp: number } | null) => void;
  onMouseLeave?: () => void;
  className?: string;
}

/**
 * ChartArea Component
 * 
 * Renders the price chart visualization using Recharts.
 */
export default function ChartArea({ 
  data, 
  onMouseMove, 
  onMouseLeave,
  className 
}: ChartAreaProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Custom tooltip content - can be empty as we'll use our own tooltip component
  const CustomTooltip = () => <></>;
  
  // Handle mouse events for custom tooltip
  const handleMouseMove = (props: any) => {
    if (props.activePayload && props.activePayload[0]) {
      const dataPoint = props.activePayload[0].payload;
      onMouseMove?.(dataPoint);
    }
  };
  
  // Format date for axis ticks
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
    }).split(',')[0]; // Just get the date part, not time
  };
  
  // Calculate price domain with some padding
  const calculateDomain = () => {
    if (!data || data.length === 0) return [0, 1];
    
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1; // 10% padding
    
    return [min - padding, max + padding];
  };
  
  return (
    <div className={`w-full h-full ${className || ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="var(--border)"
            opacity={0.4}
          />
          
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatXAxis} 
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            tickMargin={10}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          
          <YAxis 
            tickFormatter={(value) => formatCurrency(value, 2)}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            domain={calculateDomain()}
            width={60}
          />
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: 'var(--primary)', strokeDasharray: '3 3' }}
          />
          
          <Area 
            type={prefersReducedMotion ? "linear" : "monotone"}
            dataKey="price"
            stroke="var(--color-primary)"
            fillOpacity={1}
            fill="url(#priceGradient)"
            animationDuration={prefersReducedMotion ? 0 : 1000}
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: "var(--color-primary)", 
              stroke: "var(--background)", 
              strokeWidth: 2 
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
