'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onClick?: (id: string) => void;
  compact?: boolean;
}

/**
 * Card component to display a single category
 */
export function CategoryCard({ 
  category, 
  isSelected = false, 
  onClick,
  compact = false
}: CategoryCardProps) {
  const { id, name, description, icon, postCount } = category;
  
  const handleClick = () => {
    if (onClick) onClick(id);
  };
  
  const cardContent = (
    <div 
      className={`
        border rounded-lg p-4 ${compact ? 'p-3' : 'p-4'} 
        ${isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'}
        flex items-center gap-3 transition-colors
      `}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Category Icon */}
      <div className={`
        ${compact ? 'w-8 h-8' : 'w-10 h-10'} 
        rounded-full bg-primary/10 text-primary 
        flex items-center justify-center
      `}>
        {renderCategoryIcon(icon)}
      </div>
      
      <div className="min-w-0 flex-1">
        {/* Category Name */}
        <h3 className={`font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
          {name}
        </h3>
        
        {/* Category Info */}
        {!compact && (
          <>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {postCount} {postCount === 1 ? 'post' : 'posts'}
            </p>
          </>
        )}

        {/* Compact mode only shows post count */}
        {compact && (
          <p className="text-xs text-muted-foreground">
            {postCount} {postCount === 1 ? 'post' : 'posts'}
          </p>
        )}
      </div>
    </div>
  );
  
  if (onClick) {
    return cardContent;
  }
  
  return (
    <Link href={`/community/category/${id}`} className="block">
      {cardContent}
    </Link>
  );
}

// Helper function to render category icons
function renderCategoryIcon(iconName: string) {
  // Default category icons
  const iconMap: Record<string, React.ReactNode> = {
    'chat-bubble': (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    'coin': (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'question': (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
    'fire': (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
    'hand': (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3.615a1.575 1.575 0 10-3.15 0v5.175c0 1.5.75 2.925 1.995 3.75l1.245.825c1.995 1.33 4.515 1.335 6.51.015l1.245-.84a5.25 5.25 0 001.995-4.125V8.575a1.575 1.575 0 10-3.15 0v1.05a1.575 1.575 0 10-3.15 0V4.575z" />
      </svg>
    ),
  };
  
  // Return icon from map or a fallback icon
  return iconMap[iconName] || (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  );
}

export default CategoryCard;
