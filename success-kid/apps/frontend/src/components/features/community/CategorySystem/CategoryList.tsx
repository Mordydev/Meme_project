'use client';

import React from 'react';
import { Category } from '@/types';
import { CategoryCard } from './CategoryCard';

interface CategoryListProps {
  categories: Category[];
  selectedId?: string;
  onCategorySelect?: (id: string) => void;
  compact?: boolean;
  limit?: number;
}

/**
 * A component that displays a list of categories
 */
export function CategoryList({ 
  categories,
  selectedId,
  onCategorySelect,
  compact = false,
  limit
}: CategoryListProps) {
  // Handle parent-child relationships
  const rootCategories = categories.filter(c => !c.parentId);
  
  // Create a map of parent -> children
  const childrenMap: Record<string, Category[]> = {};
  categories.forEach(category => {
    if (category.parentId) {
      if (!childrenMap[category.parentId]) {
        childrenMap[category.parentId] = [];
      }
      childrenMap[category.parentId].push(category);
    }
  });
  
  // Limit categories if specified
  const limitedCategories = limit ? rootCategories.slice(0, limit) : rootCategories;
  
  return (
    <div className="space-y-3">
      {limitedCategories.map(category => (
        <div key={category.id} className="space-y-2">
          <CategoryCard 
            category={category}
            isSelected={selectedId === category.id}
            onClick={onCategorySelect}
            compact={compact}
          />
          
          {/* Show subcategories if this category is selected and it has children */}
          {(selectedId === category.id && childrenMap[category.id]?.length > 0) && (
            <div className="pl-4 ml-2 border-l space-y-2">
              {childrenMap[category.id].map(childCategory => (
                <CategoryCard
                  key={childCategory.id}
                  category={childCategory}
                  isSelected={selectedId === childCategory.id}
                  onClick={onCategorySelect}
                  compact={true}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      
      {/* If we're limiting categories and there are more */}
      {limit && rootCategories.length > limit && (
        <button 
          className="text-sm text-primary font-medium hover:underline"
          onClick={() => {/* Implement view all action */}}
        >
          View all categories ({rootCategories.length})
        </button>
      )}
    </div>
  );
}

export default CategoryList;
