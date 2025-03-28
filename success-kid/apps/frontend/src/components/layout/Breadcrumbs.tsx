'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationContext } from '@/hooks/useNavigationContext';

interface BreadcrumbsProps {
  className?: string;
  showOnMobile?: boolean;
}

/**
 * Breadcrumbs - Navigation breadcrumbs component
 * Shows current location in the navigation hierarchy
 */
export function Breadcrumbs({ className, showOnMobile = false }: BreadcrumbsProps) {
  const { breadcrumbs } = useNavigationContext();
  
  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on the home page
  }
  
  return (
    <nav 
      className={cn(
        "flex py-3 px-1",
        !showOnMobile && "hidden md:flex",
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={breadcrumb.href} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />
              )}
              
              {isLast ? (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {breadcrumb.label}
                </span>
              ) : (
                <Link
                  href={breadcrumb.href}
                  className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary-400"
                >
                  {breadcrumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
