'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/navigationStore';
import type { SidebarItem } from './Sidebar';

interface NavigationGroupProps {
  groupId: string;
  label?: string;
  items: SidebarItem[];
  collapsed: boolean;
}

export function NavigationGroup({
  groupId,
  label,
  items,
  collapsed
}: NavigationGroupProps) {
  const pathname = usePathname();
  const activeRoute = useNavigationStore((state) => state.activeRoute);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Check for active item in this group
  const hasActiveItem = items.some((item) => pathname.startsWith(item.href));
  
  // Toggle group expansion
  const toggleExpand = () => {
    if (!collapsed) {
      setIsExpanded(!isExpanded);
    }
  };
  
  return (
    <div className="mb-4 px-3">
      {/* Group Label */}
      {label && !collapsed && (
        <div
          className={cn(
            "flex items-center py-2 mb-1",
            hasActiveItem ? "text-foreground" : "text-muted-foreground"
          )}
          onClick={toggleExpand}
          style={{ cursor: 'pointer' }}
        >
          <span className="text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
          <span className="ml-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded ? "" : "-rotate-90"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </div>
      )}
      
      {/* Navigation Items */}
      {(!collapsed || isExpanded) && (
        <div className={cn(collapsed ? "space-y-1" : "ml-1 space-y-1")}>
          {items.map((item) => {
            // Check if this item is active
            const isActive = pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex items-center rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed ? "justify-center" : ""
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                
                {/* Icon */}
                <div className="relative">
                  {item.icon}
                  
                  {/* Badge */}
                  {item.badgeCount && item.badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
                      {item.badgeCount > 99 ? '99+' : item.badgeCount}
                    </span>
                  )}
                </div>
                
                {/* Label (hidden when collapsed) */}
                {!collapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
