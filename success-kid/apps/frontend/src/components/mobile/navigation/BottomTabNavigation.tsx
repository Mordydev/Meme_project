'use client';

import React, { ReactNode } from 'react';
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
 * Mobile-optimized bottom tab navigation with direct styling
 */
export const BottomTabNavigation: React.FC<BottomTabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  showLabels = true,
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
      className="bottom-nav"
      style={{
        position: fixed ? 'fixed' : 'relative',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 50
      }}
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
            handleTabSelect(tab);
          }}
          className={`nav-item ${tab.id === activeTab ? 'active' : ''}`}
          style={{
            opacity: tab.disabled ? 0.5 : 1,
            color: tab.id === activeTab ? '#1E88E5' : '#6B7280',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            fontSize: '12px',
            padding: '4px 8px',
            width: '100%',
            textAlign: 'center'
          }}
        >
          {/* Icon */}
          <div style={{ position: 'relative' }}>
            {tab.icon}
            
            {/* Badge */}
            {tab.badge && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F44336',
                color: 'white',
                borderRadius: '9999px',
                ...(typeof tab.badge === 'number' 
                  ? { minWidth: '20px', height: '20px', fontSize: '12px' } 
                  : { width: '8px', height: '8px' })
              }}>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span>{tab.badge > 99 ? '99+' : tab.badge}</span>
                )}
              </span>
            )}
          </div>
          
          {/* Label */}
          {showLabels && (
            <span style={{ 
              marginTop: '4px', 
              fontWeight: 500
            }}>
              {tab.label}
            </span>
          )}
          
          {/* Active indicator */}
          {tab.id === activeTab && (
            <span 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: '#1E88E5'
              }} 
              aria-hidden="true" 
            />
          )}
        </Link>
      ))}
    </div>
  );
};

export default BottomTabNavigation;