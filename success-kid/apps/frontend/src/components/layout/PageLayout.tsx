'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  animate?: boolean;
}

/**
 * PageLayout - A consistent layout component for pages
 * 
 * @param title - Optional page title
 * @param description - Optional page description
 * @param children - Page content
 * @param className - Additional CSS classes
 * @param animate - Whether to animate the page entrance
 */
export function PageLayout({
  children,
  title,
  description,
  className,
  animate = true
}: PageLayoutProps) {
  const content = (
    <div className={cn(
      "container mx-auto px-4 py-6 md:py-8",
      className
    )}>
      {(title || description) && (
        <div className="mb-6 md:mb-8">
          {title && (
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-muted-foreground max-w-prose">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
  
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ 
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {content}
      </motion.div>
    );
  }
  
  return content;
}
