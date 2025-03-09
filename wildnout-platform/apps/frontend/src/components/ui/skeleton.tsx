import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the skeleton
   */
  width?: string;
  /**
   * Height of the skeleton
   */
  height?: string;
  /**
   * Make the skeleton a circle
   */
  circle?: boolean;
  /**
   * Make the skeleton pulse with animation
   * @default true
   */
  animate?: boolean;
}

/**
 * Skeleton component for loading states
 * Uses design system animation tokens
 */
function Skeleton({
  className,
  width,
  height,
  circle = false,
  animate = true,
  ...props
}: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div
      className={cn(
        "bg-zinc-800 relative overflow-hidden", 
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      style={{ 
        width, 
        height 
      }}
      {...props}
    >
      {animate && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent"
          animate={{ x: ["0%", "50%", "100%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
    </div>
  );
}

export { Skeleton }
