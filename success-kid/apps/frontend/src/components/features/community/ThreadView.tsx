/**
 * Thread View Component
 * 
 * Displays a thread with its first post and replies
 */

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  MessageSquare, 
  Eye, 
  ThumbsUp, 
  Clock, 
  Share,
  Flag,
  MoreHorizontal,
  ReplyAll,
  Lock
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Types
interface Thread {
  id: string;
  title: string;
  user_id: string;
  category_id: string;
  forum_id: string;
  type: string;
  status: string;
  is_pinned: boolean;
  is_locked: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  content: {
    id: string;
    content_text: string;
    media_urls: string[];
    poll_options?: {
      id: string;
      text: string;
      votes: number;
    }[];
  };
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  forum: {
    id: string;
    name: string;
    slug: string;
  };
  stats: {
    replies: number;
    participants: number;
    likes: number;
  };
  replies: Reply[];
}

interface Reply {
  id: string;
  content_id: string;
  created_at: string;
  content_text: string;
  media_urls: string[];
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  stats: {
    likes: number;
  };
}

interface ThreadViewProps {
  threadId: string;
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
 * Format date as absolute time
 */
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Thread View Component
 */
export const ThreadView: React.FC<ThreadViewProps> = ({ threadId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [replyText, setReplyText] = useState('');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Fetch thread data
  const { data: threadData, isLoading, error } = useQuery<{ data: Thread }>({
    queryKey: ['thread', threadId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/forum/threads/${threadId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch thread');
      }
      return response.json();
    },
    enabled: !!threadId,
  });

  // Create reply mutation
  const createReply = useMutation({
    mutationFn: async (content: { content_text: string }) => {
      const response = await fetch(`/api/v1/forum/threads/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Failed to create reply');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
      toast({
        title: "Reply Posted",
        description: "Your reply has been added to the thread.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const thread = threadData?.data;

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Reply text cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    createReply.mutate({ content_text: replyText });
  };

  const handleReplyClick = () => {
    if (replyInputRef.current) {
      replyInputRef.current.focus();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Thread link has been copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500">
        <h3 className="font-bold">Error loading thread</h3>
        <p>The requested thread could not be found or there was an error loading it.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/forum')}
        >
          Back to Forums
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/forum">Forums</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/forum/${thread.forum.slug}`}>{thread.forum.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/forum/category/${thread.category.id}`}>{thread.category.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h1 className="text-2xl font-bold">
          {thread.is_pinned && <Badge variant="outline" className="mr-2 align-middle">Pinned</Badge>}
          {thread.is_locked && <Badge variant="outline" className="mr-2 align-middle">Locked</Badge>}
          {thread.title}
        </h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share size={16} className="mr-2" />
            Share
          </Button>
          
          {!thread.is_locked && (
            <Button size="sm" onClick={handleReplyClick}>
              <ReplyAll size={16} className="mr-2" />
              Reply
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center" title="Replies">
          <MessageSquare size={16} className="mr-1" />
          <span>{thread.stats.replies} replies</span>
        </div>
        <div className="flex items-center" title="Views">
          <Eye size={16} className="mr-1" />
          <span>{thread.views} views</span>
        </div>
        <div className="flex items-center" title="Participants">
          <Avatar className="h-4 w-4 mr-1">
            <AvatarFallback>{thread.stats.participants}</AvatarFallback>
          </Avatar>
          <span>{thread.stats.participants} participants</span>
        </div>
      </div>
      
      {/* Original Post */}
      <Card id="post-original" className="mb-6 border-primary/20">
        <CardHeader className="border-b bg-muted/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={thread.author.avatar_url || ''} alt={thread.author.display_name} />
                <AvatarFallback>{thread.author.display_name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{thread.author.display_name}</div>
                <div className="text-xs text-muted-foreground">
                  Posted {formatDateTime(thread.created_at)}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <ThumbsUp size={16} className="mr-2" />
                  Like
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share size={16} className="mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag size={16} className="mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 whitespace-pre-wrap">
          <div className="prose max-w-none dark:prose-invert">
            {thread.content.content_text}
          </div>
          
          {thread.content.media_urls && thread.content.media_urls.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {thread.content.media_urls.map((url, index) => (
                <img 
                  key={index} 
                  src={url} 
                  alt={`Attachment ${index + 1}`} 
                  className="rounded-md max-h-64 object-cover"
                />
              ))}
            </div>
          )}
          
          {thread.content.poll_options && thread.content.poll_options.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-medium">Poll</h4>
              <div className="space-y-2">
                {thread.content.poll_options.map((option) => {
                  const totalVotes = thread.content.poll_options?.reduce((acc, curr) => acc + curr.votes, 0) || 1;
                  const percentage = Math.round((option.votes / totalVotes) * 100);
                  
                  return (
                    <div key={option.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{option.text}</span>
                        <span>{option.votes} votes ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Total votes: {thread.content.poll_options.reduce((acc, curr) => acc + curr.votes, 0)}
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-2 text-sm text-muted-foreground border-t flex justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ThumbsUp size={16} className="mr-2" />
              Like
            </Button>
            
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleReplyClick}>
              <ReplyAll size={16} className="mr-2" />
              Reply
            </Button>
          </div>
          
          <div className="flex items-center">
            <Clock size={14} className="mr-1" />
            <span>{formatRelativeTime(thread.created_at)}</span>
          </div>
        </CardFooter>
      </Card>
      
      {/* Replies */}
      {thread.replies.length > 0 && (
        <div className="space-y-4" id="replies">
          {thread.replies.map((reply) => (
            <Card key={reply.id} id={`reply-${reply.id}`}>
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={reply.author.avatar_url || ''} alt={reply.author.display_name} />
                      <AvatarFallback>{reply.author.display_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{reply.author.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Posted {formatDateTime(reply.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <ThumbsUp size={16} className="mr-2" />
                        Like
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(`${window.location.href}#reply-${reply.id}`);
                        toast({
                          title: "Link Copied",
                          description: "Link to this reply has been copied to clipboard",
                        });
                      }}>
                        <Share size={16} className="mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Flag size={16} className="mr-2" />
                        Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 whitespace-pre-wrap">
                <div className="prose max-w-none dark:prose-invert">
                  {reply.content_text}
                </div>
                
                {reply.media_urls && reply.media_urls.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {reply.media_urls.map((url, index) => (
                      <img 
                        key={index} 
                        src={url} 
                        alt={`Attachment ${index + 1}`} 
                        className="rounded-md max-h-64 object-cover"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-2 text-sm text-muted-foreground border-t flex justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <ThumbsUp size={16} className="mr-2" />
                    Like {reply.stats.likes > 0 && `(${reply.stats.likes})`}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2" 
                    onClick={handleReplyClick}
                    disabled={thread.is_locked}
                  >
                    <ReplyAll size={16} className="mr-2" />
                    Reply
                  </Button>
                </div>
                
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  <span>{formatRelativeTime(reply.created_at)}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Reply Form */}
      <div className="pt-8" id="reply-form">
        <div className="sticky bottom-0 p-4 bg-background border rounded-lg shadow-lg">
          {thread.is_locked ? (
            <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
              <Lock size={18} />
              <span>This thread is locked. No new replies can be added.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitReply}>
              <h3 className="font-medium mb-2">Post a Reply</h3>
              
              <Textarea
                ref={replyInputRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isAuthenticated ? "Type your reply here..." : "Please login to reply"}
                className="w-full mb-2 min-h-[100px]"
                disabled={!isAuthenticated || createReply.isPending}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="submit" 
                  disabled={!isAuthenticated || createReply.isPending || !replyText.trim()}
                >
                  {createReply.isPending ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
