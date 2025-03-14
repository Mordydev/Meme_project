'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardCategory, LeaderboardPeriod, LeaderboardUser } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RankingList } from './RankingList';
import { UserRankHighlight } from './UserRankHighlight';
import { TrendVisualization } from './TrendVisualization';
import { RankMilestoneAlert } from './RankMilestoneAlert';

interface CategoryMetrics {
  icon: React.ReactNode;
  description: string;
  milestones: number[];
  metricLabel: string;
  metricUnit?: string;
}

const CATEGORY_METRICS: Record<LeaderboardCategory, CategoryMetrics> = {
  points: {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    description: "Overall points earned through all platform activities.",
    milestones: [10, 50, 100],
    metricLabel: "Total Points",
    metricUnit: "pts"
  },
  achievements: {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    description: "Number of achievements unlocked and their completion rate.",
    milestones: [10, 25, 50],
    metricLabel: "Achievements",
    metricUnit: ""
  },
  content: {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 19L19 12L22 15L15 22L12 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 13L16.5 5.5L2 2L5.5 16.5L13 18L18 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 2L9.586 9.586" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 13C12.1046 13 13 12.1046 13 11C13 9.89543 12.1046 9 11 9C9.89543 9 9 9.89543 9 11C9 12.1046 9.89543 13 11 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    description: "Content creation and engagement metrics across the platform.",
    milestones: [5, 20, 50],
    metricLabel: "Content Created",
    metricUnit: ""
  },
  referrals: {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    description: "Users referred to the platform and their activity levels.",
    milestones: [3, 10, 25],
    metricLabel: "Successful Referrals",
    metricUnit: ""
  }
};

// Mock function for retrieving metrics for a specific category
const getCategorySpecificMetric = (user: LeaderboardUser, category: LeaderboardCategory) => {
  // In a real implementation, this would pull from the user's data
  // For now, we generate a mock value
  switch (category) {
    case 'achievements':
      return Math.floor(user.score / 100);
    case 'content':
      return Math.floor(user.score / 200);
    case 'referrals':
      return Math.floor(user.score / 500);
    case 'points':
    default:
      return user.score;
  }
};

interface CategorySpecificLeaderboardProps {
  activeCategory: LeaderboardCategory;
  activePeriod: LeaderboardPeriod;
  rankings: LeaderboardUser[];
  userRank?: LeaderboardUser | null;
  isLoading?: boolean;
  onUserSelect?: (userId: string) => void;
  className?: string;
}

/**
 * CategorySpecificLeaderboard
 * 
 * Component for displaying category-specific leaderboards with relevant metrics
 */
export function CategorySpecificLeaderboard({
  activeCategory,
  activePeriod,
  rankings,
  userRank,
  isLoading = false,
  onUserSelect,
  className
}: CategorySpecificLeaderboardProps) {
  // Get category-specific metrics
  const metrics = CATEGORY_METRICS[activeCategory];
  
  // Find current user's milestone status
  const getCurrentMilestone = () => {
    if (!userRank) return null;
    
    for (const milestone of metrics.milestones) {
      if (userRank.rank <= milestone) {
        return { milestone, isReached: true };
      }
    }
    
    // Find the closest milestone we haven't reached
    const closestMilestone = metrics.milestones.find(m => userRank.rank > m);
    if (closestMilestone) {
      return { milestone: closestMilestone, isReached: false };
    }
    
    return null;
  };
  
  const currentMilestone = getCurrentMilestone();
  
  // Mock historical data for trend visualization
  const mockTrendData = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Category Description */}
      <div className="flex items-start p-4 border rounded-md bg-muted/20">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4 flex-shrink-0">
          {metrics.icon}
        </div>
        <div>
          <h3 className="font-medium mb-1">
            {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Leaderboard
          </h3>
          <p className="text-sm text-muted-foreground">
            {metrics.description}
          </p>
        </div>
      </div>
      
      {/* Metric Visualizations */}
      <Tabs defaultValue="rankings" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rankings" className="space-y-6 pt-4">
          {/* User Rank Highlight (if logged in) */}
          {userRank && (
            <UserRankHighlight
              userRank={userRank}
              pointsToNextRank={userRank.rank > 1 ? rankings.find(r => r.rank === userRank.rank - 1)?.score - userRank.score : undefined}
              onViewProfile={() => onUserSelect?.(userRank.userId)}
            />
          )}
          
          {/* Category-specific Milestone Alert */}
          {currentMilestone && (
            <RankMilestoneAlert
              rank={userRank?.rank || 999}
              milestone={currentMilestone.milestone}
              isReached={currentMilestone.isReached}
            />
          )}
          
          {/* Rankings List */}
          <RankingList
            rankings={rankings.map(user => ({
              ...user,
              // For non-points categories, replace score with category-specific metric
              score: getCategorySpecificMetric(user, activeCategory)
            }))}
            currentUserId={userRank?.userId}
            isLoading={isLoading}
            onUserSelect={onUserSelect}
          />
        </TabsContent>
        
        <TabsContent value="metrics" className="pt-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Performer Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top Performer</CardTitle>
                </CardHeader>
                <CardContent>
                  {rankings.length > 0 && (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                        1
                      </div>
                      <div>
                        <div className="font-medium">{rankings[0].displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {getCategorySpecificMetric(rankings[0], activeCategory).toLocaleString()} {metrics.metricUnit}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Average Performance Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Average Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.floor(rankings.reduce((sum, user) => sum + getCategorySpecificMetric(user, activeCategory), 0) / rankings.length).toLocaleString()} {metrics.metricUnit}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Among top {rankings.length} users
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Category-specific Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Category-specific stats */}
                    {activeCategory === 'points' && (
                      <>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Content Points</div>
                          <div className="text-xl font-bold">
                            {Math.floor(userRank?.score * 0.4).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Engagement Points</div>
                          <div className="text-xl font-bold">
                            {Math.floor(userRank?.score * 0.3).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Achievement Points</div>
                          <div className="text-xl font-bold">
                            {Math.floor(userRank?.score * 0.2).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Referral Points</div>
                          <div className="text-xl font-bold">
                            {Math.floor(userRank?.score * 0.1).toLocaleString()}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {activeCategory === 'achievements' && (
                      <>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Total Unlocked</div>
                          <div className="text-xl font-bold">
                            {getCategorySpecificMetric(userRank || rankings[0], activeCategory)}
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Completion Rate</div>
                          <div className="text-xl font-bold">
                            {Math.floor(getCategorySpecificMetric(userRank || rankings[0], activeCategory) / 50 * 100)}%
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Rare Achievements</div>
                          <div className="text-xl font-bold">
                            {Math.floor(getCategorySpecificMetric(userRank || rankings[0], activeCategory) * 0.2)}
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Latest Unlock</div>
                          <div className="text-sm font-medium">
                            2 days ago
                          </div>
                        </div>
                      </>
                    )}
                    
                    {activeCategory === 'content' && (
                      <>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Posts Created</div>
                          <div className="text-xl font-bold">
                            {getCategorySpecificMetric(userRank || rankings[0], activeCategory)}
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Comments</div>
                          <div className="text-xl font-bold">
                            {Math.floor(getCategorySpecificMetric(userRank || rankings[0], activeCategory) * 2.5)}
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Engagement Rate</div>
                          <div className="text-xl font-bold">
                            {Math.floor(Math.random() * 30) + 70}%
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Top Content</div>
                          <div className="text-sm font-medium">
                            {Math.floor(Math.random() * 500) + 500} points
                          </div>
                        </div>
                      </>
                    )}
                    
                    {activeCategory === 'referrals' && (
                      <>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Total Referred</div>
                          <div className="text-xl font-bold">
                            {getCategorySpecificMetric(userRank || rankings[0], activeCategory)}
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Active Users</div>
                          <div className="text-xl font-bold">
                            {Math.floor(getCategorySpecificMetric(userRank || rankings[0], activeCategory) * 0.8)}
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Conversion Rate</div>
                          <div className="text-xl font-bold">
                            {Math.floor(Math.random() * 20) + 30}%
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="text-sm font-medium mb-1">Total Rewards</div>
                          <div className="text-xl font-bold">
                            {(getCategorySpecificMetric(userRank || rankings[0], activeCategory) * 500).toLocaleString()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="pt-4">
          <div className="space-y-6">
            {/* Time Period Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <TrendVisualization.TrendIndicator 
                    data={mockTrendData}
                    showSparkline={true}
                    size="lg"
                  />
                </div>
                
                <div className="text-sm text-muted-foreground mb-4">
                  {activeCategory === 'points' && 'Your points earning trend over time.'}
                  {activeCategory === 'achievements' && 'Your achievement unlocking pattern over time.'}
                  {activeCategory === 'content' && 'Your content creation pattern over time.'}
                  {activeCategory === 'referrals' && 'Your referral activity trend over time.'}
                </div>
                
                <TrendVisualization.RankProgress
                  current={userRank?.score || 1000}
                  target={(userRank?.rank || 10) === 1 ? userRank?.score || 1000 : (rankings.find(r => r.rank === (userRank?.rank || 10) - 1)?.score || (userRank?.score || 1000) * 1.2)}
                />
              </CardContent>
            </Card>
            
            {/* Category Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)} Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{metrics.metricLabel}</div>
                      <div className="text-3xl font-bold mt-1">
                        {getCategorySpecificMetric(userRank || rankings[0], activeCategory).toLocaleString()} {metrics.metricUnit}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="text-right mr-3">
                        <div className="text-sm font-medium">Current Rank</div>
                        <div className="text-3xl font-bold">#{userRank?.rank || rankings.length + 1}</div>
                      </div>
                      
                      {(userRank?.change || 0) !== 0 && (
                        <div className={cn(
                          "flex items-center text-sm font-medium",
                          (userRank?.change || 0) > 0 ? "text-success" : "text-red-500"
                        )}>
                          {(userRank?.change || 0) > 0 ? (
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5L12 19M12 5L19 12M12 5L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 19L12 5M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {Math.abs(userRank?.change || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
