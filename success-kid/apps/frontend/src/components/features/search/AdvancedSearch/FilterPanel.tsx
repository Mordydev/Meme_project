'use client';

import React, { useState, useEffect } from 'react';
import { SearchFilters, FilterGroup } from '@/types';
import { useSearchFilters } from '@/hooks/queries/useSearch';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  className?: string;
}

export function FilterPanel({
  filters,
  onChange,
  className,
}: FilterPanelProps) {
  // Fetch available filters from the API
  const { data: availableFilters, isLoading } = useSearchFilters();
  
  // Custom filters that are not managed by the backend
  const customFilters: FilterGroup[] = [
    {
      id: 'exactMatch',
      label: 'Exact Match',
      type: 'select',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
    {
      id: 'includeComments',
      label: 'Include Comments',
      type: 'select',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
  ];
  
  // All filters to display (combine API filters and custom filters)
  const allFilters = [
    ...(availableFilters || []),
    ...customFilters,
  ];
  
  // Handle filter change
  const handleFilterChange = (
    filterId: string,
    value: string | string[] | number | boolean | null
  ): void => {
    // Update filters with the new value
    onChange({
      ...filters,
      [filterId]: value,
    });
  };
  
  // Render the filter control based on its type
  const renderFilterControl = (filter: FilterGroup) => {
    const currentValue = filters[filter.id];
    
    switch (filter.type) {
      case 'select':
        return (
          <select
            id={`filter-${filter.id}`}
            value={currentValue?.toString() || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value || null)}
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Any</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => {
              const isSelected = Array.isArray(currentValue) && currentValue.includes(option.value);
              
              return (
                <div key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`filter-${filter.id}-${option.value}`}
                    checked={isSelected}
                    onChange={(e) => {
                      const newValues = Array.isArray(currentValue) ? [...currentValue] : [];
                      
                      if (e.target.checked) {
                        newValues.push(option.value);
                      } else {
                        const index = newValues.indexOf(option.value);
                        if (index !== -1) {
                          newValues.splice(index, 1);
                        }
                      }
                      
                      handleFilterChange(filter.id, newValues.length > 0 ? newValues : null);
                    }}
                    className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor={`filter-${filter.id}-${option.value}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        );
      
      case 'range':
        const rangeValue = typeof currentValue === 'number' ? currentValue : filter.range?.min || 0;
        
        return (
          <div className="space-y-2">
            <input
              type="range"
              id={`filter-${filter.id}`}
              min={filter.range?.min || 0}
              max={filter.range?.max || 100}
              value={rangeValue}
              onChange={(e) => handleFilterChange(filter.id, parseInt(e.target.value, 10))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{filter.range?.min || 0}</span>
              <span>{rangeValue}</span>
              <span>{filter.range?.max || 100}</span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-sm text-neutral-500 mt-1">Loading filters...</p>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-neutral-700">Additional Filters</h3>
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-xs text-primary hover:text-primary-dark"
        >
          Reset all
        </button>
      </div>
      
      <div className="space-y-6">
        {allFilters.length === 0 ? (
          <p className="text-sm text-neutral-500">No additional filters available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allFilters.map((filter) => (
              <div key={filter.id} className="space-y-1">
                <label
                  htmlFor={`filter-${filter.id}`}
                  className="block text-sm font-medium text-neutral-700"
                >
                  {filter.label}
                </label>
                {renderFilterControl(filter)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
