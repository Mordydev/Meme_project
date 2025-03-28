/**
 * Community Dashboard Component
 * 
 * Displays a dashboard with trending threads and community stats
 */
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Clock, 
  Activity,
  BarChart,
  ChevronRight
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Custom components
import { ForumLeaderboard } from './ForumLeaderboard';

// Types
interface Thread {
  id: string;
  title: string;
  preview: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  stats: {
    replies: number;
    participants: number;
    likes: number;
  };
  last_activity_at: string;
}

/**
 * Format date to relative time
 */
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Community Dashboard Component
 */
export const CommunityDashboard: React.FC = () => {
  // Fetch trending threads
  const { data: trendingData, isLoading: isLoadingTrending } = useQuery<{ data: Thread[] }>({
    queryKey: ['trending-threads'],
    queryFn: async () => {
      const response = await fetch('/api/v1/forum/trending-threads');
      if (!response.ok) {
        throw new Error('Failed to fetch trending threads');
      }
      return response.json();
    }
  });

  const trendingThreads = trendingData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity size={24} />
          Community Dashboard
        </h2>
        
        <Button asChild>
          <Link href="/forum">
            View All Forums
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Community Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart size={18} />
              Community Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm">Active Members</div>
                <div className="text-2xl font-bold">2,458</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm">Total Threads</div>
                <div className="text-2xl font-bold">834</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm">Posts This Week</div>
                <div className="text-2xl font-bold">1,297</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Trending Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} />
              Trending Discussions
            </CardTitle>
            <CardDescription>
              The most active conversations happening now
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingTrending ? (
              // Skeleton loading state
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            ) : trendingThreads.length === 0 ? (
              <p className="text-center text-muted-foreground py-2">
                No trending discussions yet
              </p>
            ) : (
              // Actual content
              trendingThreads.slice(0, 3).map((thread) => (
                <Link href={`/forum/thread/${thread.id}`} key={thread.id} className="block">
                  <div className="flex gap-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={thread.author.avatar_url || ''} alt={thread.author.display_name} />
                      <AvatarFallback>{thread.author.display_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h4 className="font-medium line-clamp-1">{thread.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{thread.author.display_name}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          {thread.stats.replies} replies
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatRelativeTime(thread.last_activity_at)}
                        </span>
                      </div>
                    </div>
                    
                    <ChevronRight size={16} className="text-muted-foreground self-center" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/forum">
                View All Discussions
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Add the forum leaderboard */}
      <div className="mt-8">
        <ForumLeaderboard limit={5} />
      </div>
    </div>
  );
};
