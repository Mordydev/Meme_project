import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Make the skeleton pulse with animation
   * @default true
   */
  animate?: boolean
}

/**
 * Skeleton component for loading states
 */
function Skeleton({
  className,
  animate = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-zinc-800",
        animate && "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
