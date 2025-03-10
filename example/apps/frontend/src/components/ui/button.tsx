'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flow-blue focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-battle-yellow text-wild-black hover:bg-battle-yellow/90 active:scale-[0.98]",
        secondary: "bg-flow-blue text-hype-white hover:bg-flow-blue/90 active:scale-[0.98]",
        destructive: "bg-roast-red text-hype-white hover:bg-roast-red/90 active:scale-[0.98]",
        outline: "border border-battle-yellow text-battle-yellow hover:bg-battle-yellow/10",
        ghost: "hover:bg-hype-white/10 text-hype-white",
        link: "text-battle-yellow underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-6 text-lg rounded-md",
        icon: "h-10 w-10 rounded-full p-0",
      },
      animation: {
        none: "",
        bounce: "hover:animate-[bounce_0.5s_var(--easing-bounce)]",
        pulse: "hover:animate-pulse",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      animation: "none",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animation, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, animation }), className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        style={{
          // Apply animation timings from CSS variables
          transitionDuration: 'var(--duration-standard)',
          transitionTimingFunction: 'var(--easing-standard)'
        }}
        {...props}
      >
        {isLoading && (
          <svg 
            className="mr-2 h-4 w-4 animate-spin" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
