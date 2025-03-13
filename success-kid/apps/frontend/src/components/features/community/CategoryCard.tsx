'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/types/community';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Import icons from a library like Lucide React
// For now, we'll use a simple placeholder icon component
const Icon = ({ name }: { name: string }) => (
  <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
    {name.charAt(0).toUpperCase()}
  </div>
);

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  className?: string;
  onClick?: () => void;
}

export function CategoryCard({ 
  category, 
  isSelected = false, 
  className,
  onClick
}: CategoryCardProps) {
  const href = `/community/category/${category.id}`;
  
  return (
    <Card 
      className={cn(
        "transition-colors hover:bg-muted/50 cursor-pointer",
        isSelected ? "border-primary bg-primary/5" : "border-transparent",
        className
      )}
      onClick={onClick}
    >
      <Link href={href}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Icon name={category.icon} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{category.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{category.description}</p>
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
