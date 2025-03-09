'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { InteractionBar } from './InteractionBar';
import { ContentItem } from './ContentFeed';

interface ContentCardProps {
  content: ContentItem;
}

export function ContentCard({ content }: ContentCardProps) {
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format date
  const formattedDate = formatDistanceToNow(new Date(content.createdAt), { addSuffix: true });
  
  // Determine if text is long
  const isLongText = content.body.length > 280;
  const displayText = isLongText && !isExpanded
    ? `${content.body.slice(0, 280)}...`
    : content.body;
  
  // Determine content type badge
  const getContentTypeBadge = () => {
    switch(content.type) {
      case 'battle':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-battle-yellow/20 text-battle-yellow">
            Battle
          </span>
        );
      case 'image':
      case 'video':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-flow-blue/20 text-flow-blue">
            {content.type === 'image' ? 'Image' : 'Video'}
          </span>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 sm:p-6">
        {/* Author info */}
        <div className="flex items-center mb-4">
          <Avatar
            src={content.author.avatarUrl || undefined}
            alt={content.author.username}
            fallback={content.author.username.charAt(0).toUpperCase()}
            className="mr-3 h-10 w-10"
          />
          <div>
            <Link
              href={`/profile/${content.author.id}`}
              className="font-medium text-hype-white hover:text-battle-yellow transition-colors"
            >
              {content.author.username}
            </Link>
            <div className="text-xs text-zinc-400">{formattedDate}</div>
          </div>
          {getContentTypeBadge() && (
            <div className="ml-auto">{getContentTypeBadge()}</div>
          )}
        </div>
        
        {/* Content title */}
        {content.title && (
          <h3 className="text-xl font-display text-hype-white mb-2">
            {content.title}
          </h3>
        )}
        
        {/* Content body */}
        <div className="mb-4">
          <p className="text-zinc-200 whitespace-pre-line">{displayText}</p>
          
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-battle-yellow hover:text-battle-yellow/80 text-sm mt-2 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        
        {/* Media content if available */}
        {content.mediaUrl && (
          <div className="relative mb-4 rounded-md overflow-hidden">
            {content.type === 'image' ? (
              <Image
                src={content.mediaUrl}
                alt={content.title || 'Content image'}
                width={600}
                height={400}
                className="w-full h-auto object-cover rounded-md"
              />
            ) : content.type === 'video' ? (
              <video
                src={content.mediaUrl}
                controls
                className="w-full h-auto rounded-md"
              />
            ) : null}
          </div>
        )}
        
        {/* Tags if any */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.tags.map(tag => (
              <Link 
                key={tag} 
                href={`/community?filter=tag&tag=${tag}`}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        
        {/* Interaction bar */}
        <InteractionBar
          contentId={content.id}
          metrics={content.metrics}
          contentType={content.type}
        />
      </div>
    </Card>
  );
}
