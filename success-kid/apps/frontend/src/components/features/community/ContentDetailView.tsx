'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '@/types/community';
import { 
  Card, 
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowUp, 
  ArrowDown, 
  Share2, 
  MessageSquare, 
  ExternalLink, 
  Flag, 
  BookmarkPlus,
  BookmarkCheck,
  ChevronLeft
} from 'lucide-react';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

interface ContentDetailViewProps {
  post: Post;
  isLoading?: boolean;
  className?: string;
  onVote?: (postId: string, direction: 'up' | 'down') => void;
  onBack?: () => void;
}

export function ContentDetailView({ 
  post, 
  isLoading = false,
  className,
  onVote,
  onBack
}: ContentDetailViewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { getCategoryById } = useCategories();
  const [bookmarked, setBookmarked] = useState(false);
  const [commentSort, setCommentSort] = useState<'top' | 'new' | 'controversial'>('top');
  
  const category = post?.categoryId ? getCategoryById(post.categoryId) : null;
  
  // Format the creation date using date-fns
  const formattedDate = post ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : '';
  
  // Handle content vote
  const handleVote = (direction: 'up' | 'down') => {
    if (!post || !onVote) return;
    
    onVote(post.id, direction);
    
    // Show points earned toast
    if (direction === 'up') {
      toast({
        title: "Points earned!",
        description: "You earned 5 Success Points for upvoting content",
        duration: 3000,
      });
    }
  };
  
  // Handle sharing
  const handleShare = () => {
    if (!post) return;
    
    navigator.clipboard.writeText(window.location.origin + `/community/post/${post.id}`);
    
    toast({
      title: "Link copied",
      description: "Post link copied to clipboard",
      duration: 3000,
    });
  };
  
  // Handle bookmark
  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    
    toast({
      title: bookmarked ? "Bookmark removed" : "Bookmark added",
      description: bookmarked 
        ? "Post removed from your bookmarks" 
        : "Post saved to your bookmarks",
      duration: 3000,
    });
    
    if (!bookmarked) {
      toast({
        title: "Points earned!",
        description: "You earned 3 Success Points for saving content",
        duration: 3000,
      });
    }
  };
  
  // Handle report
  const handleReport = () => {
    router.push(`/community/post/${post?.id}/report`);
  };
  
  // Handle comment submission
  const handleCommentSubmit = (content: string) => {
    // In a real implementation, this would submit the comment to the API
    console.log(`Submitting comment: ${content}`);
    
    toast({
      title: "Comment posted",
      description: "Your comment has been posted",
      duration: 3000,
    });
    
    toast({
      title: "Points earned!",
      description: "You earned 10 Success Points for commenting",
      duration: 3000,
    });
  };
  
  // Handle going back
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/community');
    }
  };
  
  if (isLoading) {
    return <ContentDetailSkeleton />;
  }
  
  if (!post) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-500 mb-2">Post not found</div>
        <p className="text-muted-foreground mb-4">
          The post you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={handleBack}>Go back to Community</Button>
      </Card>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Back button */}
      <Button
        variant="ghost"
        className="gap-1.5 mb-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={handleBack}
      >
        <ChevronLeft size={16} />
        Back to Community
      </Button>
      
      <Card>
        <CardContent className="p-6">
          {/* Post Header */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            {/* Category */}
            {category && (
              <Link 
                href={`/community/category/${category.id}`} 
                className="font-medium text-primary hover:underline"
              >
                {category.name}
              </Link>
            )}
            
            <span>•</span>
            
            {/* Author */}
            <Link 
              href={`/profile/${post.author.username}`} 
              className="flex items-center gap-1.5 hover:underline"
            >
              {post.author.avatarUrl ? (
                <Image 
                  src={post.author.avatarUrl} 
                  alt={post.author.username} 
                  width={20} 
                  height={20} 
                  className="rounded-full"
                  loading="eager"
                  priority
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                  {post.author.username[0].toUpperCase()}
                </div>
              )}
              <span>{post.author.username}</span>
            </Link>
            
            <span>•</span>
            
            {/* Date */}
            <span>{formattedDate}</span>
          </div>
          
          {/* Post Title */}
          <h1 className="text-2xl font-semibold mb-4">{post.title}</h1>
          
          {/* Post Content */}
          <div className="mb-6">
            {post.type === 'text' && post.content && (
              <div className="prose max-w-none">
                <p>{post.content}</p>
              </div>
            )}
            
            {post.type === 'image' && post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="rounded-lg overflow-hidden bg-muted mb-4">
                <Image 
                  src={post.mediaUrls[0]} 
                  alt={post.title}
                  width={800}
                  height={600}
                  className="object-contain max-h-[500px] w-full"
                  loading="eager"
                  priority
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                />
              </div>
            )}
            
            {post.type === 'link' && post.preview && (
              <div className="border rounded-lg p-4 mb-4">
                <div className="flex items-center text-primary mb-2">
                  <ExternalLink size={16} className="mr-2" />
                  <a 
                    href={post.preview} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline text-primary break-all"
                  >
                    {post.preview}
                  </a>
                </div>
                {post.content && (
                  <p className="mt-2 text-muted-foreground">{post.content}</p>
                )}
              </div>
            )}
            
            {post.type === 'poll' && post.content && (
              <div className="space-y-3 mb-4">
                {/* Mock poll options - in a real impl this would be actual poll data */}
                {['Option 1', 'Option 2', 'Option 3'].map((option, idx) => {
                  const percentage = [58, 32, 10][idx];
                  return (
                    <div key={idx} className="relative">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{option}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="bg-muted rounded-md h-10 overflow-hidden relative">
                        <div 
                          className="absolute left-0 top-0 h-full bg-primary/20"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute left-0 top-0 h-full w-full flex items-center px-3">
                          <span>{option}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {post.content && (
                  <p className="mt-4 text-muted-foreground">{post.content}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Engagement Bar */}
          <div className="flex flex-wrap items-center gap-2 justify-between border-t pt-4">
            <div className="flex gap-2">
              {/* Vote Buttons */}
              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 rounded-r-none border-r",
                    post.userVote === 'up' && "bg-primary/10 text-primary"
                  )}
                  onClick={() => handleVote('up')}
                >
                  <ArrowUp size={18} />
                  <span className="sr-only">Upvote</span>
                </Button>
                <span className="px-2 min-w-10 text-center">{post.voteCount}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 rounded-l-none border-l",
                    post.userVote === 'down' && "bg-destructive/10 text-destructive"
                  )}
                  onClick={() => handleVote('down')}
                >
                  <ArrowDown size={18} />
                  <span className="sr-only">Downvote</span>
                </Button>
              </div>
              
              {/* Comment Count */}
              <Button
                variant="outline"
                size="sm"
                className="flex gap-1.5 h-9"
                onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <MessageSquare size={16} />
                {post.commentCount} Comments
              </Button>
            </div>
            
            <div className="flex gap-2">
              {/* Bookmark Button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9"
                onClick={handleBookmark}
              >
                {bookmarked ? (
                  <>
                    <BookmarkCheck size={16} className="text-primary" />
                    <span className="hidden sm:inline">Saved</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus size={16} />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </Button>
              
              {/* Share Button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9"
                onClick={handleShare}
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Share</span>
              </Button>
              
              {/* Report Button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9"
                onClick={handleReport}
              >
                <Flag size={16} />
                <span className="hidden sm:inline">Report</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Comments Section */}
      <div id="comments-section">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Comments ({post.commentCount})</h2>
              
              <Tabs 
                defaultValue={commentSort} 
                onValueChange={(value) => setCommentSort(value as 'top' | 'new' | 'controversial')}
              >
                <TabsList>
                  <TabsTrigger value="top">Top</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="controversial">Controversial</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Comment Form */}
            <CommentForm onSubmit={handleCommentSubmit} className="mb-6" />
            
            {/* Comments List */}
            <CommentList 
              postId={post.id} 
              comments={[]} // This would be populated in a real implementation
              sortBy={commentSort}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ContentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="gap-1.5 mb-2 -ml-2 opacity-50"
        disabled
      >
        <ChevronLeft size={16} />
        Back to Community
      </Button>
      
      <Card>
        <CardContent className="p-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          
          {/* Title Skeleton */}
          <Skeleton className="h-8 w-3/4 mb-4" />
          
          {/* Content Skeleton */}
          <div className="space-y-2 mb-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Image Skeleton */}
          <Skeleton className="h-80 w-full rounded-lg mb-6" />
          
          {/* Engagement Bar Skeleton */}
          <div className="border-t pt-4 flex justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Comments Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-48 rounded-md" />
          </div>
          
          <Skeleton className="h-32 w-full rounded-md mb-6" />
          
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
