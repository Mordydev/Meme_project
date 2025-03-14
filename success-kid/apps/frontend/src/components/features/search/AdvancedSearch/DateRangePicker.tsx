'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  onChange: (dateRange: { start?: string; end?: string }) => void;
  startDate?: string;
  endDate?: string;
  className?: string;
}

export function DateRangePicker({
  onChange,
  startDate,
  endDate,
  className,
}: DateRangePickerProps) {
  // Track if the date range filter is enabled
  const [isEnabled, setIsEnabled] = useState(
    Boolean(startDate || endDate)
  );
  
  // Preset date range options
  const presetRanges = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last year', days: 365 },
  ];
  
  // Format a date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Handle preset range selection
  const handlePresetSelect = (days: number): void => {
    const end = new Date();
    const start = new Date();
    
    // If days is 0, it means "Today"
    if (days > 0) {
      start.setDate(start.getDate() - days);
    }
    
    onChange({
      start: formatDate(start),
      end: formatDate(end),
    });
    
    setIsEnabled(true);
  };
  
  // Handle custom date change
  const handleDateChange = (
    type: 'start' | 'end',
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    
    if (type === 'start') {
      onChange({
        start: value || undefined,
        end: endDate,
      });
    } else {
      onChange({
        start: startDate,
        end: value || undefined,
      });
    }
  };
  
  // Clear date range
  const clearDateRange = (): void => {
    onChange({ start: undefined, end: undefined });
    setIsEnabled(false);
  };
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-neutral-700">
          Date Range
        </label>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enable-date-range"
            checked={isEnabled}
            onChange={(e) => {
              setIsEnabled(e.target.checked);
              if (!e.target.checked) {
                clearDateRange();
              }
            }}
            className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
          />
          <label htmlFor="enable-date-range" className="ml-2 text-sm text-neutral-700">
            Filter by date
          </label>
        </div>
      </div>
      
      {isEnabled && (
        <>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {presetRanges.map((range) => (
              <button
                key={range.label}
                type="button"
                onClick={() => handlePresetSelect(range.days)}
                className="px-3 py-1 rounded-full text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              >
                {range.label}
              </button>
            ))}
            <button
              type="button"
              onClick={clearDateRange}
              className="px-3 py-1 rounded-full text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            >
              Clear
            </button>
          </div>
          
          {/* Custom date inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date-range-start" className="block text-sm text-neutral-700 mb-1">
                From
              </label>
              <input
                id="date-range-start"
                type="date"
                value={startDate || ''}
                onChange={(e) => handleDateChange('start', e)}
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="date-range-end" className="block text-sm text-neutral-700 mb-1">
                To
              </label>
              <input
                id="date-range-end"
                type="date"
                value={endDate || ''}
                onChange={(e) => handleDateChange('end', e)}
                max={new Date().toISOString().split('T')[0]}
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          {/* Active date range display */}
          {(startDate || endDate) && (
            <div className="text-sm text-neutral-600 flex justify-between items-center mt-1">
              <span>
                {startDate && endDate
                  ? `Showing results from ${startDate} to ${endDate}`
                  : startDate
                  ? `Showing results from ${startDate}`
                  : endDate
                  ? `Showing results until ${endDate}`
                  : ''}
              </span>
              <button
                type="button"
                onClick={clearDateRange}
                className="text-primary hover:text-primary-dark text-xs"
              >
                Clear
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
