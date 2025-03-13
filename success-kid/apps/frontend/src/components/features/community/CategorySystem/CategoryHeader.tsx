'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/types';

interface CategoryHeaderProps {
  category: Category;
  action?: React.ReactNode;
}

/**
 * Header component for category pages
 */
export function CategoryHeader({ category, action }: CategoryHeaderProps) {
  const { name, description, icon, postCount } = category;
  
  return (
    <div className="bg-card border-b pb-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          {/* Category Icon */}
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            {/* This would use the same icon helper as CategoryCard */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground">
                Community
              </Link>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-xl font-bold">{name}</h1>
            </div>
            
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
            
            <p className="text-sm text-muted-foreground mt-1">
              {postCount} {postCount === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </div>
        
        {/* Action button */}
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryHeader;
