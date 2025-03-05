import React from 'react';

export interface CardProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Optional card title
   */
  title?: string;
  /**
   * Whether to add padding inside the card
   */
  padded?: boolean;
  /**
   * Whether to add a border to the card
   */
  bordered?: boolean;
  /**
   * Whether to add a shadow to the card
   */
  shadowed?: boolean;
  /**
   * Optional CSS class names
   */
  className?: string;
}

/**
 * Card component for displaying content in a contained card format
 */
export const Card: React.FC<CardProps> = ({
  children,
  title,
  padded = true,
  bordered = false,
  shadowed = true,
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg';
  const paddingClass = padded ? 'p-6' : '';
  const borderClass = bordered ? 'border border-gray-200' : '';
  const shadowClass = shadowed ? 'shadow-md' : '';
  
  const classes = `${baseClasses} ${paddingClass} ${borderClass} ${shadowClass} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  );
};