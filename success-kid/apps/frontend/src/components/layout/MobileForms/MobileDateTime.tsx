'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useViewport } from '../MobileLayouts/ViewportContext';

export type DateTimeType = 'date' | 'time' | 'datetime-local';

export interface MobileDateTimeProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  hint?: string;
  error?: string;
  type?: DateTimeType;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  animateLabel?: boolean;
  showErrorMessage?: boolean;
  successMessage?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
  successClassName?: string;
  touchFriendlyPadding?: boolean;
  nativeDatePickerOnMobile?: boolean;
  minDate?: Date | string;
  maxDate?: Date | string;
  dateFormat?: string;
  timeFormat?: string;
  onChange?: (value: string, date?: Date) => void;
}

/**
 * A mobile-optimized date/time picker component
 * 
 * @param label - Input label
 * @param hint - Helper text
 * @param error - Error message
 * @param type - Date input type
 * @param fullWidth - Whether the input takes full width
 * @param leftIcon - Icon to display on the left
 * @param animateLabel - Whether to animate the label
 * @param showErrorMessage - Whether to display error messages
 * @param successMessage - Success message to display
 * @param wrapperClassName - Additional CSS classes for wrapper
 * @param labelClassName - Additional CSS classes for label
 * @param inputClassName - Additional CSS classes for input
 * @param hintClassName - Additional CSS classes for hint
 * @param errorClassName - Additional CSS classes for error
 * @param successClassName - Additional CSS classes for success
 * @param touchFriendlyPadding - Whether to add extra padding for touch
 * @param nativeDatePickerOnMobile - Whether to use native date picker on mobile
 * @param minDate - Minimum selectable date
 * @param maxDate - Maximum selectable date
 * @param dateFormat - Format for displaying date (localized)
 * @param timeFormat - Format for displaying time (localized)
 * @param onChange - Callback when selection changes
 * @param ...props - Additional input props
 */
export const MobileDateTime = forwardRef<HTMLInputElement, MobileDateTimeProps>(
  (
    {
      label,
      hint,
      error,
      type = 'date',
      fullWidth = true,
      leftIcon,
      animateLabel = true,
      showErrorMessage = true,
      successMessage,
      className,
      wrapperClassName,
      labelClassName,
      inputClassName,
      hintClassName,
      errorClassName,
      successClassName,
      id,
      value,
      defaultValue,
      required,
      disabled,
      touchFriendlyPadding = true,
      nativeDatePickerOnMobile = true,
      minDate,
      maxDate,
      dateFormat = 'MMMM d, yyyy',
      timeFormat = 'h:mm a',
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value || !!defaultValue);
    const [inputValue, setInputValue] = useState<string>(
      (value || defaultValue || '') as string
    );
    const { isMobile } = useViewport();
    
    // Generate a unique ID for the input
    const inputId = id || `mobile-datetime-${Math.random().toString(36).substring(2, 9)}`;
    
    // Process min/max dates
    const minDateAttr = minDate
      ? typeof minDate === 'string'
        ? minDate
        : minDate.toISOString().split('T')[0]
      : undefined;
    
    const maxDateAttr = maxDate
      ? typeof maxDate === 'string'
        ? maxDate
        : maxDate.toISOString().split('T')[0]
      : undefined;
    
    // Update state when value prop changes
    useEffect(() => {
      if (value !== undefined) {
        setInputValue(value as string);
        setHasValue(!!value);
      }
    }, [value]);
    
    // Format the displayed date based on locale
    const formatDate = (dateString: string): string => {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return dateString;
        }
        
        if (type === 'date') {
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(date);
        } else if (type === 'time') {
          return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          }).format(date);
        } else {
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          }).format(date);
        }
      } catch (e) {
        return dateString;
      }
    };
    
    // Handle focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };
    
    // Handle blur
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    };
    
    // Handle value change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setHasValue(!!newValue);
      
      if (onChange) {
        try {
          const dateObj = newValue ? new Date(newValue) : undefined;
          onChange(newValue, dateObj);
        } catch (e) {
          onChange(newValue);
        }
      }
    };
    
    const isLabelFloating = animateLabel && (focused || hasValue);
    
    return (
      <div 
        className={cn(
          'mobile-datetime relative',
          fullWidth && 'w-full',
          wrapperClassName
        )}
      >
        {/* Label */}
        <motion.label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium',
            isLabelFloating
              ? 'absolute text-xs text-primary'
              : 'text-foreground',
            error && 'text-alert',
            labelClassName
          )}
          style={{
            transform: isLabelFloating ? 'translateY(-50%)' : 'translateY(0)',
            top: isLabelFloating ? '0' : '50%',
            left: leftIcon ? '2.5rem' : '1rem',
            transition: 'transform 0.2s, top 0.2s, font-size 0.2s',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {label}
          {required && <span className="ml-1 text-alert">*</span>}
        </motion.label>
        
        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {leftIcon}
            </div>
          )}
          
          {/* Input element */}
          <input
            id={inputId}
            ref={ref}
            type={isMobile && nativeDatePickerOnMobile ? type : 'text'}
            value={inputValue}
            required={required}
            disabled={disabled}
            className={cn(
              'block w-full',
              'rounded-md border',
              'bg-transparent',
              'focus:outline-none focus:ring-2',
              error
                ? 'border-alert focus:ring-alert/20'
                : successMessage
                ? 'border-accent focus:ring-accent/20'
                : 'border-neutral-300 focus:ring-primary/20',
              'transition-colors',
              'placeholder:text-neutral-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isMobile && touchFriendlyPadding && 'py-4',
              !isMobile && 'py-2',
              'px-4',
              leftIcon && 'pl-10',
              'pr-4',
              inputClassName
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            min={minDateAttr}
            max={maxDateAttr}
            aria-invalid={!!error}
            {...(hint && !error && { 'aria-describedby': `${inputId}-hint` })}
            {...(error && { 'aria-describedby': `${inputId}-error` })}
            // Use the date picker or calendar icon for non-mobile or when using custom datepicker
            onFocus={(e) => {
              handleFocus(e);
              if (!isMobile || !nativeDatePickerOnMobile) {
                // Set the type to the appropriate date type momentarily to show the date picker
                e.currentTarget.type = type;
              }
            }}
            onBlur={(e) => {
              handleBlur(e);
              if (!isMobile || !nativeDatePickerOnMobile) {
                e.currentTarget.type = 'text';
              }
            }}
            {...props}
          />
          
          {/* Calendar icon for non-mobile */}
          {(!isMobile || !nativeDatePickerOnMobile) && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {type === 'time' ? (
                <svg
                  className="h-5 w-5 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
        
        {/* Hint text or error message */}
        {(hint || error || successMessage) && (
          <div className="mt-1">
            {hint && !error && !successMessage && (
              <p
                id={`${inputId}-hint`}
                className={cn(
                  'text-xs text-neutral-500',
                  hintClassName
                )}
              >
                {hint}
              </p>
            )}
            
            {error && showErrorMessage && (
              <p
                id={`${inputId}-error`}
                className={cn(
                  'text-xs text-alert',
                  errorClassName
                )}
              >
                {error}
              </p>
            )}
            
            {successMessage && !error && (
              <p
                className={cn(
                  'text-xs text-accent',
                  successClassName
                )}
              >
                {successMessage}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

MobileDateTime.displayName = 'MobileDateTime';
