import React from 'react';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption';
export type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type TypographyColor = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'muted';

export interface TypographyProps {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: TypographyColor;
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  weight = 'normal',
  color = 'default',
  className = '',
  children,
  as,
  ...props
}) => {
  const variantClasses = {
    h1: 'text-4xl font-heading leading-tight',
    h2: 'text-2xl font-heading leading-tight',
    h3: 'text-xl font-heading leading-tight',
    h4: 'text-lg font-heading leading-snug',
    body: 'text-base font-body leading-normal',
    'body-sm': 'text-sm font-body leading-normal',
    caption: 'text-xs font-body leading-normal',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const colorClasses = {
    default: 'text-gray-900',
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    error: 'text-error',
    muted: 'text-gray-500',
  };

  const Component = as || getDefaultComponent(variant);

  return (
    <Component
      className={`${variantClasses[variant]} ${weightClasses[weight]} ${colorClasses[color]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

function getDefaultComponent(variant: TypographyVariant): React.ElementType {
  switch (variant) {
    case 'h1':
      return 'h1';
    case 'h2':
      return 'h2';
    case 'h3':
      return 'h3';
    case 'h4':
      return 'h4';
    case 'caption':
      return 'span';
    default:
      return 'p';
  }
}

export default Typography; 