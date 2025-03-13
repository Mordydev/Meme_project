'use client';

import React, { useState } from 'react';
import { useCategories } from '@/hooks/queries/useCommunity';
import { Category } from '@/types';

interface CategorySelectorProps {
  onCategorySelect: (categoryId: string) => void;
  selectedCategoryId?: string;
  label?: string;
  required?: boolean;
}

/**
 * Component for selecting a category when creating or editing content
 */
export function CategorySelector({ 
  onCategorySelect, 
  selectedCategoryId,
  label = 'Category',
  required = true
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: categories = [], isLoading } = useCategories();
  
  // Get selected category
  const selectedCategory = selectedCategoryId 
    ? categories.find(c => c.id === selectedCategoryId) 
    : undefined;
  
  // Filter categories based on search
  const filteredCategories = searchQuery
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;
  
  const handleCategorySelect = (category: Category) => {
    onCategorySelect(category.id);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="text-sm font-medium flex items-center">
        {label}
        {required && <span className="text-alert ml-1">*</span>}
      </label>
      
      {/* Selected category display / trigger */}
      <div className="relative">
        <button
          type="button"
          className={`
            w-full flex items-center gap-3 px-3 py-2 text-left
            border rounded-md focus:outline-none focus:ring-2 focus:ring-primary
            ${selectedCategory ? 'bg-card' : 'bg-muted text-muted-foreground'} 
          `}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {selectedCategory ? (
            <>
              {/* Category icon + name */}
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </span>
              <span>{selectedCategory.name}</span>
            </>
          ) : (
            <span>Select a category</span>
          )}
          
          {/* Dropdown icon */}
          <span className="ml-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </span>
        </button>
        
        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-card rounded-md shadow-lg max-h-96 overflow-auto border">
            {/* Search input */}
            <div className="p-2 border-b sticky top-0 bg-card">
              <input
                type="text"
                className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            
            {/* Categories list */}
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin h-5 w-5 border-t-2 border-primary rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading categories...</p>
              </div>
            ) : filteredCategories.length > 0 ? (
              <ul className="py-2" role="listbox">
                {filteredCategories.map(category => (
                  <li
                    key={category.id}
                    role="option"
                    aria-selected={category.id === selectedCategoryId}
                    onClick={() => handleCategorySelect(category)}
                    className={`
                      px-3 py-2 cursor-pointer flex items-center gap-3
                      ${category.id === selectedCategoryId ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                    `}
                  >
                    {/* Category icon */}
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </span>
                    {category.name}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No categories found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategorySelector;
