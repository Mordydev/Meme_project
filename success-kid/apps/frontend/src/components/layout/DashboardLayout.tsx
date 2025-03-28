'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ContentContainer } from './ContentContainer';
import { PageHeader } from './PageHeader';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  headerContent?: ReactNode;
  fullWidth?: boolean;
  padded?: boolean;
  bordered?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  animate?: boolean;
}

/**
 * DashboardLayout - Default authenticated layout for standard dashboard pages
 * Combines PageHeader and ContentContainer with consistent styling
 */
export function DashboardLayout({
  children,
  title,
  subtitle,
  icon,
  actions,
  headerContent,
  fullWidth = false,
  padded = true,
  bordered = true,
  className,
  headerClassName,
  contentClassName,
  animate = true
}: DashboardLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page header with title, subtitle, and actions */}
      {(title || subtitle || actions || headerContent) && (
        <PageHeader
          title={title || ''}
          subtitle={subtitle}
          icon={icon}
          actions={actions}
          className={headerClassName}
        >
          {headerContent}
        </PageHeader>
      )}
      
      {/* Main content container */}
      <ContentContainer 
        fullWidth={fullWidth}
        padded={padded}
        bordered={bordered}
        animate={animate}
        className={contentClassName}
      >
        {children}
      </ContentContainer>
    </div>
  );
}

export default DashboardLayout;