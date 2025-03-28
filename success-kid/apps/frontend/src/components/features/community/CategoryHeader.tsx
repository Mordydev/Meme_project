'use client';

import React from 'react';
import { Category } from '@/types/community';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Icon component placeholder
const Icon = ({ name }: { name: string }) => (
  <div className="h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
    {name.charAt(0).toUpperCase()}
  </div>
);

interface CategoryHeaderProps {
  categoryId?: string;
  className?: string;
}

export function CategoryHeader({ categoryId, className }: CategoryHeaderProps) {
  const { getCategoryById, isLoading } = useCategories();
  const router = useRouter();
  
  const category = categoryId ? getCategoryById(categoryId) : null;
  const parentCategory = category?.parentId ? getCategoryById(category.parentId) : null;
  
  const handleBack = () => {
    if (parentCategory) {
      router.push(`/community/category/${parentCategory.id}`);
    } else {
      router.push('/community');
    }
  };
  
  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="h-24 flex items-center justify-center">
          <div className="text-muted-foreground">Loading category...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (!category && categoryId) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleBack}
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Category not found</h2>
              <p className="text-sm text-muted-foreground">
                The requested category could not be found.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!category) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">All Categories</h2>
              <p className="text-sm text-muted-foreground">
                Browse all community discussions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0 mt-1" 
            onClick={handleBack}
          >
            <ArrowLeft size={16} />
          </Button>
          
          <Icon name={category.icon} />
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <p className="text-muted-foreground">{category.description}</p>
            
            <div className="mt-2 flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
              </div>
              
              {parentCategory && (
                <div className="text-sm text-muted-foreground">
                  in <span className="font-medium">{parentCategory.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
