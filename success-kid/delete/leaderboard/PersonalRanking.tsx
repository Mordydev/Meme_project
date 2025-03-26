'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Medal, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLeaderboardStore } from '@/store';
import { LeaderboardCategory, TimeFrame } from '@/types/leaderboard';
import { PositionChange } from './PositionChange';
import { formatCompactNumber, formatDate } from '@/lib/utils';
import { useReducedMotion } from '@/hooks';

// We'll create a simple chart component for the ranking history
const RankingHistoryChart: React.FC<{
  history: { date: string; rank: number; score: number }[];
  improved?: boolean;
}> = ({ history, improved = false }) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Early return if no history
  if (!history || history.length === 0) {
    return (
      <div className="flex justify-center items-center h-32 text-neutral-400">
        No ranking history available
      </div>
    );
  }
  
  // Sort history by date
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Get min and max rank to calculate the chart scale
  const minRank = Math.min(...sortedHistory.map(h => h.rank));
  const maxRank = Math.max(...sortedHistory.map(h => h.rank));
  
  // Padding for the chart
  const padding = 20;
  
  // Chart dimensions
  const chartHeight = 150;
  const chartWidth = '100%';
  
  return (
    <div className="mt-4 w-full h-32">
      <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${sortedHistory.length * 50} ${chartHeight}`}>
        {/* Y-axis labels */}
        <text x="5" y="15" fontSize="12" fill="#9CA3AF">Rank</text>
        
        {/* Draw the line */}
        <motion.path
          d={`M ${padding} ${chartHeight - padding - ((sortedHistory[0].rank - minRank) / (maxRank - minRank || 1)) * (chartHeight - 2 * padding)} ${sortedHistory.map((point, i) => {
            const x = padding + i * ((sortedHistory.length * 50 - 2 * padding) / (sortedHistory.length - 1 || 1));
            const y = chartHeight - padding - ((point.rank - minRank) / (maxRank - minRank || 1)) * (chartHeight - 2 * padding);
            return `L ${x} ${y}`;
          }).join(' ')}`}
          stroke={improved ? "#4CAF50" : "#F44336"}
          strokeWidth="2"
          fill="none"
          initial={prefersReducedMotion ? {} : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        
        {/* Draw the points */}
        {sortedHistory.map((point, i) => {
          const x = padding + i * ((sortedHistory.length * 50 - 2 * padding) / (sortedHistory.length - 1 || 1));
          const y = chartHeight - padding - ((point.rank - minRank) / (maxRank - minRank || 1)) * (chartHeight - 2 * padding);
          
          return (
            <motion.g 
              key={`point-${i}`}
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : i * 0.1, duration: 0.3 }}
            >
              <circle 
                cx={x} 
                cy={y} 
                r="4" 
                fill={improved ? "#4CAF50" : "#F44336"} 
              />
              <text 
                x={x} 
                y={y - 10} 
                fontSize="10" 
                textAnchor="middle" 
                fill="#6B7280"
              >
                {point.rank}
              </text>
              <text 
                x={x} 
                y={chartHeight - 5} 
                fontSize="8" 
                textAnchor="middle" 
                fill="#9CA3AF"
              >
                {formatDate(point.date).split(' ')[0]}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

export interface PersonalRankingProps {
  userId?: string;
  initialTimeframe?: TimeFrame;
  showGoals?: boolean;
  className?: string;
}

export const PersonalRanking: React.FC<PersonalRankingProps> = ({
  userId,
  initialTimeframe = 'monthly',
  showGoals = true,
  className,
}) => {
  const {
    rankingHistory,
    categoryBreakdown,
    isHistoryLoading,
    fetchRankingHistory,
    userRank,
  } = useLeaderboardStore();
  
  // Selected category and period
  const [category, setCategory] = React.useState<LeaderboardCategory>('points');
  const [period, setPeriod] = React.useState<TimeFrame>(initialTimeframe);
  
  // Fetch ranking history on mount
  useEffect(() => {
    fetchRankingHistory({
      category,
      period,
    });
  }, [fetchRankingHistory, category, period, userId]);
  
  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory as LeaderboardCategory);
    fetchRankingHistory({
      category: newCategory as LeaderboardCategory,
      period,
    });
  };
  
  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod as TimeFrame);
    fetchRankingHistory({
      category,
      period: newPeriod as TimeFrame,
    });
  };
  
  // Loading state
  if (isHistoryLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex justify-center items-center p-12">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-24 bg-neutral-200 rounded"></div>
            <div className="h-6 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Get the current category stats
  const categoryStats = categoryBreakdown[category];
  
  // Determine if the trend is positive
  const improved = rankingHistory.length > 1 ? 
    rankingHistory[0].rank < rankingHistory[rankingHistory.length - 1].rank : 
    false;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Your Ranking Performance</CardTitle>
        <CardDescription>
          Track your position and progress over time
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Current rank summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="text-sm font-medium text-neutral-500 mb-1">Current Rank</div>
            <div className="flex items-center">
              <span className="text-2xl font-bold mr-2">
                {userRank?.rank || '-'}
              </span>
              {userRank?.change !== undefined && (
                <PositionChange
                  currentPosition={userRank.rank}
                  previousPosition={userRank.rank + userRank.change}
                  size="md"
                />
              )}
            </div>
          </div>
          
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="text-sm font-medium text-neutral-500 mb-1">Best Rank</div>
            <div className="flex items-center">
              <span className="text-2xl font-bold mr-2">
                {categoryStats?.bestRank || '-'}
              </span>
              <span className="text-sm text-neutral-500">
                all time
              </span>
            </div>
          </div>
        </div>
        
        {/* Category selection */}
        <Tabs
          defaultValue={category}
          value={category}
          onValueChange={handleCategoryChange}
          className="mb-6"
        >
          <TabsList className="w-full">
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="comments">Engagement</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Time period selection */}
        <div className="flex justify-between mb-2">
          <div className="text-sm font-medium">Ranking History</div>
          <div className="space-x-2">
            {TIME_PERIODS.slice(1).map((timePeriod) => (
              <button
                key={timePeriod.value}
                className={`text-xs px-2 py-1 rounded ${
                  period === timePeriod.value
                    ? 'bg-primary text-white'
                    : 'text-neutral-500 hover:bg-neutral-100'
                }`}
                onClick={() => handlePeriodChange(timePeriod.value)}
              >
                {timePeriod.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Rank history chart */}
        <div className="mt-4 border rounded-lg p-4">
          {rankingHistory.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {improved ? (
                    <TrendingUp className="text-success mr-2" size={20} />
                  ) : (
                    <TrendingDown className="text-alert mr-2" size={20} />
                  )}
                  <span className="font-medium">
                    {improved ? 'Improving' : 'Declining'} Trend
                  </span>
                </div>
                <div className="text-sm text-neutral-500">
                  {formatCompactNumber(userRank?.score || 0)} points
                </div>
              </div>
              
              <RankingHistoryChart 
                history={rankingHistory} 
                improved={improved} 
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Medal className="text-neutral-300 mb-3" size={48} />
              <h3 className="text-lg font-semibold text-neutral-700">No history yet</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Start participating to see your ranking progress!
              </p>
            </div>
          )}
        </div>
        
        {/* Improvement suggestions */}
        {showGoals && (
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3">How to improve your rank:</h3>
            <ul className="space-y-2">
              <li className="flex items-start p-3 bg-neutral-50 rounded-lg">
                <div className="text-primary mr-2">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="font-medium">Create quality content</p>
                  <p className="text-sm text-neutral-500">
                    Earn up to 50 points per post with additional bonuses for engagement
                  </p>
                </div>
              </li>
              <li className="flex items-start p-3 bg-neutral-50 rounded-lg">
                <div className="text-primary mr-2">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="font-medium">Engage with the community</p>
                  <p className="text-sm text-neutral-500">
                    Each comment earns 15 points, and you also get points when others respond
                  </p>
                </div>
              </li>
              <li className="flex items-start p-3 bg-neutral-50 rounded-lg">
                <div className="text-primary mr-2">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="font-medium">Maintain a daily streak</p>
                  <p className="text-sm text-neutral-500">
                    Login bonuses increase with each consecutive day, up to 100 bonus points
                  </p>
                </div>
              </li>
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button variant="outline" className="w-full flex items-center justify-center">
          <span className="mr-1">Set Ranking Goals</span>
          <ChevronRight size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
};
