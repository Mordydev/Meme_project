'use client';

import React, { useState, useRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useViewport } from '../MobileLayouts/ViewportContext';

export type KeyboardType = 
  | 'text' 
  | 'email' 
  | 'tel' 
  | 'url' 
  | 'numeric' 
  | 'decimal' 
  | 'search' 
  | 'none';

export type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url' 
  | 'search' 
  | 'date' 
  | 'time' 
  | 'datetime-local';

export interface TouchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'inputMode' | 'type'> {
  label: string;
  hint?: string;
  error?: string;
  type?: InputType;
  keyboardType?: KeyboardType;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  animateLabel?: boolean;
  showErrorMessage?: boolean;
  successMessage?: string;
  onClear?: () => void;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
  successClassName?: string;
  requiredIndicator?: boolean;
  touchFriendlyPadding?: boolean;
}

/**
 * A mobile-optimized text input component
 * 
 * @param label - Input label
 * @param hint - Helper text
 * @param error - Error message
 * @param type - Input type
 * @param keyboardType - Mobile keyboard type
 * @param fullWidth - Whether the input takes full width
 * @param leftIcon - Icon to display on the left
 * @param rightIcon - Icon to display on the right
 * @param clearable - Whether to show a clear button
 * @param animateLabel - Whether to animate the label
 * @param showErrorMessage - Whether to display error messages
 * @param successMessage - Success message to display
 * @param onClear - Callback when clear button is clicked
 * @param onLeftIconClick - Callback when left icon is clicked
 * @param onRightIconClick - Callback when right icon is clicked
 * @param wrapperClassName - Additional CSS classes for wrapper
 * @param labelClassName - Additional CSS classes for label
 * @param inputClassName - Additional CSS classes for input
 * @param hintClassName - Additional CSS classes for hint
 * @param errorClassName - Additional CSS classes for error
 * @param successClassName - Additional CSS classes for success
 * @param requiredIndicator - Whether to show a required indicator
 * @param touchFriendlyPadding - Whether to add extra padding for touch
 * @param ...props - Additional input props
 */
export const TouchInput = forwardRef<HTMLInputElement, TouchInputProps>(
  (
    {
      label,
      hint,
      error,
      type = 'text',
      keyboardType,
      fullWidth = true,
      leftIcon,
      rightIcon,
      clearable = false,
      animateLabel = true,
      showErrorMessage = true,
      successMessage,
      onClear,
      onLeftIconClick,
      onRightIconClick,
      className,
      wrapperClassName,
      labelClassName,
      inputClassName,
      hintClassName,
      errorClassName,
      successClassName,
      id,
      required,
      requiredIndicator = true,
      touchFriendlyPadding = true,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref || internalRef) as React.RefObject<HTMLInputElement>;
    const { isMobile } = useViewport();
    
    // Generate a unique ID for the input
    const inputId = id || `touch-input-${Math.random().toString(36).substring(2, 9)}`;
    
    // Determine appropriate keyboard type
    let inputMode: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    
    switch (keyboardType) {
      case 'email':
        inputMode = 'email';
        break;
      case 'tel':
        inputMode = 'tel';
        break;
      case 'url':
        inputMode = 'url';
        break;
      case 'numeric':
        inputMode = 'numeric';
        break;
      case 'decimal':
        inputMode = 'decimal';
        break;
      case 'search':
        inputMode = 'search';
        break;
      case 'none':
        inputMode = 'none';
        break;
      default:
        inputMode = 'text';
    }
    
    // Get appropriate HTML input type
    const inputType = type;
    
    // Handle focus change
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    };
    
    // Handle blur change
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      props.onBlur?.(e);
    };
    
    // Handle value change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };
    
    // Handle clear button click
    const handleClear = () => {
      if (inputRef.current) {
        inputRef.current.value = '';
        setHasValue(false);
        
        // Trigger change event
        const event = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(event);
        
        // Focus the input after clearing
        inputRef.current.focus();
        
        // Call custom onClear callback
        onClear?.();
      }
    };
    
    const isLabelFloating = animateLabel && (focused || hasValue);
    
    return (
      <div 
        className={cn(
          'touch-input relative',
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
          {required && requiredIndicator && (
            <span className="ml-1 text-alert">*</span>
          )}
        </motion.label>
        
        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2',
                onLeftIconClick && 'cursor-pointer'
              )}
              onClick={onLeftIconClick}
            >
              {leftIcon}
            </div>
          )}
          
          {/* Input element */}
          <input
            id={inputId}
            ref={inputRef}
            type={inputType}
            inputMode={inputMode}
            required={required}
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
              (rightIcon || (clearable && hasValue)) && 'pr-10',
              inputClassName
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            aria-invalid={!!error}
            {...(hint && !error && { 'aria-describedby': `${inputId}-hint` })}
            {...(error && { 'aria-describedby': `${inputId}-error` })}
            data-lpignore={type === 'password' ? 'true' : undefined}
            {...props}
          />
          
          {/* Right icon or clear button */}
          {(rightIcon || (clearable && hasValue)) && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                (clearable && hasValue) || onRightIconClick ? 'cursor-pointer' : ''
              )}
              onClick={clearable && hasValue ? handleClear : onRightIconClick}
            >
              {clearable && hasValue ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                rightIcon
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

TouchInput.displayName = 'TouchInput';
