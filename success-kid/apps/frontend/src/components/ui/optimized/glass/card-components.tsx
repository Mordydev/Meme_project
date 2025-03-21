'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Glass-specific Card Header component - no borders
interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const GlassCardHeader = forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4", className)}
      {...props}
    />
  )
);
GlassCardHeader.displayName = "GlassCardHeader";

// Glass-specific Card Title component
interface GlassCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const GlassCardTitle = forwardRef<HTMLParagraphElement, GlassCardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold text-lg", className)}
      {...props}
    />
  )
);
GlassCardTitle.displayName = "GlassCardTitle";

// Glass-specific Card Description component
interface GlassCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const GlassCardDescription = forwardRef<HTMLParagraphElement, GlassCardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
);
GlassCardDescription.displayName = "GlassCardDescription";

// Glass-specific Card Content component
interface GlassCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const GlassCardContent = forwardRef<HTMLDivElement, GlassCardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4", className)}
      {...props}
    />
  )
);
GlassCardContent.displayName = "GlassCardContent";

// Glass-specific Card Footer component
interface GlassCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const GlassCardFooter = forwardRef<HTMLDivElement, GlassCardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4", className)}
      {...props}
    />
  )
);
GlassCardFooter.displayName = "GlassCardFooter";

// Export all components
export {
  GlassCardHeader as CardHeader,
  GlassCardTitle as CardTitle, 
  GlassCardDescription as CardDescription,
  GlassCardContent as CardContent,
  GlassCardFooter as CardFooter
};
