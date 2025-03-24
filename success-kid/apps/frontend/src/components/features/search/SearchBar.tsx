'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  expanded?: boolean;
}

/**
 * SearchBar Component
 * Advanced search component with suggestions and animations
 */
export function SearchBar({
  className,
  placeholder = 'Search...',
  expanded = false
}: SearchBarProps) {
  // States
  const [isFocused, setIsFocused] = useState(expanded);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        if (!query) {
          setIsFocused(false);
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [query]);
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(!!value);
  };
  
  // Handle clearing the search
  const handleSearchClear = () => {
    setQuery('');
    setShowResults(false);
    inputRef.current?.focus();
  };
  
  return (
    <div className={cn("relative w-full", className)}>
      <motion.div 
        className="relative bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"
        animate={{
          boxShadow: isFocused 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
            : '0 0 0 0 rgba(0, 0, 0, 0)',
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center">
          <span className="absolute left-3 text-neutral-500 dark:text-neutral-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleSearchChange}
            onFocus={() => {
              setIsFocused(true);
              if (query) setShowResults(true);
            }}
            placeholder={placeholder}
            className="w-full h-10 px-10 bg-transparent border-none outline-none placeholder-neutral-500 dark:placeholder-neutral-400"
          />
          {query && (
            <button
              onClick={handleSearchClear}
              className="absolute right-3 text-neutral-500 dark:text-neutral-400"
              aria-label="Clear search"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Search Results</h3>
                <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-xs text-primary-500">
                  View all
                </Link>
              </div>
              
              {/* Recent searches */}
              <div className="mb-2">
                <h4 className="text-xs text-neutral-500 mb-1">Recent Searches</h4>
                <div className="space-y-1">
                  <button className="w-full text-left text-sm p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                    market cap
                  </button>
                  <button className="w-full text-left text-sm p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                    token price
                  </button>
                </div>
              </div>
              
              {/* Quick suggestions */}
              <div>
                <h4 className="text-xs text-neutral-500 mb-1">Suggestions</h4>
                <div className="space-y-1">
                  <Link 
                    href="/search?category=posts" 
                    className="block text-sm p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                  >
                    Posts containing "{query}"
                  </Link>
                  <Link 
                    href="/search?category=users" 
                    className="block text-sm p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                  >
                    Users matching "{query}"
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;