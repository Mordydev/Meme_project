/**
 * Forum Leaderboard Component
 * 
 * Displays a leaderboard for forum activity
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Trophy, 
  MessageSquare, 
  ThumbsUp, 
  Users,
  TrendingUp
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  rank: number;
  score: number;
  posts: number;
  likes_received: number;
}

interface ForumLeaderboardProps {
  limit?: number;
}

/**
 * Forum Leaderboard Component
 */
export const ForumLeaderboard: React.FC<ForumLeaderboardProps> = ({ 
  limit = 5
}) => {
  // Fetch leaderboard data
  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['forum-leaderboard'],
    queryFn: async () => {
      // This would normally fetch from the API
      // Mock data for demonstration
      return {
        data: [
          {
            id: '1',
            display_name: 'JohnDoe',
            avatar_url: null,
            rank: 1,
            score: 1250,
            posts: 32,
            likes_received: 85
          },
          {
            id: '2',
            display_name: 'SarahSmith',
            avatar_url: null,
            rank: 2,
            score: 980,
            posts: 27,
            likes_received: 62
          },
          {
            id: '3',
            display_name: 'MikeBrown',
            avatar_url: null,
            rank: 3,
            score: 845,
            posts: 22,
            likes_received: 51
          },
          {
            id: '4',
            display_name: 'EmilyJones',
            avatar_url: null,
            rank: 4,
            score: 720,
            posts: 18,
            likes_received: 43
          },
          {
            id: '5',
            display_name: 'DavidMiller',
            avatar_url: null,
            rank: 5,
            score: 615,
            posts: 15,
            likes_received: 37
          }
        ]
      };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  const leaders = leaderboardData?.data || [];
  
  // Get badge color based on rank
  const getBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-yellow-50';
      case 2:
        return 'bg-slate-400 text-slate-50';
      case 3:
        return 'bg-amber-700 text-amber-50';
      default:
        return 'bg-accent text-accent-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy size={18} />
          Community Leaders
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="score">
          <TabsList className="mb-4">
            <TabsTrigger value="score">
              <TrendingUp size={14} className="mr-1" />
              Overall
            </TabsTrigger>
            <TabsTrigger value="posts">
              <MessageSquare size={14} className="mr-1" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="likes">
              <ThumbsUp size={14} className="mr-1" />
              Likes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="score" className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(limit)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-muted-foreground py-4">
                Unable to load leaderboard data
              </div>
            ) : (
              <div className="space-y-3">
                {leaders
                  .sort((a, b) => b.score - a.score)
                  .slice(0, limit)
                  .map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${getBadgeColor(user.rank)}`}>
                        {user.rank}
                      </div>
                      
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ''} alt={user.display_name} />
                        <AvatarFallback>{user.display_name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.posts} posts · {user.likes_received} likes
                        </div>
                      </div>
                      
                      <Badge variant="secondary">{user.score} pts</Badge>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="posts" className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(limit)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-muted-foreground py-4">
                Unable to load leaderboard data
              </div>
            ) : (
              <div className="space-y-3">
                {leaders
                  .sort((a, b) => b.posts - a.posts)
                  .slice(0, limit)
                  .map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${getBadgeColor(index + 1)}`}>
                        {index + 1}
                      </div>
                      
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ''} alt={user.display_name} />
                        <AvatarFallback>{user.display_name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.score} points
                        </div>
                      </div>
                      
                      <Badge variant="outline">
                        <MessageSquare size={12} className="mr-1" />
                        {user.posts}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="likes" className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(limit)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-muted-foreground py-4">
                Unable to load leaderboard data
              </div>
            ) : (
              <div className="space-y-3">
                {leaders
                  .sort((a, b) => b.likes_received - a.likes_received)
                  .slice(0, limit)
                  .map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${getBadgeColor(index + 1)}`}>
                        {index + 1}
                      </div>
                      
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ''} alt={user.display_name} />
                        <AvatarFallback>{user.display_name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.score} points · {user.posts} posts
                        </div>
                      </div>
                      
                      <Badge variant="outline">
                        <ThumbsUp size={12} className="mr-1" />
                        {user.likes_received}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
