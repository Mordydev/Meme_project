'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { 
  Input 
} from '@/components/ui/input';
import {
  Search,
  ChevronRight,
  FolderIcon,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryNavigationProps {
  initialSelectedId?: string;
  onSelectCategory: (categoryId?: string) => void;
  className?: string;
}

export function CategoryNavigation({
  initialSelectedId,
  onSelectCategory,
  className
}: CategoryNavigationProps) {
  const { rootCategories, getChildCategories, isLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(initialSelectedId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubcategories, setShowSubcategories] = useState(!!initialSelectedId);
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(
    initialSelectedId ? rootCategories.find(c => 
      c.id === initialSelectedId || getChildCategories(c.id).some(sc => sc.id === initialSelectedId)
    )?.id : undefined
  );
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Update selected category when initialSelectedId changes
  useEffect(() => {
    setSelectedCategoryId(initialSelectedId);
    
    if (initialSelectedId) {
      // Find if this is a subcategory and set the parent
      for (const parent of rootCategories) {
        const children = getChildCategories(parent.id);
        if (parent.id === initialSelectedId || children.some(c => c.id === initialSelectedId)) {
          setCurrentParentId(parent.id);
          setShowSubcategories(true);
          break;
        }
      }
    }
  }, [initialSelectedId, rootCategories, getChildCategories]);
  
  // Handle category selection
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    onSelectCategory(categoryId);
  };
  
  // Handle viewing all categories
  const handleViewAllCategories = () => {
    setSelectedCategoryId(undefined);
    setShowSubcategories(false);
    setCurrentParentId(undefined);
    onSelectCategory(undefined);
  };
  
  // Handle viewing subcategories
  const handleViewSubcategories = (parentId: string) => {
    setCurrentParentId(parentId);
    setShowSubcategories(true);
  };
  
  // Handle going back to main categories
  const handleBackToMainCategories = () => {
    setShowSubcategories(false);
  };
  
  // Filter categories based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return showSubcategories && currentParentId
        ? getChildCategories(currentParentId)
        : rootCategories;
    }
    
    const query = searchQuery.toLowerCase();
    
    if (showSubcategories && currentParentId) {
      return getChildCategories(currentParentId).filter(category =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
      );
    }
    
    return rootCategories.filter(category =>
      category.name.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query)
    );
  }, [
    rootCategories,
    searchQuery,
    showSubcategories,
    currentParentId,
    getChildCategories
  ]);
  
  // Get current parent category if viewing subcategories
  const currentParent = currentParentId ? rootCategories.find(c => c.id === currentParentId) : undefined;
  
  return (
    <Card className={cn("sticky top-6", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {showSubcategories && currentParent ? (
            <>
              <button
                onClick={handleBackToMainCategories}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Back to main categories"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                <span className="text-sm">Back</span>
              </button>
              <span className="truncate flex-1 text-center">{currentParent.name}</span>
            </>
          ) : (
            "Categories"
          )}
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search categories..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <CategoryLoadingSkeleton />
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No categories match your search
          </div>
        ) : (
          <div className="space-y-1">
            {/* "All" option when viewing subcategories */}
            {showSubcategories && (
              <CategoryItem
                name="All posts"
                description={`All posts in ${currentParent?.name || 'category'}`}
                postCount={currentParent?.postCount || 0}
                isSelected={selectedCategoryId === currentParentId}
                onClick={() => handleSelectCategory(currentParentId!)}
              />
            )}
            
            {/* "All Categories" option when searching or at root */}
            {!showSubcategories && (
              <CategoryItem
                name="All Categories"
                description="View posts from all categories"
                isSelected={!selectedCategoryId}
                onClick={handleViewAllCategories}
              />
            )}
            
            {/* Category list */}
            {filteredCategories.map(category => (
              <CategoryItem
                key={category.id}
                name={category.name}
                description={category.description}
                postCount={category.postCount}
                isSelected={selectedCategoryId === category.id}
                hasChildren={!showSubcategories && getChildCategories(category.id).length > 0}
                onClick={() => {
                  // If this category has subcategories and we're not already viewing them,
                  // show subcategories instead of selecting
                  if (!showSubcategories && getChildCategories(category.id).length > 0) {
                    handleViewSubcategories(category.id);
                  } else {
                    handleSelectCategory(category.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CategoryItemProps {
  name: string;
  description: string;
  postCount?: number;
  isSelected?: boolean;
  hasChildren?: boolean;
  onClick: () => void;
}

function CategoryItem({
  name,
  description,
  postCount,
  isSelected,
  hasChildren,
  onClick
}: CategoryItemProps) {
  return (
    <button
      className={cn(
        "w-full text-left rounded-md px-3 py-2 transition-colors",
        "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30",
        isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderIcon size={16} className={cn(isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
          <span className="font-medium truncate">{name}</span>
        </div>
        {hasChildren && <ChevronRight size={16} className="text-muted-foreground" />}
      </div>
      
      <div className={cn(
        "text-xs mt-0.5 truncate",
        isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
      )}>
        {postCount !== undefined ? `${description} • ${postCount} posts` : description}
      </div>
    </button>
  );
}

function CategoryLoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 p-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
