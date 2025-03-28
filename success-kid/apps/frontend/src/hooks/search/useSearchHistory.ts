import { useState, useEffect } from 'react';

const STORAGE_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Hook to manage search history in local storage
 */
export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Load search history from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error('Failed to load search history:', err);
      // If there's an error, reset the history
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);
  
  /**
   * Add a search query to history
   */
  const addToHistory = (query: string) => {
    if (!query || query.trim() === '') return;
    
    setSearchHistory((prev) => {
      // Create a new array without the current query (if it exists)
      const filteredHistory = prev.filter((item) => item !== query);
      
      // Add the query to the beginning of the array
      const newHistory = [query, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      }
      
      return newHistory;
    });
  };
  
  /**
   * Remove a specific query from history
   */
  const removeFromHistory = (query: string) => {
    setSearchHistory((prev) => {
      const newHistory = prev.filter((item) => item !== query);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      }
      
      return newHistory;
    });
  };
  
  /**
   * Clear all search history
   */
  const clearHistory = () => {
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };
  
  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
}
