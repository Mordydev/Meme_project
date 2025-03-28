'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  headerAction?: ReactNode;
  animate?: boolean;
  id?: string;
}

/**
 * SectionContainer - Content section divider with consistent styling
 * Can include a title, description, and action buttons
 */
export function SectionContainer({
  children,
  title,
  description,
  className,
  headerClassName,
  contentClassName,
  headerAction,
  animate = true,
  id
}: SectionContainerProps) {
  const containerContent = (
    <>
      {(title || description || headerAction) && (
        <div className={cn("mb-4 flex justify-between items-start", headerClassName)}>
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="ml-4 flex-shrink-0">{headerAction}</div>
          )}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </>
  );
  
  // Don't apply animations if not requested
  if (!animate) {
    return (
      <section id={id} className={cn("mb-6", className)}>
        {containerContent}
      </section>
    );
  }
  
  return (
    <motion.section
      id={id}
      className={cn("mb-6", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {containerContent}
    </motion.section>
  );
}

export default SectionContainer;