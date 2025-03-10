import React from 'react';

export interface ButtonProps {
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button is in loading state */
  isLoading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Button contents */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  onClick,
  children,
  className = '',
  ...props
}: ButtonProps) {
  // This is a basic implementation that will be refined with Tailwind classes
  // in the actual implementation
  return (
    <button
      className={`button button--${variant} button--${size} ${className}`}
      disabled={isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? <span>Loading...</span> : null}
      {children}
    </button>
  );
}
