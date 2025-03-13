'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';

export type ActivityType = 
  | 'post' 
  | 'comment' 
  | 'achievement' 
  | 'level_up' 
  | 'points' 
  | 'wallet_connect'
  | 'follow';

export type ActivityFilter = 'all' | ActivityType;

export interface UserActivity {
  id: string;
  type: ActivityType;
  timestamp: Date;
  details: any; // Specific data based on activity type
}

export interface ActivityTimelineProps {
  userId: string;
  filter?: ActivityFilter;
  limit?: number;
  onLoadMore?: () => void;
  className?: string;
}

/**
 * ActivityTimeline - Display chronological user activity
 * 
 * @component
 * @param userId - User identifier for fetching activity
 * @param filter - Activity type filter
 * @param limit - Maximum items to display
 * @param onLoadMore - Handler for loading more items
 * @param className - Additional CSS classes
 */
export function ActivityTimeline({
  userId,
  filter = 'all',
  limit = 10,
  onLoadMore,
  className
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>(filter);
  
  // Define activity type labels for filters
  const activityTypes: {id: ActivityFilter, label: string}[] = [
    { id: 'all', label: 'All Activity' },
    { id: 'post', label: 'Posts' },
    { id: 'comment', label: 'Comments' },
    { id: 'achievement', label: 'Achievements' },
    { id: 'points', label: 'Points' }
  ];
  
  // Group activities by date
  const groupActivitiesByDate = (activities: UserActivity[]) => {
    const groups: Record<string, UserActivity[]> = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    
    return Object.entries(groups).map(([date, activities]) => ({
      date,
      activities
    }));
  };
  
  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffMins > 0) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    }
    return 'just now';
  };
  
  // Fetch activities (simulated)
  const fetchActivities = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would be an API call
      // Simulating network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data
      const mockActivities: UserActivity[] = [
        {
          id: '1',
          type: 'post',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          details: {
            title: 'My journey with Success Kid so far',
            excerpt: 'When I first joined the platform, I wasn't sure what to expect...',
            postId: 'post_1',
          }
        },
        {
          id: '2',
          type: 'achievement',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          details: {
            achievementId: 'first_post',
            title: 'Content Creator',
            description: 'Share your first post with the community',
          }
        },
        {
          id: '3',
          type: 'points',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          details: {
            amount: 500,
            source: 'content_creation',
            description: 'Created a new post',
          }
        },
        {
          id: '4',
          type: 'comment',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          details: {
            postTitle: 'Introduction to Success Points',
            comment: 'This was really helpful, thanks for sharing!',
            postId: 'post_123',
          }
        },
        {
          id: '5',
          type: 'wallet_connect',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          details: {
            walletAddress: '0x1234...5678',
          }
        },
        {
          id: '6',
          type: 'level_up',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          details: {
            newLevel: 5,
            previousLevel: 4,
          }
        }
      ];
      
      // Filter activities if needed
      const filteredActivities = activeFilter === 'all' 
        ? mockActivities 
        : mockActivities.filter(activity => activity.type === activeFilter);
      
      setActivities(filteredActivities);
      setHasMore(filteredActivities.length >= limit);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Change filter
  const handleFilterChange = (newFilter: ActivityFilter) => {
    setActiveFilter(newFilter);
  };
  
  // Load more activities
  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
    } else {
      // Default implementation
      fetchActivities();
    }
  };
  
  // Load activities on mount and filter change
  useEffect(() => {
    fetchActivities();
  }, [activeFilter]);
  
  // Group activities by date
  const groupedActivities = groupActivitiesByDate(activities);
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Activity filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
        {activityTypes.map(type => (
          <Button
            key={type.id}
            variant={activeFilter === type.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(type.id)}
            className="whitespace-nowrap"
          >
            {type.label}
          </Button>
        ))}
      </div>
      
      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No activity found</h3>
          <p className="text-muted-foreground mt-2">
            {activeFilter === 'all' 
              ? 'There is no activity to display yet.' 
              : `No ${activeFilter} activity found. Try a different filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedActivities.map(group => (
            <div key={group.date} className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2">
                {new Date(group.date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              
              <div className="space-y-4">
                {group.activities.map(activity => (
                  <ActivityItem 
                    key={activity.id} 
                    activity={activity}
                  />
                ))}
              </div>
            </div>
          ))}
          
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ActivityItemProps {
  activity: UserActivity;
  className?: string;
}

/**
 * ActivityItem - Individual activity display
 * 
 * @component
 * @param activity - Activity data to display
 * @param className - Additional CSS classes
 */
function ActivityItem({ activity, className }: ActivityItemProps) {
  // Get icon based on activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'post':
        return '📝';
      case 'comment':
        return '💬';
      case 'achievement':
        return '🏆';
      case 'level_up':
        return '⭐';
      case 'points':
        return '🔢';
      case 'wallet_connect':
        return '💳';
      case 'follow':
        return '👤';
      default:
        return '📌';
    }
  };
  
  // Get title based on activity type
  const getActivityTitle = (activity: UserActivity) => {
    switch (activity.type) {
      case 'post':
        return `Created a post: "${activity.details.title}"`;
      case 'comment':
        return `Commented on "${activity.details.postTitle}"`;
      case 'achievement':
        return `Unlocked achievement: ${activity.details.title}`;
      case 'level_up':
        return `Leveled up to Level ${activity.details.newLevel}`;
      case 'points':
        return `Earned ${activity.details.amount} Success Points`;
      case 'wallet_connect':
        return 'Connected wallet to profile';
      case 'follow':
        return `Followed ${activity.details.userName}`;
      default:
        return 'Performed an action';
    }
  };
  
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl">
            {getActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap justify-between gap-2">
              <h4 className="font-medium text-sm md:text-base">
                {getActivityTitle(activity)}
              </h4>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(new Date(activity.timestamp))}
              </span>
            </div>
            
            {activity.type === 'post' && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {activity.details.excerpt}
              </p>
            )}
            
            {activity.type === 'comment' && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {activity.details.comment}
              </p>
            )}
            
            {activity.type === 'achievement' && (
              <p className="text-sm text-muted-foreground mt-1">
                {activity.details.description}
              </p>
            )}
            
            {activity.type === 'points' && activity.details.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {activity.details.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffMins > 0) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  }
  return 'just now';
}
