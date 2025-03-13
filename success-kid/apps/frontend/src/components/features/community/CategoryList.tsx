'use client';

import React, { useState } from 'react';
import { Category } from '@/types/community';
import { CategoryCard } from './CategoryCard';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryListProps {
  categories: Category[];
  childCategories: Record<string, Category[]>;
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export function CategoryList({ 
  categories, 
  childCategories, 
  selectedCategoryId, 
  onSelectCategory,
  className 
}: CategoryListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      {categories.map(category => {
        const hasChildren = (childCategories[category.id]?.length ?? 0) > 0;
        const isExpanded = expandedCategories[category.id] ?? false;
        
        return (
          <div key={category.id} className="space-y-1">
            <div className="flex items-center">
              {hasChildren ? (
                <button 
                  className="mr-1 p-1 hover:bg-muted rounded-md"
                  onClick={() => toggleExpand(category.id)}
                  aria-label={isExpanded ? "Collapse category" : "Expand category"}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : <div className="w-7" />}
              
              <div className="flex-1">
                <CategoryCard 
                  category={category} 
                  isSelected={category.id === selectedCategoryId}
                  onClick={() => onSelectCategory(category.id)}
                />
              </div>
            </div>
            
            {hasChildren && isExpanded && (
              <div className="ml-7 pl-2 border-l space-y-1">
                {childCategories[category.id].map(childCategory => (
                  <CategoryCard 
                    key={childCategory.id}
                    category={childCategory}
                    isSelected={childCategory.id === selectedCategoryId}
                    onClick={() => onSelectCategory(childCategory.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
