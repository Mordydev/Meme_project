'use client';

import React, { useState } from 'react';
import { Category } from '@/types/community';
import { useCategories } from '@/hooks/useCategories';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CategorySelectorProps {
  initialValue?: string;
  onChange: (categoryId: string) => void;
  className?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export function CategorySelector({
  initialValue,
  onChange,
  className,
  label = 'Category',
  required = true,
  disabled = false,
  error
}: CategorySelectorProps) {
  const { categories, isLoading } = useCategories();
  const [value, setValue] = useState<string>(initialValue || '');
  
  // Group categories by parent/child
  const groupedCategories = React.useMemo(() => {
    const result: { parent: Category, children: Category[] }[] = [];
    
    // Get all root categories
    const rootCategories = categories.filter(cat => !cat.parentId);
    
    // For each root category, find its children
    rootCategories.forEach(parent => {
      const children = categories.filter(cat => cat.parentId === parent.id);
      result.push({ parent, children });
    });
    
    return result;
  }, [categories]);
  
  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onChange(newValue);
  };
  
  return (
    <div className={className}>
      {label && (
        <Label 
          htmlFor="category-selector" 
          className="mb-2 block"
        >
          {label}
          {required && <span className="text-alert ml-1">*</span>}
        </Label>
      )}
      
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="category-selector" className="w-full">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              Loading categories...
            </SelectItem>
          ) : (
            groupedCategories.map(group => (
              <React.Fragment key={group.parent.id}>
                {/* Parent category */}
                <SelectItem value={group.parent.id}>
                  {group.parent.name}
                </SelectItem>
                
                {/* Child categories (indented) */}
                {group.children.map(child => (
                  <SelectItem 
                    key={child.id} 
                    value={child.id}
                    className="pl-6" // Extra padding for indentation
                  >
                    {child.name}
                  </SelectItem>
                ))}
              </React.Fragment>
            ))
          )}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="mt-1 text-sm text-alert">{error}</p>
      )}
    </div>
  );
}
