'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Post, ContentType } from '@/types/community';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowUp, ArrowDown, Share2, ExternalLink, Image as ImageIcon, FileText, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';

interface ContentCardProps {
  post: Post;
  isCompact?: boolean;
  className?: string;
  onVote?: (postId: string, direction: 'up' | 'down') => void;
}

export function ContentCard({ 
  post, 
  isCompact = false,
  className,
  onVote 
}: ContentCardProps) {
  const { getCategoryById } = useCategories();
  const category = getCategoryById(post.categoryId);
  
  // Format the creation date using date-fns
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  
  // Helper function to render the correct icon based on content type
  const renderTypeIcon = (type: ContentType) => {
    switch(type) {
      case 'text':
        return <FileText size={16} />;
      case 'image':
        return <ImageIcon size={16} />;
      case 'link':
        return <ExternalLink size={16} />;
      case 'poll':
        return <BarChart2 size={16} />;
      default:
        return <FileText size={16} />;
    }
  };
  
  const href = `/community/post/${post.id}`;
  
  return (
    <Card className={cn("hover:shadow-md transition-all", className)}>
      <Link href={href} className="block">
        <CardContent className={cn("p-0")}>
          <div className="p-4 flex flex-col">
            {/* Post Header */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              {/* Type Icon */}
              <div className="flex items-center gap-1">
                {renderTypeIcon(post.type)}
                <span className="sr-only">{post.type}</span>
              </div>
              
              {/* Category */}
              {category && (
                <Link href={`/community/category/${category.id}`} className="hover:underline hover:text-foreground">
                  {category.name}
                </Link>
              )}
              
              <span>•</span>
              
              {/* Author */}
              <Link href={`/profile/${post.author.username}`} className="flex items-center gap-1 hover:underline hover:text-foreground">
                {post.author.avatarUrl ? (
                  <Image 
                    src={post.author.avatarUrl} 
                    alt={post.author.username} 
                    width={16} 
                    height={16} 
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
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
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">{post.title}</h3>
            
            {/* Preview Content - conditionally rendered based on post type and compact mode */}
            {!isCompact && (
              <div className="mb-3">
                {post.type === 'text' && post.preview && (
                  <p className="text-muted-foreground line-clamp-3">{post.preview}</p>
                )}
                
                {post.type === 'image' && post.mediaUrls && post.mediaUrls[0] && (
                  <div className="relative h-40 rounded-md overflow-hidden bg-muted">
                    <Image 
                      src={post.mediaUrls[0]} 
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                
                {post.type === 'link' && post.preview && (
                  <div className="flex items-center text-primary">
                    <ExternalLink size={14} className="mr-1" />
                    <span className="line-clamp-1 text-sm">{post.preview}</span>
                  </div>
                )}
                
                {post.type === 'poll' && post.preview && (
                  <div className="text-sm text-muted-foreground">
                    {post.preview} (Poll)
                  </div>
                )}
              </div>
            )}
            
            {/* Engagement Stats */}
            <div className="flex items-center gap-4 mt-auto text-sm text-muted-foreground">
              {/* Vote Count */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onVote?.(post.id, 'up');
                  }}
                  className={cn(
                    "p-1 hover:bg-muted rounded",
                    post.userVote === 'up' && "text-primary"
                  )}
                >
                  <ArrowUp size={16} />
                </button>
                <span className="min-w-[2ch] text-center">{post.voteCount}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onVote?.(post.id, 'down');
                  }}
                  className={cn(
                    "p-1 hover:bg-muted rounded",
                    post.userVote === 'down' && "text-alert"
                  )}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
              
              {/* Comment Count */}
              <div className="flex items-center gap-1">
                <MessageSquare size={16} />
                <span>{post.commentCount}</span>
              </div>
              
              {/* Share Button */}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-8 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Implement share functionality
                  navigator.clipboard.writeText(window.location.origin + href);
                }}
              >
                <Share2 size={14} className="mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
