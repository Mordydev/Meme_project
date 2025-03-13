'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';

// We'll use recharts but since it's not installed, we'll mock the chart component
// In a real implementation, we would import from recharts

interface PieChartData {
  name: string;
  value: number;
}

interface BreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

interface PointsBreakdownProps {
  breakdown: BreakdownItem[];
  isLoading?: boolean;
}

// Function to get category color
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    content: '#1E88E5', // Primary blue
    engagement: '#4CAF50', // Success green
    achievements: '#FFC107', // Secondary gold
    referrals: '#9C27B0', // Purple
    default: '#757575' // Neutral medium
  };
  
  return colors[category] || colors.default;
};

// Function to get category label
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    content: 'Content Creation',
    engagement: 'Engagement',
    achievements: 'Achievements',
    referrals: 'Referrals',
    default: 'Other'
  };
  
  return labels[category] || category;
};

export default function PointsBreakdown({ 
  breakdown, 
  isLoading = false
}: PointsBreakdownProps) {
  const [chartData, setChartData] = useState<PieChartData[]>([]);
  
  useEffect(() => {
    if (breakdown && breakdown.length > 0) {
      setChartData(
        breakdown.map((item) => ({
          name: getCategoryLabel(item.category),
          value: item.amount
        }))
      );
    }
  }, [breakdown]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Points Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Placeholder for actual PieChart implementation */}
        <div className="flex justify-center mb-4">
          <div className="w-32 h-32 rounded-full border-8 border-primary-100 relative">
            <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Pie Chart
            </span>
          </div>
        </div>
        
        {/* Category Legend */}
        <div className="space-y-2 mt-4">
          {breakdown.map((item, index) => (
            <motion.div 
              key={item.category}
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: getCategoryColor(item.category) }}
                />
                <span className="text-sm">{getCategoryLabel(item.category)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">{item.amount}</span>
                <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
