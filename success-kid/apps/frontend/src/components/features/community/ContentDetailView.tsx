'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Content, VoteAction } from '@/types/community';

interface ContentDetailViewProps {
  content: Content;
  onVote: (contentId: string, action: VoteAction) => Promise<void>;
}

export function ContentDetailView({ content, onVote }: ContentDetailViewProps) {
  const handleVote = (action: VoteAction) => {
    onVote(content.id, action);
  };

  const renderContent = () => {
    switch (content.type) {
      case 'text':
        return (
          <div 
            className="mt-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content.body }}
          />
        );
      
      case 'image':
        return (
          <div className="mt-4 space-y-4">
            {content.media && content.media.length > 0 && (
              <div className={`grid ${content.media.length > 1 ? 'grid-cols-2 gap-2' : ''}`}>
                {content.media.map((image, index) => (
                  <div key={index} className={`${content.media.length === 1 ? 'max-h-[500px] overflow-hidden rounded-md' : 'aspect-square overflow-hidden rounded-md'}`}>
                    <img 
                      src={image.url} 
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            {content.body && (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content.body }}
              />
            )}
          </div>
        );
      
      case 'link':
        return (
          <div className="mt-4 space-y-4">
            <a 
              href={content.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink size={16} />
              {content.link}
            </a>
            {content.body && (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content.body }}
              />
            )}
          </div>
        );
      
      case 'poll':
        return (
          <div className="mt-4 space-y-4">
            {content.body && (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content.body }}
              />
            )}
            <div className="space-y-2 mt-4">
              {content.pollOptions?.map((option, index) => {
                const percentage = content.pollOptions 
                  ? (option.votes / content.pollOptions.reduce((sum, opt) => sum + opt.votes, 0)) * 100 
                  : 0;
                
                return (
                  <div key={index} className="relative">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{option.text}</span>
                      <span>{Math.round(percentage)}% ({option.votes})</span>
                    </div>
                    <div className="h-8 w-full bg-gray-100 rounded-md relative overflow-hidden flex items-center px-3">
                      <div 
                        className="absolute top-0 left-0 h-full bg-primary/20 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="relative text-sm font-medium z-10">{option.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!content) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar 
          src={content.author.avatar} 
          alt={content.author.name}
          className="h-10 w-10 rounded-full"
        />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{content.author.name}</h3>
            {content.author.isVerified && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary">Verified</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
            {content.category && (
              <> • in <span className="text-primary">{content.category.name}</span></>
            )}
          </p>
        </div>
      </div>

      <h1 className="text-2xl font-semibold">{content.title}</h1>
      
      {content.tags && content.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.tags.map(tag => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {renderContent()}

      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1"
            onClick={() => handleVote('upvote')}
          >
            <ThumbsUp size={16} className={content.userVote === 'upvote' ? 'text-primary' : 'text-muted-foreground'} />
            <span className="text-sm">{content.votes?.upvotes || 0}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1"
            onClick={() => handleVote('downvote')}
          >
            <ThumbsDown size={16} className={content.userVote === 'downvote' ? 'text-primary' : 'text-muted-foreground'} />
            <span className="text-sm">{content.votes?.downvotes || 0}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
