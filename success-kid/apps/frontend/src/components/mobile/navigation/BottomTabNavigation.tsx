'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TouchFeedback } from '../TouchFeedback';
import Link from 'next/link';

export interface NavigationTab {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
  disabled?: boolean;
  badge?: number | boolean;
}

export interface BottomTabNavigationProps {
  tabs: NavigationTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  showLabels?: boolean;
  className?: string;
  barClassName?: string;
  tabClassName?: string;
  fixed?: boolean;
}

/**
 * Mobile-optimized bottom tab navigation with touch feedback
 * and proper spacing for mobile devices.
 */
export const BottomTabNavigation: React.FC<BottomTabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  showLabels = true,
  className,
  barClassName,
  tabClassName,
  fixed = true,
}) => {
  // Get the maximum number of tabs we can display effectively
  const maxTabs = 5;
  const displayTabs = tabs.slice(0, maxTabs);
  
  // Handle tab selection
  const handleTabSelect = (tab: NavigationTab) => {
    if (tab.disabled) return;
    onTabChange?.(tab.id);
  };
  
  return (
    <div 
      className={cn(
        'mobile-bottom-navigation pb-safe',
        fixed && 'fixed bottom-0 left-0 right-0 z-50',
        className
      )}
    >
      <nav
        className={cn(
          'flex items-center bg-white border-t border-gray-200 h-16',
          'justify-around items-center',
          barClassName
        )}
        role="tablist"
        aria-label="Mobile navigation"
      >
        {displayTabs.map((tab) => (
          <Link
            href={tab.href}
            key={tab.id}
            onClick={(e) => {
              if (tab.disabled) {
                e.preventDefault();
                return;
              }
            }}
            className={cn(
              'w-full h-full',
              tab.disabled && 'pointer-events-none'
            )}
          >
            <TouchFeedback 
              effect="highlight"
              disabled={tab.disabled}
              onPress={() => handleTabSelect(tab)}
              className={cn(
                'flex flex-col items-center justify-center h-full w-full px-1',
                'relative',
                tab.id === activeTab ? 'text-primary-600' : 'text-gray-500',
                tab.disabled && 'opacity-50',
                tabClassName
              )}
              activeClassName="text-primary-600"
              role="tab"
              aria-selected={tab.id === activeTab}
              aria-disabled={tab.disabled}
            >
              {/* Icon */}
              <div className="relative">
                {tab.icon}
                
                {/* Badge */}
                {tab.badge && (
                  <span className={cn(
                    'absolute -top-1 -right-1 flex justify-center items-center',
                    typeof tab.badge === 'number' ? 'min-w-5 h-5 rounded-full text-xs bg-red-500 text-white' : 'w-2 h-2 rounded-full bg-red-500'
                  )}>
                    {typeof tab.badge === 'number' && tab.badge > 0 && (
                      <span>{tab.badge > 99 ? '99+' : tab.badge}</span>
                    )}
                  </span>
                )}
              </div>
              
              {/* Label */}
              {showLabels && (
                <span className={cn(
                  'text-xs mt-1 font-medium',
                  tab.id === activeTab ? 'text-primary-600' : 'text-gray-500'
                )}>
                  {tab.label}
                </span>
              )}
              
              {/* Active indicator */}
              {tab.id === activeTab && (
                <span className="absolute top-0 inset-x-0 h-0.5 bg-primary-600" aria-hidden="true" />
              )}
            </TouchFeedback>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default BottomTabNavigation;