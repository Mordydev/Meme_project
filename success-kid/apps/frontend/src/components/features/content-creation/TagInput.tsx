'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  suggestions?: string[];
}

export function TagInput({ 
  tags, 
  onChange, 
  maxTags = 10, 
  placeholder = 'Add tags...',
  suggestions = []
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return;
    
    // Don't add if already exists or at max tags
    if (tags.includes(trimmedTag) || tags.length >= maxTags) return;
    
    const newTags = [...tags, trimmedTag];
    onChange(newTags);
    setInputValue('');
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };
  
  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onChange(newTags);
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      
      if (activeSuggestion >= 0 && filteredSuggestions.length > 0) {
        // Add the selected suggestion
        addTag(filteredSuggestions[activeSuggestion]);
      } else {
        // Add the current input value
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove the last tag when backspace is pressed on empty input
      removeTag(tags.length - 1);
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      // Navigate down in suggestions
      setActiveSuggestion(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      // Navigate up in suggestions
      setActiveSuggestion(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Escape') {
      // Close suggestions
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };
  
  // Filter suggestions based on input
  const filteredSuggestions = suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) && 
      !tags.includes(suggestion.toLowerCase())
    )
    .slice(0, 5); // Limit to 5 suggestions
  
  return (
    <div className="space-y-2">
      <div 
        className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10 focus-within:ring-2 focus-within:ring-primary-200"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <div 
            key={index} 
            className="bg-gray-200 rounded-full px-3 py-1 text-sm flex items-center"
          >
            <span className="mr-1">#{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        <div className="relative flex-grow min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setActiveSuggestion(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delayed hide to allow clicking suggestions
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={handleKeyDown}
            className="w-full border-none p-1 focus:outline-none focus:ring-0 text-sm"
            placeholder={tags.length === 0 ? placeholder : ''}
            aria-label="Add tag"
          />
          
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border overflow-hidden">
              <ul className="py-1">
                {filteredSuggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    className={`
                      px-3 py-2 cursor-pointer text-sm hover:bg-gray-100
                      ${index === activeSuggestion ? 'bg-gray-100' : ''}
                    `}
                    onClick={() => addTag(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        {tags.length}/{maxTags} tags • Press Enter to add
      </p>
    </div>
  );
}
