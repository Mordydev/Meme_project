'use client';

import { UserContent } from '@/types/profile';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ContentGalleryProps {
  userId: string;
  initialContent?: UserContent[];
  limit?: number;
}

export function ContentGallery({ 
  userId, 
  initialContent = [],
  limit = 6
}: ContentGalleryProps) {
  const [content, setContent] = useState<UserContent[]>(initialContent);
  const [loading, setLoading] = useState(!initialContent.length);
  const [error, setError] = useState<string | null>(null);
  const [viewAll, setViewAll] = useState(false);
  
  // Fetch user content if not provided initially
  useEffect(() => {
    if (initialContent.length) return;
    
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/content`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user content');
        }
        
        const data = await response.json();
        setContent(data.data || []);
      } catch (err) {
        console.error('Error fetching user content:', err);
        setError('Could not load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [userId, initialContent]);
  
  // Calculate the content to display based on view state
  const displayContent = viewAll ? content : content.slice(0, limit);
  
  if (loading) {
    return (
      <div>
        <h3 className="text-2xl font-display text-hype-white mb-4">Content</h3>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-zinc-700 rounded w-1/4 mb-2"></div>
              <div className="h-32 bg-zinc-700 rounded-md mb-2"></div>
              <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <h3 className="text-2xl font-display text-hype-white mb-4">Content</h3>
        <div className="bg-zinc-800 rounded-lg p-4 text-roast-red">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-display text-hype-white">Content</h3>
        
        {content.length > limit && (
          <button
            onClick={() => setViewAll(!viewAll)}
            className="text-xs px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-full text-zinc-200"
          >
            {viewAll ? 'Show Less' : 'View All'}
          </button>
        )}
      </div>
      
      {content.length === 0 ? (
        <div className="bg-zinc-800 rounded-lg p-6 text-center">
          <div className="text-zinc-400 mb-3">No content yet</div>
          <p className="text-zinc-300 text-sm mb-4">
            When this user creates content or participates in battles, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayContent.map((item) => (
            <ContentItem key={item.id} content={item} />
          ))}
        </div>
      )}
      
      {!viewAll && content.length > limit && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setViewAll(true)}
            className="text-sm px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-zinc-200"
          >
            View {content.length - limit} More Items
          </button>
        </div>
      )}
    </div>
  );
}

// ContentItem component to display individual content items
function ContentItem({ content }: { content: UserContent }) {
  // Get type-specific label and link
  const getTypeInfo = () => {
    switch (content.type) {
      case 'battle':
        return {
          label: 'Battle Entry',
          link: `/battle/${content.battleId}`,
          className: 'bg-flow-blue text-zinc-100'
        };
      case 'post':
        return {
          label: 'Community Post',
          link: `/community/post/${content.id}`,
          className: 'bg-victory-green text-zinc-100'
        };
      case 'comment':
        return {
          label: 'Comment',
          link: '',
          className: 'bg-zinc-600 text-zinc-200'
        };
      default:
        return {
          label: 'Content',
          link: '',
          className: 'bg-zinc-700 text-zinc-300'
        };
    }
  };
  
  const typeInfo = getTypeInfo();
  
  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <div className={`text-xs px-2 py-1 rounded-full ${typeInfo.className}`}>
          {typeInfo.label}
        </div>
        <div className="text-xs text-zinc-400 ml-2">
          {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
        </div>
      </div>
      
      {content.mediaUrl && (
        <div className="h-32 bg-zinc-700 rounded-md mb-2 overflow-hidden">
          <img 
            src={content.mediaUrl} 
            alt={content.title || 'Content preview'} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {content.title && (
        <div className="font-medium text-hype-white mb-1">{content.title}</div>
      )}
      
      {content.body && (
        <div className="text-zinc-200">
          {content.body.length > 150 
            ? `${content.body.substring(0, 150)}...` 
            : content.body}
        </div>
      )}
      
      <div className="flex items-center mt-3 text-xs text-zinc-400">
        <div className="flex items-center mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {content.metrics.viewCount}
        </div>
        <div className="flex items-center mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {content.metrics.reactionCount}
        </div>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {content.metrics.commentCount}
        </div>
      </div>
      
      {typeInfo.link && (
        <div className="mt-3">
          <Link href={typeInfo.link}>
            <span className="text-sm text-battle-yellow hover:text-battle-yellow/80">
              View Details →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
