import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <textarea
          className={cn(
            "flex min-h-20 w-full rounded-md border bg-zinc-900/70 px-3 py-2 text-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flow-blue disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea"

export { Textarea }
