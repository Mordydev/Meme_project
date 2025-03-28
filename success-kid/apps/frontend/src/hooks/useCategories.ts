import { useState, useEffect, useMemo } from 'react';
import { Category, CategoryMap } from '@/types/community';

// Mock data for development, will be replaced with API call
const mockCategories: Category[] = [
  {
    id: 'cat_general',
    name: 'General Discussion',
    description: 'Talk about anything related to Success Kid',
    icon: 'chat-bubble',
    postCount: 120
  },
  {
    id: 'cat_token',
    name: 'Token Talk',
    description: 'Discuss the SKC token and crypto topics',
    icon: 'coin',
    postCount: 85
  },
  {
    id: 'cat_memes',
    name: 'Memes & Media',
    description: 'Share fun memes and media content',
    icon: 'image',
    postCount: 200
  },
  {
    id: 'cat_success',
    name: 'Success Stories',
    description: 'Share your victories and achievements',
    icon: 'trophy',
    postCount: 75
  },
  {
    id: 'cat_strategy',
    name: 'Strategy & Ideas',
    description: 'Discuss strategies and share ideas',
    icon: 'lightbulb',
    postCount: 60
  },
  {
    id: 'cat_help',
    name: 'Help & Support',
    description: 'Get help with platform questions',
    icon: 'question-mark',
    postCount: 40
  },
  // Sub-categories
  {
    id: 'cat_token_price',
    name: 'Price Discussion',
    description: 'Discuss token price and market trends',
    icon: 'chart',
    parentId: 'cat_token',
    postCount: 45
  },
  {
    id: 'cat_token_tech',
    name: 'Technical Analysis',
    description: 'Technical analysis and charts',
    icon: 'line-chart',
    parentId: 'cat_token',
    postCount: 30
  }
];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Simulate API call with setTimeout
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        // In the future, this will be replaced with an actual API call
        // const response = await fetch('/api/categories');
        // const data = await response.json();
        
        // Using mock data for now
        setTimeout(() => {
          setCategories(mockCategories);
          setIsLoading(false);
        }, 300);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Organize categories into a map for easier access
  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as CategoryMap);
  }, [categories]);
  
  // Get root categories (those without a parentId)
  const rootCategories = useMemo(() => {
    return categories.filter(category => !category.parentId);
  }, [categories]);
  
  // Get child categories for a given parent
  const getChildCategories = (parentId: string) => {
    return categories.filter(category => category.parentId === parentId);
  };
  
  // Get a category by ID
  const getCategoryById = (id: string | undefined) => {
    if (!id) return null;
    return categoriesMap[id] || null;
  };
  
  return {
    categories,
    rootCategories,
    categoriesMap,
    getChildCategories,
    getCategoryById,
    isLoading,
    error
  };
}
