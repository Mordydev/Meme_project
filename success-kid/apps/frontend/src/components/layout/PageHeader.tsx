'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * PageHeader - Consistent page headers across the platform
 * Supports title, subtitle, icon, and action buttons
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <motion.div 
      className={cn("mb-6 px-1", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          {icon && (
            <motion.div 
              className="mr-3 text-primary"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {icon}
            </motion.div>
          )}
          
          <div>
            <motion.h1 
              className="text-2xl font-semibold text-gray-900 dark:text-white"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {title}
            </motion.h1>
            
            {subtitle && (
              <motion.p 
                className="text-gray-500 dark:text-gray-400 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>
        
        {actions && (
          <motion.div 
            className="flex gap-2 items-center justify-end"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {actions}
          </motion.div>
        )}
      </div>
      
      {children && (
        <motion.div 
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

export default PageHeader;