'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/useNavigationStore';

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
  showSearch?: boolean;
  backUrl?: string;
}

/**
 * Header - Responsive app header with contextual navigation
 * Adapts based on current route and device size
 */
export function Header({
  title,
  actions,
  showSearch = true,
  backUrl
}: HeaderProps) {
  const pathname = usePathname();
  const sidebarExpanded = useNavigationStore(state => state.sidebarExpanded);
  const toggleSidebar = useNavigationStore(state => state.toggleSidebar);
  
  // Search state
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Derive title from pathname if not provided
  const pageTitle = title || getPageTitleFromPathname(pathname);
  
  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between">
        {/* Left section: Menu toggle on mobile, back button, or title */}
        <div className="flex items-center">
          {/* Mobile menu button - only on small screens when no sidebar */}
          <button
            className="md:hidden mr-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Back button - when backUrl is provided */}
          {backUrl && (
            <Link 
              href={backUrl}
              className="mr-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Go back"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-5 h-5"
              >
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
          
          {/* Page title */}
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </div>
        
        {/* Center section: Search (on larger screens) */}
        <AnimatePresence>
          {showSearch && !isSearchActive && (
            <motion.div 
              className="hidden md:block w-1/3 max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full h-10 px-4 pl-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900"
                  onFocus={() => setIsSearchActive(true)}
                />
                <div className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className="w-5 h-5"
                  >
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Expanded search (when active) */}
          {isSearchActive && (
            <motion.div 
              className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-gray-950 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-full max-w-2xl relative">
                <input
                  type="text"
                  placeholder="Search for anything..."
                  className="w-full h-12 px-4 pl-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <div className="absolute left-3 top-3.5 text-gray-500 dark:text-gray-400">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className="w-5 h-5"
                  >
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
                <button
                  className="absolute right-3 top-3.5 text-gray-500 dark:text-gray-400"
                  onClick={() => setIsSearchActive(false)}
                  aria-label="Close search"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className="w-5 h-5"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Right section: Actions + Search (mobile) + User button */}
        <div className="flex items-center space-x-3">
          {/* Mobile search button */}
          {showSearch && (
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsSearchActive(true)}
              aria-label="Search"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-5 h-5"
              >
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {/* Contextual actions */}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
          
          {/* Notifications */}
          <button
            className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Notifications"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.91 32.91 0 003.256.508 3.5 3.5 0 006.972 0 32.903 32.903 0 003.256-.508.75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6zM8.05 14.943a33.54 33.54 0 003.9 0 2 2 0 01-3.9 0z" clipRule="evenodd" />
            </svg>
            
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              3
            </span>
          </button>
          
          {/* User button */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}

// Helper function to get page title from pathname
function getPageTitleFromPathname(pathname: string): string {
  // Extract the last part of the path, ignoring trailing slash
  const path = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const lastSegment = path.split('/').pop() || '';
  
  // Format it (capitalize first letter, replace hyphens with spaces)
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
