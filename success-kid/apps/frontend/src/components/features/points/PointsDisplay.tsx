'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCompactNumber } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface PointsDisplayProps {
  points: number;
  label?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'highlight';
  animated?: boolean;
}

/**
 * PointsDisplay - A component to display Success Points
 * 
 * @param points - The number of points to display
 * @param label - Optional label text (default: 'Success Points')
 * @param className - Optional additional CSS classes
 * @param variant - Visual style variant (default: 'default')
 * @param animated - Whether to animate points on mount and update
 */
export function PointsDisplay({ 
  points, 
  label = 'Success Points', 
  className,
  variant = 'default',
  animated = true 
}: PointsDisplayProps) {
  // Determine the appropriate styling based on variant
  const cardStyles = cn(
    variant === 'highlight' && 'border-secondary bg-secondary/10',
    variant === 'compact' && 'p-2',
    className
  );
  
  // Format points number - use compact format for large numbers
  const formattedPoints = formatCompactNumber(points);
  
  // Content for the card based on variant
  const content = (
    <div className="flex items-center gap-4">
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full",
        variant === 'highlight' ? "bg-secondary/20" : "bg-primary/20"
      )}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={cn(
            "h-6 w-6",
            variant === 'highlight' ? "text-secondary" : "text-primary"
          )}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
      <div>
        <p className={cn(
          "text-sm font-medium text-muted-foreground",
          variant === 'compact' && "text-xs"
        )}>
          {label}
        </p>
        
        {animated ? (
          <motion.p 
            key={points} // Change key to trigger animation when points change
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "font-mono font-bold",
              variant === 'highlight' ? "text-secondary" : "text-foreground",
              variant === 'compact' ? "text-xl" : "text-2xl"
            )}
          >
            {formattedPoints}
          </motion.p>
        ) : (
          <p className={cn(
            "font-mono font-bold",
            variant === 'highlight' ? "text-secondary" : "text-foreground",
            variant === 'compact' ? "text-xl" : "text-2xl"
          )}>
            {formattedPoints}
          </p>
        )}
      </div>
    </div>
  );
  
  // For compact variant, return a simpler card
  if (variant === 'compact') {
    return (
      <Card className={cardStyles}>
        <CardContent className="p-2">
          {content}
        </CardContent>
      </Card>
    );
  }
  
  // Default and highlight variants
  return (
    <Card className={cardStyles}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {animated ? (
          <motion.div 
            key={points} // Change key to trigger animation when points change
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15 
            }}
            className="text-3xl font-mono font-bold"
          >
            {formattedPoints}
          </motion.div>
        ) : (
          <div className="text-3xl font-mono font-bold">
            {formattedPoints}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
