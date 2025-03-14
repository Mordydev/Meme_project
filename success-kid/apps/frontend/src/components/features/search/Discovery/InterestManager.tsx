'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface InterestManagerProps {
  allInterests: string[];
  activeInterests: string[];
  onChange: (interests: string[]) => void;
  className?: string;
}

export function InterestManager({
  allInterests,
  activeInterests,
  onChange,
  className,
}: InterestManagerProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    const newInterests = activeInterests.includes(interest)
      ? activeInterests.filter(i => i !== interest)
      : [...activeInterests, interest];
    
    onChange(newInterests);
  };
  
  // Clear all interests
  const clearInterests = () => {
    onChange([]);
  };
  
  // Select all interests
  const selectAllInterests = () => {
    onChange([...allInterests]);
  };
  
  // Determine which interests to display
  const displayInterests = showAll 
    ? allInterests 
    : allInterests.slice(0, 10);
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-neutral-700">Interests</h3>
        <div className="flex items-center space-x-2">
          {activeInterests.length > 0 && (
            <button
              onClick={clearInterests}
              className="text-xs text-primary hover:text-primary-dark"
            >
              Clear all
            </button>
          )}
          {allInterests.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-primary hover:text-primary-dark"
            >
              {showAll ? 'Show less' : 'Show all'}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {displayInterests.map((interest) => (
          <button
            key={interest}
            onClick={() => toggleInterest(interest)}
            className={cn(
              "px-3 py-1 rounded-full text-sm transition-colors",
              activeInterests.includes(interest)
                ? "bg-primary text-white"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            )}
            aria-pressed={activeInterests.includes(interest)}
          >
            {interest}
          </button>
        ))}
        
        {/* Show message if no interests available */}
        {allInterests.length === 0 && (
          <p className="text-sm text-neutral-500">
            No interests available. Start by engaging with content to receive personalized recommendations.
          </p>
        )}
      </div>
      
      {/* Info Text */}
      <p className="text-xs text-neutral-500">
        Select interests to personalize your discovery feed. We'll show you content related to your selected interests.
      </p>
    </div>
  );
}
