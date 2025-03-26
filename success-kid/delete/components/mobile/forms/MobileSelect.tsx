'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { TouchFeedback } from '../TouchFeedback';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MobileSelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
  fullscreenOnMobile?: boolean;
}

/**
 * A mobile-optimized select component that provides a touch-friendly
 * interface for selection on mobile devices.
 */
export const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  hint,
  required = false,
  disabled = false,
  className,
  name,
  id: providedId,
  fullscreenOnMobile = true,
}) => {
  const { isMobile } = useViewport();
  const generatedId = useId();
  const id = providedId || `mobile-select-${generatedId}`;
  const hintId = hint ? `hint-${id}` : undefined;
  const errorId = error ? `error-${id}` : undefined;
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  
  // Update the selected label when value changes
  useEffect(() => {
    const option = options.find(opt => opt.value === value);
    setSelectedLabel(option?.label || '');
  }, [value, options]);
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Handle option selection
  const handleOptionSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };
  
  // Handle dropdown toggle
  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };
  
  return (
    <div 
      className={cn(
        'mobile-select-container relative',
        disabled && 'opacity-50',
        className
      )}
      ref={selectRef}
    >
      <label 
        htmlFor={id} 
        className={cn(
          'text-sm font-medium block transition-all duration-200 mb-1',
          isOpen ? 'text-primary-500' : 'text-gray-700',
          error && 'text-red-500'
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <TouchFeedback
        effect="highlight"
        disabled={disabled}
        onPress={toggleDropdown}
        className="w-full"
      >
        <div
          id={id}
          role="combobox"
          aria-controls={`${id}-listbox`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={disabled}
          aria-required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(hintId, errorId)}
          className={cn(
            // Base styles
            'flex items-center justify-between w-full rounded-md border px-4 py-3 text-base text-gray-900',
            // Min height for good touch target
            'min-h-[52px]',
            // Focus styles
            isOpen && 'ring-2 ring-primary-500 border-primary-500',
            // Error styles
            error ? 'border-red-500' : 'border-gray-300',
            // Animation
            'transition-all duration-150',
            // For touch targets
            'cursor-pointer'
          )}
          data-value={value}
        >
          <span className={cn(
            !selectedLabel && 'text-gray-400',
            'truncate'
          )}>
            {selectedLabel || placeholder}
          </span>
          
          {/* Dropdown icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "h-5 w-5 text-gray-400",
              isOpen && "transform rotate-180"
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </TouchFeedback>
      
      {/* Hint text */}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      {/* Error message */}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
      
      {/* Options dropdown/modal */}
      {isOpen && (
        <div 
          className={cn(
            isMobile && fullscreenOnMobile 
              ? 'fixed inset-0 bg-white z-50' // Fullscreen on mobile
              : 'absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg',
            'max-h-[60vh] overflow-auto'
          )}
          role="listbox"
          id={`${id}-listbox`}
          aria-labelledby={id}
        >
          {/* Header for mobile fullscreen mode */}
          {isMobile && fullscreenOnMobile && (
            <div className="p-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
              <h3 className="text-lg font-medium">{label}</h3>
              <TouchFeedback 
                effect="highlight" 
                onPress={() => setIsOpen(false)}
                className="rounded-full p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </TouchFeedback>
            </div>
          )}
          
          {/* Options list */}
          <ul className="py-1">
            {options.map((option) => (
              <li key={option.value}>
                <TouchFeedback
                  effect="highlight"
                  disabled={option.disabled}
                  onPress={() => handleOptionSelect(option)}
                  className={cn(
                    'px-4 py-3 text-base',
                    option.value === value ? 'bg-primary-50 text-primary-700' : 'text-gray-900',
                    option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    isMobile && 'min-h-[52px]' // Larger touch target on mobile
                  )}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{option.label}</span>
                    {option.value === value && (
                      <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </TouchFeedback>
              </li>
            ))}
            
            {/* Empty state if no options */}
            {options.length === 0 && (
              <li className="px-4 py-3 text-gray-500 text-center">
                No options available
              </li>
            )}
          </ul>
        </div>
      )}
      
      {/* Native select for accessibility and form submission */}
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MobileSelect;