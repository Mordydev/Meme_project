'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUIStore } from '@/store/useUIStore'; 

interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  mobileNav?: React.ReactNode;
  header?: React.ReactNode;
}

/**
 * AppShell - The main layout component that adapts to different devices
 * and provides the structure for the navigation system
 */
export function AppShell({
  children,
  sidebar,
  mobileNav,
  header
}: AppShellProps) {
  const pathname = usePathname();
  const setActiveRoute = useNavigationStore(state => state.setActiveRoute);
  const sidebarExpanded = useNavigationStore(state => state.sidebarExpanded);
  const setSidebarExpanded = useNavigationStore(state => state.setSidebarExpanded);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  
  // Update active route when pathname changes
  useEffect(() => {
    setActiveRoute(pathname);
  }, [pathname, setActiveRoute]);
  
  // Handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      
      // Auto-collapse sidebar on small screens
      if (window.innerWidth < 1024 && sidebarExpanded) {
        setSidebarExpanded(false);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarExpanded, setSidebarExpanded]);
  
  // Sidebar width for spacing
  const sidebarWidth = sidebarExpanded ? 'w-64' : 'w-16';
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header - always visible */}
      {header && (
        <header className="z-30 flex-shrink-0">
          {header}
        </header>
      )}
      
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar - hidden on mobile */}
        {sidebar && !isMobile && (
          <aside 
            className={cn(
              "hidden md:block h-full overflow-y-auto transition-all duration-300 border-r",
              sidebarWidth
            )}
          >
            {sidebar}
          </aside>
        )}
        
        {/* Main content area with proper spacing */}
        <main className={cn(
          "flex-grow h-full overflow-y-auto",
          // Add bottom padding on mobile for the navigation bar
          isMobile ? "pb-16" : "",
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ 
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      {/* Mobile Navigation - only visible on mobile */}
      {mobileNav && isMobile && (
        <nav className="md:hidden fixed bottom-0 left-0 z-40 w-full">
          {mobileNav}
        </nav>
      )}
    </div>
  );
}
