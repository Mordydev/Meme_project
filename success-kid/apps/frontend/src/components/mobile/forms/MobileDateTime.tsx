'use client';

import React, { useId, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { TouchFeedback } from '../TouchFeedback';

export type DateTimeMode = 'date' | 'time' | 'datetime';

export interface MobileDateTimeProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mode?: DateTimeMode;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
  min?: string;
  max?: string;
  step?: number;
}

/**
 * A mobile-optimized date and time picker component that uses the native
 * date/time inputs on mobile devices for the best user experience.
 */
export const MobileDateTime: React.FC<MobileDateTimeProps> = ({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder = '',
  error,
  hint,
  required = false,
  disabled = false,
  className,
  name,
  id: providedId,
  min,
  max,
  step,
}) => {
  const { isMobile } = useViewport();
  const generatedId = useId();
  const id = providedId || `mobile-datetime-${generatedId}`;
  const hintId = hint ? `hint-${id}` : undefined;
  const errorId = error ? `error-${id}` : undefined;
  
  const [displayValue, setDisplayValue] = useState('');
  
  // Format the display value for the user
  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      return;
    }
    
    try {
      const date = new Date(value);
      
      if (isNaN(date.getTime())) {
        setDisplayValue(value); // Fallback to raw value if invalid
        return;
      }
      
      // Format based on mode
      switch (mode) {
        case 'date':
          setDisplayValue(date.toLocaleDateString());
          break;
        case 'time':
          setDisplayValue(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          break;
        case 'datetime':
          setDisplayValue(date.toLocaleString());
          break;
        default:
          setDisplayValue(value);
      }
    } catch (e) {
      // Fallback to raw value in case of any error
      setDisplayValue(value);
    }
  }, [value, mode]);
  
  // Determine input type based on mode
  const getInputType = (): string => {
    switch (mode) {
      case 'date': return 'date';
      case 'time': return 'time';
      case 'datetime': return 'datetime-local';
      default: return 'text';
    }
  };
  
  return (
    <div 
      className={cn(
        'mobile-datetime-container relative',
        disabled && 'opacity-50',
        className
      )}
    >
      <label 
        htmlFor={id} 
        className={cn(
          'text-sm font-medium block transition-all duration-200 mb-1',
          error ? 'text-red-500' : 'text-gray-700'
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {isMobile ? (
          // Use native mobile inputs
          <input
            id={id}
            type={getInputType()}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
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
              'appearance-none'
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(hintId, errorId)}
          />
        ) : (
          // Use enhanced UI for desktop
          <TouchFeedback
            effect="highlight"
            disabled={disabled}
            className="w-full"
          >
            <div
              className={cn(
                // Base styles
                'flex items-center justify-between w-full rounded-md border px-4 py-3 text-base',
                // Min height for good touch target
                'min-h-[52px]',
                // Empty value styling
                !value && 'text-gray-400',
                // Error styles
                error ? 'border-red-500' : 'border-gray-300',
                // Animation
                'transition-all duration-150'
              )}
              onClick={() => {
                if (!disabled) {
                  // This will trigger the hidden input's click event
                  document.getElementById(`${id}-hidden`)?.click();
                }
              }}
            >
              <span>{displayValue || placeholder}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mode === 'time' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                )}
              </svg>
              
              {/* Hidden input for actual datetime handling */}
              <input
                id={`${id}-hidden`}
                type={getInputType()}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                className="sr-only"
                aria-hidden="true"
              />
            </div>
          </TouchFeedback>
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

export default MobileDateTime;