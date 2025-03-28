'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageSquare, 
  ThumbsUp, 
  Award, 
  Share2, 
  Heart, 
  UserPlus, 
  Edit,
  RefreshCw
} from 'lucide-react';
import { ActivityFeedItem } from '@/types/activity-feed';
import { cn } from '@/lib/utils';

export interface ActivityRendererProps {
  item: ActivityFeedItem;
  isCompact?: boolean;
  onAction?: (action: string, data?: any) => void;
}

export function ActivityRenderer({ item, isCompact = false, onAction }: ActivityRendererProps) {
  const formattedDate = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  
  // Get the correct icon based on activity type
  const getActivityIcon = () => {
    switch (item.activityType) {
      case 'comment':
        return <MessageSquare size={20} className="text-primary" />;
      case 'like':
        return <ThumbsUp size={20} className="text-primary" />;
      case 'achievement':
        return <Award size={20} className="text-primary" />;
      case 'follow':
        return <UserPlus size={20} className="text-primary" />;
      case 'post':
        return <Edit size={20} className="text-primary" />;
      case 'token':
        return <RefreshCw size={20} className="text-primary" />;
      default:
        return <Heart size={20} className="text-primary" />;
    }
  };
  
  // Get the descriptive text based on activity type
  const getActivityText = () => {
    switch (item.activityType) {
      case 'comment':
        return (
          <>
            commented on <Link href={`/community/post/${item.reference?.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{item.reference?.title}</Link>
          </>
        );
      case 'like':
        return (
          <>
            liked <Link href={`/community/post/${item.reference?.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{item.reference?.title}</Link>
          </>
        );
      case 'achievement':
        return (
          <>
            earned achievement <span className="font-medium">{item.reference?.title}</span>
          </>
        );
      case 'follow':
        return (
          <>
            followed <Link href={`/profile/${item.reference?.username}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{item.reference?.username}</Link>
          </>
        );
      case 'post':
        return (
          <>
            created a new post <Link href={`/community/post/${item.reference?.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{item.reference?.title}</Link>
          </>
        );
      case 'token':
        return (
          <>
            redeemed <span className="font-medium">{item.reference?.amount} SKC tokens</span>
          </>
        );
      default:
        return (
          <>engaged with the community</>
        );
    }
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAction?.('share');
  };
  
  const activityUrl = item.reference?.url || `/profile/${item.author.username}`;

  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-md transition-shadow duration-200 mb-4",
      isCompact ? "bg-muted/10" : "bg-white"
    )}>
      <Link href={activityUrl}>
        <CardContent className={cn(
          "flex items-start gap-3",
          isCompact ? "p-3" : "p-4"
        )}>
          {/* Activity Icon */}
          <div className="mt-1 shrink-0">
            {getActivityIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* User and Activity Info */}
            <div className="flex items-center flex-wrap mb-1">
              <Link 
                href={`/profile/${item.author.username}`}
                className="flex items-center gap-2 mr-2"
                onClick={(e) => e.stopPropagation()}
              >
                {item.author.avatarUrl ? (
                  <Image 
                    src={item.author.avatarUrl} 
                    alt={item.author.username} 
                    width={24} 
                    height={24} 
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                    {item.author.username[0].toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-sm hover:underline truncate">{item.author.username}</span>
              </Link>
              
              <span className="text-sm text-muted-foreground">{getActivityText()}</span>
            </div>
            
            {/* Timestamp and Actions */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
              
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleShare}
                aria-label="Share"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
