'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUp, ChevronDown, Minus, Trophy, Medal, Clock, ArrowDown } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useLeaderboardStore } from '@/store/useLeaderboardStore';
import { useAuth } from '@/hooks/useAuth';

export function LeaderboardSection() {
  const [category, setCategory] = useState('points');
  const [timeframe, setTimeframe] = useState('weekly');
  const { fetchLeaderboard, leaderboard, rankings, isLoading, error } = useLeaderboardStore();
  const { user } = useAuth();
  const userRankRef = useRef<HTMLTableRowElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // Load leaderboard data
  useEffect(() => {
    fetchLeaderboard(category, timeframe);
  }, [fetchLeaderboard, category, timeframe]);
  
  // Scroll to user's position
  useEffect(() => {
    if (userRankRef.current && !isLoading) {
      setTimeout(() => {
        userRankRef.current?.scrollIntoView({ 
          behavior: prefersReducedMotion ? 'auto' : 'smooth', 
          block: 'center' 
        });
      }, 500);
    }
  }, [isLoading, prefersReducedMotion, rankings]);
  
  // Generate mock leaderboard data
  const generateMockLeaderboardData = () => {
    if (leaderboard && leaderboard.length > 0) return leaderboard;
    
    const mockUsers = [];
    const currentUserId = user?.id || 'current-user';
    
    // Generate names
    const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'James', 'Isabella', 'Benjamin'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    // Generate 50 users
    for (let i = 1; i <= 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}`;
      
      let position = i;
      let change: number | null = null;
      
      // Previous rank changes
      if (Math.random() > 0.7) {
        change = Math.floor(Math.random() * 5) + 1;
        if (Math.random() > 0.5) {
          change = -change;
        }
      }
      
      // Make current user somewhere in the middle
      const isCurrentUser = i === 25;
      const userId = isCurrentUser ? currentUserId : `user-${i}`;
      
      mockUsers.push({
        id: userId,
        rank: position,
        username: isCurrentUser ? 'You' : username,
        displayName: isCurrentUser ? 'You' : `${firstName} ${lastName}`,
        avatarUrl: `/avatars/avatar-${i % 10 + 1}.png`,
        points: Math.floor(10000 / position) * 100 + Math.floor(Math.random() * 100),
        isCurrentUser,
        change
      });
    }
    
    return mockUsers;
  };
  
  const leaderboardData = generateMockLeaderboardData();
  
  // Get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'points':
        return 'Points';
      case 'content':
        return 'Content';
      case 'engagement':
        return 'Engagement';
      case 'referrals':
        return 'Referrals';
      default:
        return 'Points';
    }
  };
  
  // Get timeframe label
  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      case 'all-time':
        return 'All Time';
      default:
        return 'This Week';
    }
  };
  
  // Get change icon
  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-neutral-400" />;
    if (change > 0) return <ChevronUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ChevronDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-neutral-400" />;
  };
  
  // Get medal for top 3
  const getMedal = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 border border-yellow-200">
          <Trophy className="h-4 w-4" />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="w-7 h-7 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 border border-neutral-300">
          <Medal className="h-4 w-4" />
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 border border-amber-200">
          <Medal className="h-4 w-4" />
        </div>
      );
    } else {
      return (
        <div className="w-7 h-7 flex items-center justify-center text-neutral-600">
          {rank}
        </div>
      );
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Community Leaderboards</CardTitle>
              <CardDescription>See how you rank against other community members</CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Tabs 
                value={category} 
                onValueChange={setCategory}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                  <TabsTrigger value="points">Points</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="referrals">Referrals</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Tabs 
                value={timeframe} 
                onValueChange={setTimeframe}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="all-time">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Clock className="h-4 w-4" />
              <span>Updated hourly • {getTimeframeLabel(timeframe)} {getCategoryLabel(category)} Leaderboard</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                const currentUser = leaderboardData.find(user => user.isCurrentUser);
                if (currentUser && userRankRef.current) {
                  userRankRef.current.scrollIntoView({ 
                    behavior: prefersReducedMotion ? 'auto' : 'smooth', 
                    block: 'center' 
                  });
                }
              }}
              disabled={isLoading || !leaderboardData.some(user => user.isCurrentUser)}
            >
              <ArrowDown className="h-3.5 w-3.5 mr-1" />
              <span>Find Me</span>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-neutral-50 px-4 py-3 border-b">
                <div className="grid grid-cols-12 gap-2">
                  <Skeleton className="h-5 w-8 col-span-1" />
                  <Skeleton className="h-5 w-full col-span-7" />
                  <Skeleton className="h-5 w-full col-span-3" />
                  <Skeleton className="h-5 w-8 col-span-1" />
                </div>
              </div>
              
              <div className="divide-y">
                {[...Array(10)].map((_, index) => (
                  <div key={index} className="px-4 py-3">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1">
                        <Skeleton className="h-7 w-7 rounded-full" />
                      </div>
                      <div className="col-span-7">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16 mt-1" />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="col-span-1">
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              {/* Table Header */}
              <div className="bg-neutral-50 px-4 py-3 border-b">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-neutral-500">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-7">User</div>
                  <div className="col-span-3 text-right">{getCategoryLabel(category)}</div>
                  <div className="col-span-1 text-center">Δ</div>
                </div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {leaderboardData.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    ref={user.isCurrentUser ? userRankRef : null}
                    initial={{ backgroundColor: user.isCurrentUser ? "rgba(30, 136, 229, 0.1)" : "transparent" }}
                    animate={{ 
                      backgroundColor: user.isCurrentUser ? "rgba(30, 136, 229, 0.1)" : "transparent"
                    }}
                    transition={{ duration: 0.3 }}
                    className={`block px-4 py-3 transition-colors hover:bg-neutral-50
                      ${user.isCurrentUser ? 'bg-primary-50 border-l-4 border-primary' : ''}
                    `}
                  >
                    <td className="grid grid-cols-12 gap-2 items-center">
                      {/* Rank */}
                      <div className="col-span-1 flex justify-center">
                        {getMedal(user.rank)}
                      </div>
                      
                      {/* User */}
                      <div className="col-span-7">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden">
                            {/* Would use Image component in real implementation */}
                            <div className="w-full h-full bg-neutral-300"></div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.displayName}
                              {user.isCurrentUser && (
                                <span className="ml-1 text-xs bg-primary-100 text-primary px-1.5 py-0.5 rounded-full">You</span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-500">@{user.username}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Points */}
                      <div className="col-span-3 text-right font-mono font-medium">
                        {user.points.toLocaleString()} {category === 'points' ? 'SP' : ''}
                      </div>
                      
                      {/* Change */}
                      <div className="col-span-1 flex justify-center">
                        <div className="flex items-center">
                          {getChangeIcon(user.change)}
                          {user.change !== null && (
                            <span className={`text-xs font-medium ml-0.5
                              ${user.change > 0 ? 'text-green-600' : ''}
                              ${user.change < 0 ? 'text-red-600' : ''}
                            `}>
                              {Math.abs(user.change)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </div>
            </div>
          )}
          
          {/* Legend and help text */}
          <div className="mt-4 text-xs text-neutral-500 flex flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <ChevronUp className="h-3.5 w-3.5 text-green-500" />
              <span>Rank Improved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ChevronDown className="h-3.5 w-3.5 text-red-500" />
              <span>Rank Decreased</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Minus className="h-3.5 w-3.5 text-neutral-400" />
              <span>No Change</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-primary-50 border border-primary"></div>
              <span>Your Current Position</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
