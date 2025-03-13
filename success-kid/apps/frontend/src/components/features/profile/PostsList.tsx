'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  createdAt: Date;
  engagement: {
    likes: number;
    comments: number;
  };
}

export interface PostsListProps {
  userId: string;
  className?: string;
}

/**
 * PostsList - Display user's posts
 * 
 * @component
 * @param userId - User identifier for fetching posts
 * @param className - Additional CSS classes
 */
export function PostsList({
  userId,
  className
}: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  
  // Fetch posts (simulated)
  const fetchPosts = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would be an API call
      // Simulating network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data
      const mockPosts: Post[] = [
        {
          id: 'post_1',
          title: "My journey with Success Kid so far",
          excerpt: "When I first joined the platform, I wasn't sure what to expect. The crypto world can be intimidating, but the community here has been incredibly welcoming and supportive.",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          engagement: { likes: 32, comments: 8 },
        },
        {
          id: 'post_2',
          title: "Tips for new community members",
          excerpt: "Here are my top 5 tips for making the most of your first month on Success Kid. First, complete your profile. Second, engage with others' content...",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          engagement: { likes: 47, comments: 15 },
        },
        {
          id: 'post_3',
          title: "How I earned my first 1,000 points",
          excerpt: "I wanted to share the strategy I used to earn my first 1,000 Success Points. Consistent engagement and creating quality content were key factors in my journey.",
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          engagement: { likes: 28, comments: 6 },
        },
        {
          id: 'post_4',
          title: "The future of decentralized communities",
          excerpt: "Decentralized communities like ours represent the future of online interaction. By combining social features with blockchain technology, we're creating something truly innovative.",
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
          engagement: { likes: 52, comments: 12 },
        }
      ];
      
      setPosts(mockPosts);
      setHasMore(mockPosts.length >= 10); // Simulating pagination
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format relative time (e.g., "2 days ago")
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
  
  // Load more posts
  const handleLoadMore = () => {
    // In a real implementation, this would load the next page of posts
    console.log('Load more posts');
  };
  
  // Load posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Posts</h2>
      </div>
      
      {/* Posts list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No posts yet</h3>
          <p className="text-muted-foreground mt-2">
            This user hasn't created any posts yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
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

interface PostCardProps {
  post: Post;
  className?: string;
}

/**
 * PostCard - Individual post display
 * 
 * @component
 * @param post - Post data
 * @param className - Additional CSS classes
 */
function PostCard({ post, className }: PostCardProps) {
  return (
    <Link href={`/community/post/${post.id}`}>
      <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
        <CardContent className="p-4">
          <h3 className="font-medium text-lg">{post.title}</h3>
          <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
          <div className="mt-4 flex justify-between">
            <div className="flex space-x-4 text-sm text-muted-foreground">
              <span>{post.engagement.likes} likes</span>
              <span>{post.engagement.comments} comments</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
