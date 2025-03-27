import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the DashboardHeader component
 */
export interface DashboardHeaderProps {
  /**
   * The title of the dashboard section
   */
  title: string;
  
  /**
   * Optional description of the dashboard section
   */
  description?: string;
  
  /**
   * Optional icon to display next to the title
   */
  icon?: ReactNode;
  
  /**
   * Optional actions to display on the right side of the header
   */
  actions?: ReactNode;
  
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * DashboardHeader component
 * 
 * Used as a consistent header for dashboard pages, showing a title,
 * optional description, icon, and action buttons.
 */
export function DashboardHeader({
  title,
  description,
  icon,
  actions,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row items-start justify-between gap-2',
      className
    )}>
      <div className="flex items-center">
        {icon && (
          <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex-shrink-0 sm:ml-auto mt-2 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
