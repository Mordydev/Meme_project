'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryExplorerProps {
  categories: Category[];
  className?: string;
}

export function CategoryExplorer({
  categories,
  className,
}: CategoryExplorerProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  // Group categories by parent
  const groupedCategories = categories.reduce<Record<string, Category[]>>(
    (acc, category) => {
      const parentId = category.parentId || 'root';
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(category);
      return acc;
    },
    {}
  );
  
  // Root categories (no parent)
  const rootCategories = groupedCategories['root'] || [];
  
  // Toggle category expansion
  const toggleExpanded = (categoryId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };
  
  // Recursive category rendering
  const renderCategories = (categories: Category[], depth = 0) => {
    return categories.map((category) => {
      const hasChildren = groupedCategories[category.id]?.length > 0;
      const isExpanded = expanded[category.id];
      
      return (
        <div key={category.id}>
          <div
            className={cn(
              "flex items-center hover:bg-neutral-50 rounded-md transition-colors",
              depth > 0 ? "ml-4" : ""
            )}
          >
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 mr-1 rounded-md hover:bg-neutral-100"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                <ChevronIcon
                  className={cn(
                    "h-4 w-4 text-neutral-500 transition-transform",
                    isExpanded ? "transform rotate-90" : ""
                  )}
                />
              </button>
            )}
            
            <Link
              href={`/community/category/${category.id}`}
              className="flex-1 flex items-center py-2 px-3"
            >
              {category.icon && (
                <span
                  className="mr-2 text-neutral-500"
                  dangerouslySetInnerHTML={{ __html: category.icon }}
                ></span>
              )}
              <span className="font-medium text-neutral-900 hover:text-primary transition-colors">
                {category.name}
              </span>
              {category.postCount > 0 && (
                <span className="ml-2 text-xs text-neutral-500">
                  {category.postCount}
                </span>
              )}
            </Link>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="mt-1 border-l border-neutral-200 ml-3">
              {renderCategories(groupedCategories[category.id], depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };
  
  if (categories.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <p className="text-sm text-neutral-500">No categories available</p>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-medium">Categories</h3>
      
      <div className="space-y-1">
        {renderCategories(rootCategories)}
      </div>
      
      <Link
        href="/community/categories"
        className="block text-center text-sm text-primary hover:text-primary-dark font-medium"
      >
        View all categories
      </Link>
    </div>
  );
}

// Icon component
function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
