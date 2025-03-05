import React from 'react';

export interface HeadingProps {
  /**
   * Heading content
   */
  children: React.ReactNode;
  /**
   * Heading level (h1-h6)
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Optional subheading text
   */
  subheading?: string;
  /**
   * Whether the heading is centered
   */
  centered?: boolean;
  /**
   * Optional CSS class names
   */
  className?: string;
}

/**
 * Typography component for consistent heading styles
 */
export const Heading: React.FC<HeadingProps> = ({
  children,
  level = 2,
  subheading,
  centered = false,
  className = '',
  ...props
}) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const sizeClasses = {
    1: 'text-4xl font-bold',
    2: 'text-3xl font-semibold',
    3: 'text-2xl font-semibold',
    4: 'text-xl font-semibold',
    5: 'text-lg font-medium',
    6: 'text-base font-medium',
  };
  
  const alignClass = centered ? 'text-center' : '';
  const classes = `font-heading ${sizeClasses[level]} ${alignClass} ${className}`;
  
  return (
    <div {...props}>
      <HeadingTag className={classes}>{children}</HeadingTag>
      {subheading && (
        <p className={`mt-2 text-gray-600 ${centered ? 'text-center' : ''} ${level <= 2 ? 'text-lg' : 'text-base'}`}>
          {subheading}
        </p>
      )}
    </div>
  );
};