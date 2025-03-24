'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { Breadcrumbs } from './Breadcrumbs';

interface PageTitleProps {
  title?: string;
  description?: string;
  className?: string;
  showBreadcrumbs?: boolean;
  actions?: React.ReactNode;
}

/**
 * PageTitle - Consistent page title component with optional description and breadcrumbs
 * Used at the top of pages to provide context and navigation
 */
export function PageTitle({
  title,
  description,
  className,
  showBreadcrumbs = true,
  actions
}: PageTitleProps) {
  const { breadcrumbs } = useNavigationContext();
  
  // Use last breadcrumb as title if not provided
  const derivedTitle = title || (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : '');
  
  return (
    <div className={cn("mb-6", className)}>
      {showBreadcrumbs && <Breadcrumbs />}
      
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {derivedTitle}
          </h1>
          
          {description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
