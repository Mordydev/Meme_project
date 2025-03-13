'use client';

import React from 'react';
import { FilterDefinition, SearchFilters } from '@/hooks/search';

export interface FilterPanelProps {
  filterDefinitions: FilterDefinition[];
  activeFilters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  loading?: boolean;
  className?: string;
}

export function FilterPanel({
  filterDefinitions,
  activeFilters,
  onFilterChange,
  loading = false,
  className = ''
}: FilterPanelProps) {
  // Handle single filter change
  const handleFilterChange = (filterId: string, value: any) => {
    onFilterChange({
      ...activeFilters,
      [filterId]: value
    });
  };
  
  // Reset all filters
  const handleReset = () => {
    onFilterChange({});
  };
  
  // Count active filters
  const activeFilterCount = Object.keys(activeFilters).length;
  
  if (loading) {
    return (
      <div className={`space-y-4 rounded-lg border border-neutral-200 bg-background p-4 ${className}`}>
        <div className="flex animate-pulse flex-col space-y-3">
          <div className="h-5 w-1/2 rounded bg-neutral-200"></div>
          <div className="h-4 w-3/4 rounded bg-neutral-200"></div>
          <div className="h-4 w-2/3 rounded bg-neutral-200"></div>
          <div className="h-4 w-3/4 rounded bg-neutral-200"></div>
          <div className="mt-2 h-4 w-1/2 rounded bg-neutral-200"></div>
        </div>
      </div>
    );
  }
  
  if (filterDefinitions.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-4 rounded-lg border border-neutral-200 bg-background p-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <h3 className="font-medium">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-primary hover:underline"
          >
            Reset all
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {filterDefinitions.map((filter) => (
          <div key={filter.id} className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            
            {filter.type === 'select' && filter.options && (
              <select
                className="w-full rounded-md border border-neutral-200 p-2 text-sm"
                value={activeFilters[filter.id] || ''}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              >
                <option value="">All</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            {filter.type === 'multiselect' && filter.options && (
              <div className="space-y-1">
                {filter.options.map((option) => {
                  const isSelected = Array.isArray(activeFilters[filter.id])
                    ? activeFilters[filter.id]?.includes(option.value)
                    : false;
                  
                  return (
                    <div key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${filter.id}-${option.value}`}
                        checked={isSelected}
                        onChange={() => {
                          const currentValues = Array.isArray(activeFilters[filter.id])
                            ? [...activeFilters[filter.id]]
                            : [];
                          
                          const newValues = isSelected
                            ? currentValues.filter((v) => v !== option.value)
                            : [...currentValues, option.value];
                          
                          handleFilterChange(filter.id, newValues);
                        }}
                        className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`${filter.id}-${option.value}`}
                        className="ml-2 text-sm"
                      >
                        {option.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
            
            {filter.type === 'range' && filter.range && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={filter.range.min}
                    max={filter.range.max}
                    value={
                      activeFilters[filter.id]?.min !== undefined
                        ? activeFilters[filter.id].min
                        : ''
                    }
                    onChange={(e) => {
                      const min = e.target.value ? Number(e.target.value) : undefined;
                      const current = activeFilters[filter.id] || {};
                      handleFilterChange(filter.id, { ...current, min });
                    }}
                    placeholder="Min"
                    className="w-full rounded-md border border-neutral-200 p-2 text-sm"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    min={filter.range.min}
                    max={filter.range.max}
                    value={
                      activeFilters[filter.id]?.max !== undefined
                        ? activeFilters[filter.id].max
                        : ''
                    }
                    onChange={(e) => {
                      const max = e.target.value ? Number(e.target.value) : undefined;
                      const current = activeFilters[filter.id] || {};
                      handleFilterChange(filter.id, { ...current, max });
                    }}
                    placeholder="Max"
                    className="w-full rounded-md border border-neutral-200 p-2 text-sm"
                  />
                </div>
                <input
                  type="range"
                  min={filter.range.min}
                  max={filter.range.max}
                  step={(filter.range.max - filter.range.min) / 100}
                  value={
                    activeFilters[filter.id]?.min !== undefined
                      ? activeFilters[filter.id].min
                      : filter.range.min
                  }
                  onChange={(e) => {
                    const min = Number(e.target.value);
                    const current = activeFilters[filter.id] || {};
                    handleFilterChange(filter.id, { ...current, min });
                  }}
                  className="w-full"
                />
              </div>
            )}
            
            {filter.type === 'date' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={activeFilters[filter.id]?.start || ''}
                  onChange={(e) => {
                    const current = activeFilters[filter.id] || {};
                    handleFilterChange(filter.id, {
                      ...current,
                      start: e.target.value,
                    });
                  }}
                  className="w-full rounded-md border border-neutral-200 p-2 text-sm"
                />
                <span>to</span>
                <input
                  type="date"
                  value={activeFilters[filter.id]?.end || ''}
                  onChange={(e) => {
                    const current = activeFilters[filter.id] || {};
                    handleFilterChange(filter.id, {
                      ...current,
                      end: e.target.value,
                    });
                  }}
                  className="w-full rounded-md border border-neutral-200 p-2 text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {activeFilterCount > 0 && (
        <div className="border-t border-neutral-200 pt-2">
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([key, value]) => {
              // Find the filter definition
              const filterDef = filterDefinitions.find((f) => f.id === key);
              if (!filterDef) return null;
              
              // Format the filter value for display
              let displayValue = '';
              
              if (Array.isArray(value)) {
                // For multiselect filters
                displayValue = value
                  .map((v) => {
                    const option = filterDef.options?.find((o) => o.value === v);
                    return option?.label || v;
                  })
                  .join(', ');
              } else if (typeof value === 'object') {
                // For range or date filters
                if ('min' in value || 'max' in value) {
                  displayValue = [
                    value.min !== undefined ? value.min : 'Any',
                    value.max !== undefined ? value.max : 'Any',
                  ].join(' - ');
                } else if ('start' in value || 'end' in value) {
                  displayValue = [
                    value.start || 'Any',
                    value.end || 'Any',
                  ].join(' to ');
                }
              } else {
                // For select filters
                const option = filterDef.options?.find((o) => o.value === value);
                displayValue = option?.label || value;
              }
              
              return (
                <div
                  key={key}
                  className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm"
                >
                  <span className="mr-1 font-medium">{filterDef.label}:</span>
                  <span>{displayValue}</span>
                  <button
                    onClick={() => {
                      const newFilters = { ...activeFilters };
                      delete newFilters[key];
                      onFilterChange(newFilters);
                    }}
                    className="ml-1 rounded-full p-1 hover:bg-neutral-200"
                    aria-label={`Remove ${filterDef.label} filter`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
