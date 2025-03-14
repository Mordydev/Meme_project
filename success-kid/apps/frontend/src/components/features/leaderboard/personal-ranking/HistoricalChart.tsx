'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardPeriod } from '@/types';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface RankHistoryPoint {
  date: string;
  rank: number;
  score: number;
}

interface HistoricalChartProps {
  rankingHistory: RankHistoryPoint[];
  timeframe: LeaderboardPeriod;
  compareUsers?: string[];
  className?: string;
}

/**
 * HistoricalChart
 * 
 * Component to visualize ranking history over time
 */
export function HistoricalChart({ 
  rankingHistory, 
  timeframe,
  compareUsers = [],
  className 
}: HistoricalChartProps) {
  const [showScore, setShowScore] = useState<boolean>(false);
  
  // Format date based on timeframe
  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    
    switch (timeframe) {
      case 'weekly':
        return format(dateObj, 'EEE'); // Day name (Mon, Tue, etc.)
      case 'monthly':
        return format(dateObj, 'MMM d'); // Month + day (Jan 1)
      case 'all-time':
        return format(dateObj, 'MMM yyyy'); // Month + year (Jan 2023)
      default:
        return format(dateObj, 'MMM d');
    }
  };
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return rankingHistory.map(point => ({
      ...point,
      formattedDate: formatDate(point.date)
    }));
  }, [rankingHistory, timeframe]);
  
  // Find best and worst rank
  const bestRank = useMemo(() => {
    return Math.min(...rankingHistory.map(point => point.rank));
  }, [rankingHistory]);
  
  const worstRank = useMemo(() => {
    return Math.max(...rankingHistory.map(point => point.rank));
  }, [rankingHistory]);
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-md shadow-sm text-sm">
          <p className="font-semibold">{label}</p>
          <p className="text-primary">Rank: {payload[0].value}</p>
          <p className="text-muted-foreground">Score: {payload[1].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={cn("", className)}>
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            className={cn(
              "px-3 py-1 text-xs font-medium border rounded-l-md",
              !showScore ? "bg-primary text-primary-foreground" : "bg-background"
            )}
            onClick={() => setShowScore(false)}
          >
            Rank
          </button>
          <button
            className={cn(
              "px-3 py-1 text-xs font-medium border rounded-r-md border-l-0",
              showScore ? "bg-primary text-primary-foreground" : "bg-background"
            )}
            onClick={() => setShowScore(true)}
          >
            Score
          </button>
        </div>
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              yAxisId="rank"
              orientation="left"
              domain={[1, Math.max(worstRank + 2, 20)]} // Start from 1, add padding to worst rank
              reversed // Higher rank is lower number, so reverse the axis
              hide={showScore}
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              yAxisId="score"
              orientation="right"
              domain={['auto', 'auto']}
              hide={!showScore}
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Rank Line */}
            <Line
              yAxisId="rank"
              type="monotone"
              dataKey="rank"
              stroke="#1E88E5" // Primary color
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              hide={showScore}
            />
            
            {/* Score Line */}
            <Line
              yAxisId="score"
              type="monotone"
              dataKey="score"
              stroke="#4CAF50" // Success color
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              hide={!showScore}
            />
            
            {/* Best Rank Reference Line */}
            {!showScore && (
              <ReferenceLine 
                y={bestRank} 
                yAxisId="rank" 
                stroke="#4CAF50" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `Best: ${bestRank}`, 
                  position: 'left',
                  fill: '#4CAF50',
                  fontSize: 12
                }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
