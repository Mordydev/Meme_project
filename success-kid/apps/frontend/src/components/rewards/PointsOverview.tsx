'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, Activity, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import CoinIcon from '@/components/ui/icons/CoinIcon';
import { usePointsStore } from '@/store/usePointsStore';
import { Skeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PointsOverviewProps {
  balance: number;
  dashboardData: any | null;
  isLoading: boolean;
}

export function PointsOverview({ balance, dashboardData, isLoading }: PointsOverviewProps) {
  const { fetchTrends } = usePointsStore();
  const [trends, setTrends] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    const loadTrends = async () => {
      try {
        await fetchTrends(timeframe);
        // In a real implementation, we would get trends from the store
        // For now, we'll generate mock data
        generateMockTrends(timeframe);
      } catch (error) {
        console.error('Error fetching trends:', error);
      }
    };
    
    loadTrends();
  }, [fetchTrends, timeframe]);
  
  // Generate mock trend data
  const generateMockTrends = (period: string) => {
    const mockTrendData = [];
    let numberOfPoints = 7;
    
    if (period === 'day') numberOfPoints = 24;
    if (period === 'month') numberOfPoints = 30;
    
    let total = 0;
    
    // Generate trend data
    for (let i = 0; i < numberOfPoints; i++) {
      const base = Math.floor(Math.random() * 500) + 100;
      total += base;
      
      let label = '';
      if (period === 'day') label = `${i}:00`;
      if (period === 'week') label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
      if (period === 'month') label = `Day ${i + 1}`;
      
      mockTrendData.push({
        name: label,
        points: base,
        posts: Math.floor(base * 0.4),
        comments: Math.floor(base * 0.3),
        reactions: Math.floor(base * 0.3),
      });
    }
    
    // Generate breakdown data
    const mockBreakdownData = [
      { name: 'Posts', value: Math.floor(total * 0.4), color: '#1E88E5' },
      { name: 'Comments', value: Math.floor(total * 0.3), color: '#4CAF50' },
      { name: 'Reactions', value: Math.floor(total * 0.2), color: '#FFC107' },
      { name: 'Referrals', value: Math.floor(total * 0.1), color: '#F44336' },
    ];
    
    setTrends({
      trendData: mockTrendData,
      breakdownData: mockBreakdownData,
      total
    });
  };
  
  // Calculate caps and limits
  const calculateCapsRemaining = () => {
    if (!dashboardData?.caps) return [];
    
    return Object.entries(dashboardData.caps).map(([category, cap]: [string, any]) => {
      const percentage = Math.min(100, Math.round((cap.used / cap.limit) * 100));
      const remaining = cap.limit - cap.used;
      
      return {
        category: formatCategoryName(category),
        used: cap.used,
        limit: cap.limit,
        percentage,
        remaining,
        resetsAt: new Date(cap.resetsAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });
  };
  
  const formatCategoryName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  const capsData = calculateCapsRemaining();
  
  const statsCards = [
    {
      title: 'Current Balance',
      value: balance.toLocaleString(),
      subtitle: 'Success Points',
      icon: <CoinIcon className="h-5 w-5 text-primary" />,
      color: 'bg-primary-50 text-primary-700 border-primary-200'
    },
    {
      title: 'Lifetime Earned',
      value: dashboardData?.lifetimeEarned?.toLocaleString() || '0',
      subtitle: 'Total Points',
      icon: <Activity className="h-5 w-5 text-green-600" />,
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      title: 'Daily Earned',
      value: dashboardData?.dailyEarned?.toLocaleString() || '0',
      subtitle: 'Today',
      icon: <TrendingUp className="h-5 w-5 text-secondary" />,
      color: 'bg-secondary-50 text-secondary-700 border-secondary-200'
    },
    {
      title: 'Redeemed',
      value: dashboardData?.redeemed?.toLocaleString() || '0',
      subtitle: 'For Tokens',
      icon: <ArrowUpRight className="h-5 w-5 text-red-600" />,
      color: 'bg-red-50 text-red-700 border-red-200'
    }
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-md shadow-md">
          <p className="font-medium text-neutral-900">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.name}: {item.value} points
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <motion.div 
      className="space-y-6"
      variants={prefersReducedMotion ? {} : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <motion.div 
            key={index}
            variants={prefersReducedMotion ? {} : cardVariants}
            className={`rounded-lg border ${card.color} p-4`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">{card.title}</p>
                <h3 className="text-2xl font-bold mt-1 font-mono">{isLoading ? <Skeleton className="h-8 w-24" /> : card.value}</h3>
                <p className="text-xs mt-1">{card.subtitle}</p>
              </div>
              <div className="p-2 rounded-full bg-white/50 border border-current/10">
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Points Over Time Chart */}
      <motion.div variants={prefersReducedMotion ? {} : cardVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>Points Over Time</span>
              <Tabs value={timeframe} onValueChange={(value: any) => setTimeframe(value)} className="ml-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="day" className="text-xs px-2 py-1">Day</TabsTrigger>
                  <TabsTrigger value="week" className="text-xs px-2 py-1">Week</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs px-2 py-1">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardTitle>
            <CardDescription>Track your points earning patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !trends ? (
              <div className="h-80 w-full flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trends.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#1E88E5" 
                    strokeWidth={2}
                    dot={{ fill: '#1E88E5', r: 4 }}
                    activeDot={{ r: 6, stroke: '#1E88E5', strokeWidth: 2 }}
                    isAnimationActive={!prefersReducedMotion}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="posts" 
                    stroke="#4CAF50" 
                    strokeWidth={1.5} 
                    strokeDasharray="5 5"
                    dot={{ fill: '#4CAF50', r: 3 }}
                    isAnimationActive={!prefersReducedMotion}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="comments" 
                    stroke="#FFC107" 
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ fill: '#FFC107', r: 3 }}
                    isAnimationActive={!prefersReducedMotion}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Points Sources and Daily Caps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points Breakdown */}
        <motion.div variants={prefersReducedMotion ? {} : cardVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <span>Points by Source</span>
              </CardTitle>
              <CardDescription>Breakdown of points earned by activity type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !trends ? (
                <div className="h-64 w-full flex items-center justify-center">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={trends.breakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      isAnimationActive={!prefersReducedMotion}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {trends.breakdownData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Daily Caps */}
        <motion.div variants={prefersReducedMotion ? {} : cardVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Daily Activity Limits</span>
              </CardTitle>
              <CardDescription>Track your daily earning limits by category</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !capsData.length ? (
                <div className="h-64 w-full flex items-center justify-center">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {capsData.map((cap, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{cap.category}</span>
                        <span className="text-xs text-neutral-500">{cap.used} / {cap.limit} points</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${cap.percentage}%` }}
                          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-neutral-500">
                        <span>{cap.remaining} points remaining</span>
                        <span>Resets: {cap.resetsAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Points Education Section */}
      <motion.div variants={prefersReducedMotion ? {} : cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>About Success Points</CardTitle>
            <CardDescription>Learn how the Success Kid points system works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Earning Points</h4>
                <p className="text-neutral-600 text-sm">Success Points (SP) are earned through platform participation and engagement:</p>
                <ul className="text-sm space-y-1 mt-2">
                  <li className="flex justify-between">
                    <span>• Creating a post</span>
                    <span className="font-medium">10-30 SP</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Commenting on content</span>
                    <span className="font-medium">5-10 SP</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Receiving upvotes</span>
                    <span className="font-medium">2 SP each</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Daily login streak</span>
                    <span className="font-medium">5-25 SP</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Referring new users</span>
                    <span className="font-medium">500 SP</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Redemption & Value</h4>
                <p className="text-neutral-600 text-sm">Convert your points to SKC tokens through our redemption system:</p>
                <ul className="text-sm space-y-1 mt-2">
                  <li className="flex justify-between">
                    <span>• Conversion rate</span>
                    <span className="font-medium">100 SP = 1 SKC</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Minimum redemption</span>
                    <span className="font-medium">1,000 SP (10 SKC)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Weekly redemption limit</span>
                    <span className="font-medium">10,000 SP (100 SKC)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>• Processing time</span>
                    <span className="font-medium">Weekly batches</span>
                  </li>
                  <li className="flex items-center justify-between text-primary">
                    <span>• Learn more</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
