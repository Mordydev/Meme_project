'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type ProfileTabType = 'posts' | 'achievements' | 'activity' | 'points' | 'connections';

export interface ProfileTabsProps {
  userId: string;
  defaultTab?: ProfileTabType;
  onTabChange?: (tab: ProfileTabType) => void;
  children?: React.ReactNode;
  className?: string;
}

interface TabDefinition {
  id: ProfileTabType;
  label: string;
}

/**
 * ProfileTabs - Tabbed navigation system for profile content
 * 
 * @component
 * @param userId - User identifier for fetching tab content
 * @param defaultTab - Initial tab selection
 * @param onTabChange - Handler for tab change events
 * @param children - Tab content (should be ProfileTabContent components)
 * @param className - Additional CSS classes
 */
export function ProfileTabs({
  userId,
  defaultTab = 'posts',
  onTabChange,
  children,
  className
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabType>(defaultTab);
  
  const tabs: TabDefinition[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'activity', label: 'Activity' },
    { id: 'points', label: 'Points History' },
    { id: 'connections', label: 'Connections' }
  ];
  
  const handleTabChange = (tab: ProfileTabType) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  
  // Update the URL with the active tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab]);
  
  // Check URL for tab parameter on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const tabParam = url.searchParams.get('tab') as ProfileTabType | null;
      
      if (tabParam && tabs.some(tab => tab.id === tabParam)) {
        setActiveTab(tabParam);
        if (onTabChange) {
          onTabChange(tabParam);
        }
      }
    }
  }, [onTabChange]);
  
  return (
    <div className={cn("mt-8", className)}>
      {/* Tab navigation */}
      <div className="border-b">
        <div className="flex space-x-8 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={cn(
                "pb-4 px-2 font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleTabChange(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab content */}
      <div className="mt-6">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          
          return React.cloneElement(child as React.ReactElement<ProfileTabContentProps>, {
            isActive: activeTab === (child.props as ProfileTabContentProps).tabId,
            userId
          });
        })}
      </div>
    </div>
  );
}

export interface ProfileTabContentProps {
  tabId: ProfileTabType;
  isActive?: boolean;
  userId?: string;
  children: React.ReactNode;
}

/**
 * ProfileTabContent - Container for individual tab content
 * 
 * @component
 * @param tabId - Tab identifier
 * @param isActive - Whether this tab is currently active
 * @param userId - User identifier for fetching tab content
 * @param children - Tab content
 */
export function ProfileTabContent({
  tabId,
  isActive = false,
  userId,
  children
}: ProfileTabContentProps) {
  if (!isActive) return null;
  
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      className="focus:outline-none"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
