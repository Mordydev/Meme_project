import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-zinc-900/70 px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flow-blue disabled:cursor-not-allowed disabled:opacity-50",
            error 
              ? "border-roast-red focus-visible:ring-roast-red" 
              : "border-zinc-700 focus-visible:border-flow-blue",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          style={{
            // Apply animation timings from CSS variables
            transitionDuration: 'var(--duration-quick)',
            transitionTimingFunction: 'var(--easing-standard)'
          }}
          {...props}
        />
        {error && (
          <p className="text-sm text-roast-red" role="alert">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
