import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-zinc-800 text-hype-white",
        primary: "bg-battle-yellow/20 text-battle-yellow",
        secondary: "bg-flow-blue/20 text-flow-blue",
        success: "bg-victory-green/20 text-victory-green",
        destructive: "bg-roast-red/20 text-roast-red",
        outline: "border border-zinc-700 text-zinc-400",
      },
      size: {
        default: "text-xs",
        sm: "text-[10px] px-2 py-0.5",
        lg: "text-sm px-3 py-1"
      },
      animation: {
        none: "",
        pulse: "animate-pulse-glow",
        blinking: "animate-[pulse_1s_infinite]"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none"
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, animation, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, animation }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
