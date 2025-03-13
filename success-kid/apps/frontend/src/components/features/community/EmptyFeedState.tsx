'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';

interface EmptyFeedStateProps {
  categoryId?: string;
}

export function EmptyFeedState({ categoryId }: EmptyFeedStateProps) {
  const { getCategoryById } = useCategories();
  const category = categoryId ? getCategoryById(categoryId) : null;
  
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-primary/10 rounded-full p-3 mb-4">
          <Search className="h-8 w-8 text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {category
            ? `No posts in ${category.name} yet`
            : 'No posts to show'}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          {category
            ? `Be the first to start a discussion in the ${category.name} category!`
            : 'There are no posts to show with the current filters. Try changing the filters or create the first post!'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/community/create">
            <Button className="gap-2">
              <PlusCircle size={18} />
              Create a post
            </Button>
          </Link>
          
          {categoryId && (
            <Link href="/community">
              <Button variant="outline">
                Browse all categories
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
