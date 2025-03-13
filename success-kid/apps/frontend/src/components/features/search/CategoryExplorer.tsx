'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/Spinner';

export interface Category {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  postCount: number;
  subcategories?: Category[];
}

export interface CategoryExplorerProps {
  className?: string;
}

export function CategoryExplorer({ className = '' }: CategoryExplorerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  
  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get<{ categories: Category[] }>('/api/v1/categories');
        setCategories(response.data.categories);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Handle category selection
  const handleCategoryClick = (category: Category) => {
    router.push(`/category/${category.id}`);
  };
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="rounded-md bg-alert/10 p-4 text-alert">
        <p>Error loading categories</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
  
  // Handle empty state
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-background p-6 text-center">
        <p className="text-neutral-500">No categories available</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onClick={() => handleCategoryClick(category)}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: Category;
  onClick: () => void;
}

function CategoryCard({ category, onClick }: CategoryCardProps) {
  return (
    <div
      className="cursor-pointer rounded-lg border border-neutral-200 bg-background p-4 transition-colors hover:bg-neutral-50"
      onClick={onClick}
    >
      <div className="flex items-start">
        {/* Category icon */}
        <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {category.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.iconUrl}
              alt=""
              className="h-6 w-6"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
          )}
        </div>
        
        <div>
          <h3 className="font-medium">{category.name}</h3>
          
          <div className="mt-1 text-sm text-neutral-500">
            {category.postCount.toLocaleString()} post{category.postCount !== 1 ? 's' : ''}
          </div>
          
          {category.description && (
            <p className="mt-2 text-sm text-neutral-700">{category.description}</p>
          )}
          
          {/* Subcategories if available */}
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-neutral-500">Subcategories:</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {category.subcategories.map((subcategory) => (
                  <span
                    key={subcategory.id}
                    className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs"
                  >
                    {subcategory.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
