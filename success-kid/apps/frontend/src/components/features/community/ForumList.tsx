/**
 * Forum List Component
 * 
 * Displays a list of all available forums with stats and description
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MessageSquare, Users, Clock, ExternalLink } from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Types
interface Forum {
  id: string;
  name: string;
  description: string;
  slug: string;
  type: string;
  status: string;
  order: number;
  icon: string;
  theme_color: string;
  stats: {
    threads: number;
    posts: number;
    activity: number;
  };
}

/**
 * Forums List Component
 */
export const ForumList: React.FC = () => {
  const router = useRouter();
  
  // Fetch forums data
  const { data: forumsData, isLoading, error } = useQuery<{ data: Forum[] }>({
    queryKey: ['forums'],
    queryFn: async () => {
      const response = await fetch('/api/v1/forum/forums');
      if (!response.ok) {
        throw new Error('Failed to fetch forums');
      }
      return response.json();
    }
  });

  const forums = forumsData?.data || [];

  // Format date for last activity
  const formatActivityDate = (timestamp: number) => {
    if (!timestamp) return 'No activity';
    
    const date = new Date(timestamp);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Community Forums</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500">
        <h3 className="font-bold">Error loading forums</h3>
        <p>Please try again later or contact support if the problem persists.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Community Forums</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forums.map((forum) => (
          <Link href={`/forum/${forum.slug}`} key={forum.id} passHref>
            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col" 
              style={{ borderTop: `4px solid ${forum.theme_color || '#1E88E5'}` }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{forum.name}</CardTitle>
                  {forum.type !== 'public' && (
                    <Badge variant="outline" className="ml-2">
                      {forum.type === 'restricted' ? 'Restricted' : 'Private'}
                    </Badge>
                  )}
                </div>
                <CardDescription>{forum.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MessageSquare size={16} className="mr-1" />
                  <span className="mr-4">{forum.stats.threads} threads</span>
                  <Users size={16} className="mr-1" />
                  <span>{forum.stats.posts} posts</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock size={16} className="mr-1" />
                  <span>Last activity: {formatActivityDate(forum.stats.activity)}</span>
                </div>
                <ExternalLink size={16} className="text-muted-foreground" />
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
