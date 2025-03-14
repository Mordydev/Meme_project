'use client';

import React, { useState, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';

export type InputType = 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'search';
export type KeyboardType = 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'search';

export interface TouchInputProps {
  type: InputType;
  label: string;
  value: string;
  onChange: (value: string) => void;
  keyboardType?: KeyboardType;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  pattern?: string;
  name?: string;
  id?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}

/**
 * A mobile-optimized input component with appropriate touch target sizes
 * and mobile keyboard type support.
 */
export const TouchInput: React.FC<TouchInputProps> = ({
  type,
  label,
  value,
  onChange,
  keyboardType = 'text',
  placeholder = '',
  error,
  hint,
  required = false,
  disabled = false,
  className,
  autoComplete,
  autoFocus = false,
  maxLength,
  pattern,
  name,
  id: providedId,
  min,
  max,
  step,
}) => {
  const generatedId = useId();
  const id = providedId || `touch-input-${generatedId}`;
  const hintId = hint ? `hint-${id}` : undefined;
  const errorId = error ? `error-${id}` : undefined;
  
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  
  // Update hasValue when value changes
  useEffect(() => {
    setHasValue(!!value);
  }, [value]);
  
  // Map keyboardType to inputMode
  const getInputMode = (): React.HTMLAttributes<HTMLInputElement>['inputMode'] => {
    switch (keyboardType) {
      case 'numeric': return 'numeric';
      case 'tel': return 'tel';
      case 'email': return 'email';
      case 'url': return 'url';
      case 'search': return 'search';
      default: return 'text';
    }
  };
  
  return (
    <div 
      className={cn(
        'touch-input-container relative',
        disabled && 'opacity-50',
        className
      )}
    >
      <label 
        htmlFor={id} 
        className={cn(
          'text-sm font-medium block transition-all duration-200 mb-1',
          isFocused ? 'text-primary-500' : 'text-gray-700',
          error && 'text-red-500'
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={getInputMode()}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          pattern={pattern}
          min={min}
          max={max}
          step={step}
          className={cn(
            // Base styles
            'block w-full rounded-md border px-4 py-3 text-base text-gray-900',
            // Min height for good touch target
            'min-h-[52px]',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            // Error styles
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25' : 'border-gray-300',
            // Animation
            'transition-all duration-150',
            // iOS appearance fix
            'appearance-none',
            // Extra spacing for clear button
            type === 'search' && 'pr-10'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(hintId, errorId)}
          data-lpignore="true" // Prevents LastPass from adding icons to fields
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {/* Clear button for search inputs */}
        {type === 'search' && hasValue && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            onClick={() => onChange('')}
            aria-label="Clear input"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
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
    </div>
  );
};

export default TouchInput;