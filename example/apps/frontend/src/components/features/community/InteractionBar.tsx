'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface InteractionBarProps {
  contentId: string;
  contentType: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export function InteractionBar({ contentId, contentType, metrics }: InteractionBarProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(metrics.likes);
  const [isLiking, setIsLiking] = useState(false);
  
  const handleLike = async () => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect=/community');
      return;
    }
    
    try {
      setIsLiking(true);
      
      const response = await fetch(`/api/content/${contentId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'like',
          target: 'content',
          targetId: contentId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to like content');
      }
      
      // Toggle like status and update count
      setIsLiked(!isLiked);
      setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
      
    } catch (error) {
      console.error('Error liking content:', error);
    } finally {
      setIsLiking(false);
    }
  };
  
  return (
    <div className="flex justify-between items-center pt-3 border-t border-zinc-700">
      <Button 
        variant="ghost" 
        size="sm" 
        className={`flex items-center gap-2 ${isLiked ? 'text-victory-green' : 'text-zinc-400 hover:text-hype-white'}`}
        onClick={handleLike}
        disabled={isLiking}
      >
        <span>{isLiked ? '❤️' : '🤍'}</span>
        <span>{likeCount > 0 ? likeCount : ''}</span>
      </Button>
      
      <Link href={`/community/content/${contentId}`} passHref>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-zinc-400 hover:text-hype-white">
          <span>💬</span>
          <span>{metrics.comments > 0 ? metrics.comments : ''}</span>
        </Button>
      </Link>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-2 text-zinc-400 hover:text-hype-white"
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: 'Check out this content on Wild 'n Out',
              url: `${window.location.origin}/community/content/${contentId}`,
            });
          } else {
            // Fallback copy to clipboard
            navigator.clipboard.writeText(`${window.location.origin}/community/content/${contentId}`);
            alert('Link copied to clipboard!');
          }
        }}
      >
        <span>🔄</span>
        <span>Share</span>
      </Button>
      
      {contentType === 'battle' && (
        <Link href={`/battle/${contentId}`} passHref>
          <Button variant="ghost" size="sm" className="text-battle-yellow hover:text-battle-yellow/80">
            View Battle
          </Button>
        </Link>
      )}
    </div>
  );
}
