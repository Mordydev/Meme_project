'use client';

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from '../MobileLayouts/ViewportContext';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface MobileSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  animateLabel?: boolean;
  showErrorMessage?: boolean;
  successMessage?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
  successClassName?: string;
  nativeSelectOnMobile?: boolean;
  showSelectedIcon?: boolean;
  groupBy?: (option: SelectOption) => string;
  touchFriendlyPadding?: boolean;
}

/**
 * A mobile-optimized select component
 * 
 * @param label - Input label
 * @param options - Select options
 * @param onChange - Callback when selection changes
 * @param hint - Helper text
 * @param error - Error message
 * @param fullWidth - Whether the select takes full width
 * @param leftIcon - Icon to display on the left
 * @param animateLabel - Whether to animate the label
 * @param showErrorMessage - Whether to display error messages
 * @param successMessage - Success message to display
 * @param wrapperClassName - Additional CSS classes for wrapper
 * @param labelClassName - Additional CSS classes for label
 * @param selectClassName - Additional CSS classes for select
 * @param hintClassName - Additional CSS classes for hint
 * @param errorClassName - Additional CSS classes for error
 * @param successClassName - Additional CSS classes for success
 * @param nativeSelectOnMobile - Whether to use native select on mobile
 * @param showSelectedIcon - Whether to show an icon for the selected option
 * @param groupBy - Function to group options
 * @param touchFriendlyPadding - Whether to add extra padding for touch
 * @param ...props - Additional select props
 */
export const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
  (
    {
      label,
      options,
      onChange,
      hint,
      error,
      fullWidth = true,
      leftIcon,
      animateLabel = true,
      showErrorMessage = true,
      successMessage,
      className,
      wrapperClassName,
      labelClassName,
      selectClassName,
      hintClassName,
      errorClassName,
      successClassName,
      id,
      value,
      defaultValue,
      required,
      disabled,
      nativeSelectOnMobile = true,
      showSelectedIcon = false,
      groupBy,
      touchFriendlyPadding = true,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value || !!defaultValue);
    const [selectedValue, setSelectedValue] = useState<string>(
      (value || defaultValue || '') as string
    );
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { isMobile } = useViewport();
    
    // Generate a unique ID for the select
    const selectId = id || `mobile-select-${Math.random().toString(36).substring(2, 9)}`;
    
    // Get selected option label
    const getSelectedLabel = () => {
      const selectedOption = options.find(opt => opt.value === selectedValue);
      return selectedOption ? selectedOption.label : '';
    };
    
    // Update state when value prop changes
    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value as string);
        setHasValue(!!value);
      }
    }, [value]);
    
    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);
    
    // Handle focus change
    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    };
    
    // Handle blur change
    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setFocused(false);
      props.onBlur?.(e);
    };
    
    // Handle value change
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      setSelectedValue(newValue);
      setHasValue(!!newValue);
      onChange?.(newValue);
    };
    
    // Handle custom dropdown option click
    const handleOptionClick = (optionValue: string) => {
      if (disabled) return;
      
      setSelectedValue(optionValue);
      setHasValue(!!optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    };
    
    // Toggle custom dropdown
    const toggleDropdown = () => {
      if (disabled) return;
      setIsOpen(prev => !prev);
    };
    
    const isLabelFloating = animateLabel && (focused || hasValue);
    
    // Group options if groupBy function is provided
    const groupedOptions = groupBy
      ? options.reduce<Record<string, SelectOption[]>>((groups, option) => {
          const group = groupBy(option);
          groups[group] = groups[group] || [];
          groups[group].push(option);
          return groups;
        }, {})
      : null;
    
    // Use native select on mobile if specified
    if (isMobile && nativeSelectOnMobile) {
      return (
        <div 
          className={cn(
            'mobile-select relative',
            fullWidth && 'w-full',
            wrapperClassName
          )}
        >
          {/* Label */}
          <motion.label
            htmlFor={selectId}
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
          
          {/* Select container */}
          <div className="relative">
            {/* Left icon */}
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {leftIcon}
              </div>
            )}
            
            {/* Select element */}
            <select
              id={selectId}
              ref={ref}
              value={selectedValue}
              required={required}
              disabled={disabled}
              className={cn(
                'block w-full appearance-none',
                'rounded-md border',
                'bg-transparent',
                'focus:outline-none focus:ring-2',
                error
                  ? 'border-alert focus:ring-alert/20'
                  : successMessage
                  ? 'border-accent focus:ring-accent/20'
                  : 'border-neutral-300 focus:ring-primary/20',
                'transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                touchFriendlyPadding ? 'py-4' : 'py-2',
                'px-4',
                leftIcon && 'pl-10',
                'pr-10',
                selectClassName
              )}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              aria-invalid={!!error}
              {...(hint && !error && { 'aria-describedby': `${selectId}-hint` })}
              {...(error && { 'aria-describedby': `${selectId}-error` })}
              {...props}
            >
              {!props.multiple && !required && (
                <option value="">Select...</option>
              )}
              
              {groupBy ? (
                // Render grouped options
                Object.entries(groupedOptions!).map(([group, groupOptions]) => (
                  <optgroup key={group} label={group}>
                    {groupOptions.map(option => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              ) : (
                // Render flat options
                options.map(option => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))
              )}
            </select>
            
            {/* Down arrow icon */}
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          
          {/* Hint text or error message */}
          {(hint || error || successMessage) && (
            <div className="mt-1">
              {hint && !error && !successMessage && (
                <p
                  id={`${selectId}-hint`}
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
                  id={`${selectId}-error`}
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
    
    // Custom select for desktop or when native is disabled
    return (
      <div 
        className={cn(
          'mobile-select relative',
          fullWidth && 'w-full',
          wrapperClassName
        )}
        ref={dropdownRef}
      >
        {/* Hidden native select for form submission */}
        <select
          id={selectId}
          ref={ref}
          value={selectedValue}
          required={required}
          disabled={disabled}
          className="sr-only"
          onChange={handleChange}
          {...props}
        >
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Label */}
        <motion.label
          htmlFor={selectId}
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
        
        {/* Custom select button */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {leftIcon}
            </div>
          )}
          
          {/* Custom select trigger */}
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between',
              'rounded-md border',
              'bg-transparent',
              'focus:outline-none focus:ring-2',
              error
                ? 'border-alert focus:ring-alert/20'
                : successMessage
                ? 'border-accent focus:ring-accent/20'
                : 'border-neutral-300 focus:ring-primary/20',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              touchFriendlyPadding ? 'py-4' : 'py-2',
              'px-4',
              leftIcon && 'pl-10',
              isOpen ? 'border-primary' : '',
              selectClassName
            )}
            onClick={toggleDropdown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={selectId}
            disabled={disabled}
          >
            <span className={!hasValue ? 'text-neutral-400' : ''}>
              {hasValue ? getSelectedLabel() : 'Select...'}
            </span>
            
            {/* Down arrow icon */}
            <svg
              className={cn(
                'h-5 w-5 text-neutral-500 transition-transform',
                isOpen && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          
          {/* Dropdown panel */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute z-50 w-full',
                  'mt-1 max-h-60 overflow-auto',
                  'rounded-md border border-neutral-200',
                  'bg-background shadow-lg'
                )}
                role="listbox"
              >
                {groupBy ? (
                  // Render grouped options
                  Object.entries(groupedOptions!).map(([group, groupOptions]) => (
                    <div key={group}>
                      <div className="bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-500">
                        {group}
                      </div>
                      {groupOptions.map(option => (
                        <div
                          key={option.value}
                          className={cn(
                            'flex items-center px-3 py-2',
                            'cursor-pointer',
                            option.disabled && 'opacity-50 cursor-not-allowed',
                            selectedValue === option.value
                              ? 'bg-primary-50 text-primary'
                              : 'hover:bg-neutral-50'
                          )}
                          onClick={() => !option.disabled && handleOptionClick(option.value)}
                          role="option"
                          aria-selected={selectedValue === option.value}
                        >
                          {option.icon && <span className="mr-2">{option.icon}</span>}
                          {option.label}
                          {showSelectedIcon && selectedValue === option.value && (
                            <svg
                              className="ml-auto h-5 w-5 text-primary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  // Render flat options
                  options.map(option => (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center px-3 py-2',
                        'cursor-pointer',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        selectedValue === option.value
                          ? 'bg-primary-50 text-primary'
                          : 'hover:bg-neutral-50'
                      )}
                      onClick={() => !option.disabled && handleOptionClick(option.value)}
                      role="option"
                      aria-selected={selectedValue === option.value}
                    >
                      {option.icon && <span className="mr-2">{option.icon}</span>}
                      {option.label}
                      {showSelectedIcon && selectedValue === option.value && (
                        <svg
                          className="ml-auto h-5 w-5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Hint text or error message */}
        {(hint || error || successMessage) && (
          <div className="mt-1">
            {hint && !error && !successMessage && (
              <p
                id={`${selectId}-hint`}
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
                id={`${selectId}-error`}
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

MobileSelect.displayName = 'MobileSelect';
