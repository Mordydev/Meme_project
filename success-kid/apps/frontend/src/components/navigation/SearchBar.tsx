'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { AnimateOnMount } from '@/components/ui/AnimateOnMount';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  onClose?: () => void;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Mock suggestions - in a real app, this would come from an API
  const getSuggestions = (input: string) => {
    if (!input.trim()) return [];
    
    // Demo suggestions
    const demoSuggestions = [
      'Success Points',
      'Leaderboard',
      'Wallet connection',
      'Token redemption',
      'Community posts',
      'Create content',
      'Achievement badges',
      'Market milestone'
    ];
    
    return demoSuggestions.filter(item => 
      item.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5);
  };

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Add escape key listener
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Update suggestions as the user types
  useEffect(() => {
    const debouncedGetSuggestions = setTimeout(() => {
      setSuggestions(getSuggestions(query));
    }, 200);

    return () => clearTimeout(debouncedGetSuggestions);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      if (onClose) onClose();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    if (onClose) onClose();
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && query.length > 0 && (
        <AnimateOnMount>
          <div className="absolute left-0 right-0 mt-1 rounded-md border border-border bg-card shadow-md">
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </AnimateOnMount>
      )}
    </div>
  );
}
