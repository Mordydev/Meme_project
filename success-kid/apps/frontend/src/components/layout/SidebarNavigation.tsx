'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigationStore, NavigationGroup, NavigationItem } from '@/store/useNavigationStore';

interface SidebarProps {
  className?: string;
}

/**
 * SidebarNavigation - Desktop sidebar navigation component
 * Provides expandable sidebar with grouped navigation items
 */
export function SidebarNavigation({ className }: SidebarProps) {
  const pathname = usePathname();
  const sidebarExpanded = useNavigationStore(state => state.sidebarExpanded);
  const toggleSidebar = useNavigationStore(state => state.toggleSidebar);
  const isGroupExpanded = useNavigationStore(state => state.isGroupExpanded);
  const toggleExpandGroup = useNavigationStore(state => state.toggleExpandGroup);
  
  // Navigation groups and items - this would typically come from a configuration or API
  const navigationGroups: NavigationGroup[] = [
    {
      id: 'main',
      label: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/(platform)/dashboard',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
            </svg>
          ),
        },
        {
          id: 'market',
          label: 'Market',
          href: '/(platform)/market',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
            </svg>
          ),
        },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      items: [
        {
          id: 'create',
          label: 'Create',
          href: '/(platform)/create',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          ),
        },
        {
          id: 'community',
          label: 'Community',
          href: '/(platform)/community',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
            </svg>
          ),
          badgeCount: 3, // Example notification
        },
      ],
    },
    {
      id: 'account',
      label: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Profile',
          href: '/(platform)/profile',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
            </svg>
          ),
        },
        {
          id: 'settings',
          label: 'Settings',
          href: '/(platform)/settings',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          ),
        },
      ],
    },
  ];
  
  return (
    <div className={cn("flex flex-col h-full py-4", className)}>
      {/* Sidebar header with logo and toggle */}
      <div className={cn(
        "flex items-center mb-6 px-4",
        sidebarExpanded ? "justify-between" : "justify-center"
      )}>
        {sidebarExpanded && (
          <Link href="/" className="text-xl font-bold">
            Success Kid
          </Link>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            className={cn(
              "w-5 h-5 transition-transform duration-300",
              sidebarExpanded ? "transform rotate-180" : ""
            )}
          >
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Navigation groups */}
      <div className="flex-grow space-y-4 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.id} className="px-2">
            {/* Group label - only when expanded */}
            {sidebarExpanded && (
              <div 
                className="flex items-center justify-between px-2 py-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
                onClick={() => toggleExpandGroup(group.id)}
              >
                {group.label}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isGroupExpanded(group.id) ? "transform rotate-180" : ""
                  )}
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {/* Group items */}
            <div className={cn(
              "space-y-1 transition-all duration-300 ease-in-out",
              (!sidebarExpanded || isGroupExpanded(group.id)) ? "max-h-96" : "max-h-0 overflow-hidden"
            )}>
              {group.items.map((item) => (
                <SidebarItem 
                  key={item.id}
                  item={item}
                  expanded={sidebarExpanded}
                  active={pathname.includes(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Sidebar footer */}
      <div className="mt-auto px-4">
        {sidebarExpanded ? (
          <div className="border-t pt-4 text-xs text-gray-500 dark:text-gray-400">
            <p>Success Kid Community</p>
            <p>Version 1.0.0</p>
          </div>
        ) : (
          <div className="flex justify-center pt-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 dark:text-gray-400">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-1 0a7 7 0 11-14 0 7 7 0 0114 0zm-8 3a1 1 0 110-2 1 1 0 010 2zm0-8a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 019 5z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual sidebar item component
function SidebarItem({ 
  item, 
  expanded, 
  active 
}: { 
  item: NavigationItem; 
  expanded: boolean; 
  active: boolean;
}) {
  return (
    <Link 
      href={item.href}
      className={cn(
        "group flex items-center py-2 px-2 rounded-md transition-colors duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        active 
          ? "bg-primary/10 text-primary" 
          : "text-gray-700 dark:text-gray-300"
      )}
    >
      <div className="relative">
        <span className={cn(
          "inline-block transition-all",
          active ? "text-primary" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        )}>
          {item.icon}
        </span>
        
        {/* Badge indicator */}
        {item.badgeCount && item.badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </span>
        )}
      </div>
      
      {expanded && (
        <span className="ml-3 transition-opacity duration-200">
          {item.label}
        </span>
      )}
      
      {active && expanded && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
          transition={{ duration: 0.3, type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}
