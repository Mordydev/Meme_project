import React, { ButtonHTMLAttributes, ElementType, ReactNode, forwardRef } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button variants following the design system from the Frontend Guidelines
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-600 active:bg-primary-700",
        secondary: "bg-secondary text-black hover:bg-secondary-600 active:bg-secondary-700",
        outline: "border border-neutral-200 bg-transparent hover:bg-neutral-100 active:bg-neutral-200",
        ghost: "bg-transparent hover:bg-neutral-100 active:bg-neutral-200",
        link: "bg-transparent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps<C extends ElementType = "button"> extends 
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "as" | "className">,
  VariantProps<typeof buttonVariants> {
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
  as?: C;
}

type PolymorphicButtonProps<C extends ElementType> = ButtonProps<C> & 
  Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonProps<C>>;

export const Button = forwardRef(
  <C extends ElementType = "button">({
    children,
    variant,
    size,
    className,
    isLoading,
    disabled,
    as,
    ...props
  }: PolymorphicButtonProps<C>, ref: React.ForwardedRef<HTMLButtonElement>) => {
    const Component = as || "button";
    const buttonProps = {
      className: cn(buttonVariants({ variant, size }), className),
      disabled: disabled || isLoading,
      ref,
      ...props,
    };

    return (
      <Component {...buttonProps}>
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </Component>
    );
  }
);

Button.displayName = "Button";

export default Button;
