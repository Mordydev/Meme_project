'use client';

import React, { useState, useMemo } from 'react';
import { CategoryList } from './CategoryList';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface CategoryBrowserProps {
  initialSelectedId?: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export function CategoryBrowser({ 
  initialSelectedId, 
  onSelectCategory,
  className 
}: CategoryBrowserProps) {
  const { rootCategories, getChildCategories, isLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(initialSelectedId);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle category selection
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    onSelectCategory(categoryId);
  };
  
  // Create a map of child categories for each parent category
  const childCategoriesMap = useMemo(() => {
    return rootCategories.reduce((acc, category) => {
      acc[category.id] = getChildCategories(category.id);
      return acc;
    }, {} as Record<string, any>);
  }, [rootCategories, getChildCategories]);
  
  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return rootCategories;
    
    return rootCategories.filter(category => 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rootCategories, searchQuery]);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Categories</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading categories...</div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No categories match your search
          </div>
        ) : (
          <CategoryList
            categories={filteredCategories}
            childCategories={childCategoriesMap}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        )}
      </CardContent>
    </Card>
  );
}
