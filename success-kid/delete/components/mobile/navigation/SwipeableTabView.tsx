'use client';

import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { TouchFeedback } from '../TouchFeedback';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: number | boolean;
}

export interface SwipeableTabViewProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  tabBarClassName?: string;
  contentClassName?: string;
  tabClassName?: string;
  enableSwipe?: boolean;
  swipeThreshold?: number;
  swipeMinDistance?: number;
  animationDuration?: number;
  showIndicator?: boolean;
  indicatorClassName?: string;
  tabPosition?: 'top' | 'bottom';
}

/**
 * A mobile-optimized tab view component that supports swipe gestures for
 * navigating between tabs.
 */
export const SwipeableTabView: React.FC<SwipeableTabViewProps> = ({
  tabs,
  activeTab: propActiveTab,
  onTabChange,
  className,
  tabBarClassName,
  contentClassName,
  tabClassName,
  enableSwipe = true,
  swipeThreshold = 0.3,
  swipeMinDistance = 50,
  animationDuration = 0.3,
  showIndicator = true,
  indicatorClassName,
  tabPosition = 'top',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const controls = useAnimation();
  
  // Set initial active tab
  useEffect(() => {
    if (propActiveTab) {
      const index = tabs.findIndex(tab => tab.id === propActiveTab);
      if (index !== -1) {
        setActiveTabIndex(index);
      }
    }
  }, [propActiveTab, tabs]);
  
  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        setDimensions({
          width: contentRef.current.offsetWidth,
          height: contentRef.current.offsetHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Sync active tab index with animation controls
  useEffect(() => {
    controls.start({
      x: -activeTabIndex * dimensions.width,
      transition: { duration: prefersReducedMotion ? 0 : animationDuration },
    });
  }, [activeTabIndex, dimensions.width, controls, prefersReducedMotion, animationDuration]);
  
  // Handle tab selection
  const handleTabChange = (index: number) => {
    if (tabs[index].disabled) return;
    
    const newTabId = tabs[index].id;
    setActiveTabIndex(index);
    onTabChange?.(newTabId);
  };
  
  // Handle swipe gestures
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!enableSwipe || prefersReducedMotion) return;
    
    const { velocity, offset } = info;
    const swipe = offset.x;
    
    // Direction of swipe (negative is left, positive is right)
    const isLeftSwipe = swipe < 0;
    
    // Check if swipe is enough to trigger a tab change
    const isSwipeSignificant = Math.abs(swipe) > dimensions.width * swipeThreshold || 
                            (Math.abs(swipe) > swipeMinDistance && Math.abs(velocity.x) > 0.5);
    
    if (isSwipeSignificant) {
      if (isLeftSwipe && activeTabIndex < tabs.length - 1) {
        // Swipe left, go to next tab
        handleTabChange(activeTabIndex + 1);
      } else if (!isLeftSwipe && activeTabIndex > 0) {
        // Swipe right, go to previous tab
        handleTabChange(activeTabIndex - 1);
      } else {
        // Bounce back animation if we're at the first or last tab
        controls.start({
          x: -activeTabIndex * dimensions.width,
          transition: { duration: 0.2, bounce: 0.2, type: "spring" },
        });
      }
    } else {
      // If swipe isn't significant, animate back to the current tab
      controls.start({
        x: -activeTabIndex * dimensions.width,
        transition: { duration: 0.2 },
      });
    }
  };
  
  // Active tab indicator measurements
  const numTabs = tabs.length;
  const indicatorWidth = numTabs > 0 ? 100 / numTabs : 0;
  const indicatorOffset = indicatorWidth * activeTabIndex;
  
  // Determine if tabs should be rendered at top or bottom
  const tabBar = (
    <div 
      className={cn(
        'flex bg-white border-gray-200',
        tabPosition === 'top' ? 'border-b' : 'border-t',
        tabBarClassName
      )}
      role="tablist"
      aria-label="Tabs"
    >
      {tabs.map((tab, index) => (
        <TouchFeedback
          key={tab.id}
          effect="highlight"
          disabled={tab.disabled}
          onPress={() => handleTabChange(index)}
          className={cn(
            'flex flex-1 items-center justify-center py-3 px-2 relative min-h-[48px]',
            index === activeTabIndex ? 'text-primary-600' : 'text-gray-600',
            tab.disabled && 'opacity-50',
            tabClassName
          )}
          activeClassName="text-primary-600"
          role="tab"
          aria-selected={index === activeTabIndex}
          aria-controls={`panel-${tab.id}`}
          aria-disabled={tab.disabled}
          id={`tab-${tab.id}`}
        >
          <span className="truncate">{tab.label}</span>
          
          {/* Badge */}
          {tab.badge && (
            <span className={cn(
              'ml-1.5 flex justify-center items-center',
              typeof tab.badge === 'number' ? 'min-w-5 h-5 rounded-full text-xs bg-red-500 text-white' : 'w-2 h-2 rounded-full bg-red-500'
            )}>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span>{tab.badge > 99 ? '99+' : tab.badge}</span>
              )}
            </span>
          )}
        </TouchFeedback>
      ))}
      
      {/* Active tab indicator */}
      {showIndicator && (
        <div 
          className={cn(
            'absolute bottom-0 h-0.5 bg-primary-600 transition-all duration-300',
            tabPosition === 'top' ? 'bottom-0' : 'top-0',
            indicatorClassName
          )}
          style={{
            width: `${indicatorWidth}%`,
            left: `${indicatorOffset}%`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
  
  return (
    <div className={cn('swipeable-tab-view flex flex-col overflow-hidden', className)}>
      {/* Tabs at top or bottom */}
      {tabPosition === 'top' && tabBar}
      
      {/* Tab Content */}
      <div 
        ref={contentRef}
        className={cn(
          'flex-1 overflow-hidden',
          contentClassName
        )}
      >
        <motion.div
          className="flex h-full"
          drag={enableSwipe && !prefersReducedMotion ? 'x' : false}
          dragConstraints={{ left: -dimensions.width * (tabs.length - 1), right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ width: `${tabs.length * 100}%` }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              id={`panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              style={{ width: dimensions.width > 0 ? dimensions.width : `${100 / tabs.length}%` }}
              className="h-full overflow-auto overscroll-contain"
              hidden={tab.id !== tabs[activeTabIndex]?.id}
            >
              {tab.content}
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Tabs at bottom */}
      {tabPosition === 'bottom' && tabBar}
    </div>
  );
};

export default SwipeableTabView;