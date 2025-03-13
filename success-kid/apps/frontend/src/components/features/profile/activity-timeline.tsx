import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui';

// Types
export interface UserActivity {
  id: string;
  type: 'post' | 'comment' | 'achievement' | 'level_up' | 'points' | 'follow';
  timestamp: string;
  details: {
    title?: string;
    description?: string;
    amount?: number;
    postId?: string;
    achievementId?: string;
    userId?: string;
    level?: number;
    previewText?: string;
    points?: number;
  };
}

interface ActivityTimelineProps {
  userId: string;
  filter?: string;
  limit?: number;
  onLoadMore?: () => void;
  className?: string;
  activities?: UserActivity[];
  isLoading?: boolean;
}

interface ActivityItemProps {
  activity: UserActivity;
  isOwn: boolean;
}

// Helper function to format relative time
function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const activityDate = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return activityDate.toLocaleDateString();
}

// Group activities by date
function groupActivitiesByDate(activities: UserActivity[]) {
  const groups: { [key: string]: UserActivity[] } = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
  });
  
  return groups;
}

// ActivityItem component for rendering individual activities
function ActivityItem({ activity, isOwn }: ActivityItemProps) {
  // Different rendering based on activity type
  const renderActivityContent = () => {
    switch (activity.type) {
      case 'post':
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {isOwn ? 'You' : 'User'} created a new post:
            </span>
            <span className="text-sm mt-1 bg-muted p-2 rounded-md">
              {activity.details.previewText || 'No preview available'}
            </span>
          </div>
        );
      
      case 'comment':
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {isOwn ? 'You' : 'User'} commented on a post:
            </span>
            <span className="text-sm mt-1 bg-muted p-2 rounded-md">
              {activity.details.previewText || 'No preview available'}
            </span>
          </div>
        );
        
      case 'achievement':
        return (
          <div className="flex items-center">
            <div className="mr-2 bg-secondary/20 p-2 rounded-full">
              🏆
            </div>
            <span className="font-medium">
              {isOwn ? 'You' : 'User'} unlocked the achievement{' '}
              <span className="text-primary font-bold">
                {activity.details.title || 'Unknown Achievement'}
              </span>
            </span>
          </div>
        );
        
      case 'level_up':
        return (
          <div className="flex items-center">
            <div className="mr-2 bg-secondary/20 p-2 rounded-full">
              ⭐
            </div>
            <span className="font-medium">
              {isOwn ? 'You' : 'User'} reached level {activity.details.level || '?'}!
            </span>
          </div>
        );
        
      case 'points':
        return (
          <div className="flex items-center">
            <div className="mr-2 bg-secondary/20 p-2 rounded-full">
              🔥
            </div>
            <span className="font-medium">
              {isOwn ? 'You' : 'User'} earned {activity.details.points} points!
            </span>
          </div>
        );
        
      case 'follow':
        return (
          <div className="flex items-center">
            <div className="mr-2 bg-secondary/20 p-2 rounded-full">
              👥
            </div>
            <span className="font-medium">
              {isOwn ? 'You' : 'User'} followed another user
            </span>
          </div>
        );
        
      default:
        return (
          <div className="flex items-center">
            <span className="font-medium">
              Unknown activity
            </span>
          </div>
        );
    }
  };
  
  return (
    <div className="flex items-start py-3 border-b border-border last:border-0">
      <div className="min-w-[40px] flex justify-center">
        <div className="bg-muted h-full w-0.5"></div>
      </div>
      
      <div className="flex-1 pl-2">
        <div className="flex justify-between items-start mb-1">
          {renderActivityContent()}
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {getRelativeTime(activity.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Empty state for when there's no activity
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <span className="text-4xl">📝</span>
      </div>
      <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
      <p className="text-muted-foreground max-w-sm">
        There's no activity to show here yet. Start engaging with the platform to see your activity here!
      </p>
    </div>
  );
}

// Main ActivityTimeline component
export function ActivityTimeline({
  userId,
  filter,
  limit = 10,
  onLoadMore,
  className,
  activities = [],
  isLoading = false,
}: ActivityTimelineProps) {
  // Mock data for development - would be replaced with actual API call
  const mockActivities: UserActivity[] = [
    {
      id: '1',
      type: 'post',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      details: {
        postId: 'post1',
        title: 'My First Post',
        previewText: 'This is my first post on the platform!'
      }
    },
    {
      id: '2',
      type: 'achievement',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      details: {
        achievementId: 'achievement1',
        title: 'First Steps'
      }
    },
    {
      id: '3',
      type: 'points',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      details: {
        points: 100
      }
    }
  ];
  
  // Use mock data for now - would be replaced with actual data
  const displayActivities = activities.length > 0 ? activities : mockActivities;
  const activityGroups = groupActivitiesByDate(displayActivities);
  
  if (isLoading) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="animate-pulse">Loading activity...</div>
      </div>
    );
  }
  
  if (displayActivities.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <div className={className}>
      {Object.entries(activityGroups).map(([date, activities]) => (
        <div key={date} className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {date === new Date().toLocaleDateString() ? 'Today' : date}
          </h3>
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            {activities.map(activity => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isOwn={true} // Assuming current user for now
              />
            ))}
          </div>
        </div>
      ))}
      
      {displayActivities.length >= limit && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={onLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
