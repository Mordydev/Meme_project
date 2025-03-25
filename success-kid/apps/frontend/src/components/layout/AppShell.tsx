'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springs, bezierCurves } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUIStore } from '@/store/useUIStore';
import { SidebarNavigation } from './SidebarNavigation';
import { TopBar } from './TopBar';
import { MobileNavigation } from './MobileNavigation';
import { PageTransition } from './PageTransition';

interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  mobileNav?: React.ReactNode;
  header?: React.ReactNode;
  withoutNavigation?: boolean;
}

/**
 * AppShell - The main layout component that adapts to different devices
 * and provides the structure for the navigation system with smooth animations
 */
export function AppShell({
  children,
  sidebar,
  mobileNav,
  header,
  withoutNavigation = false
}: AppShellProps) {
  const pathname = usePathname();
  const setActiveRoute = useNavigationStore(state => state.setActiveRoute);
  const sidebarExpanded = useNavigationStore(state => state.sidebarExpanded);
  const setSidebarExpanded = useNavigationStore(state => state.setSidebarExpanded);
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  const setSidebarOpen = useUIStore(state => state.setSidebarOpen);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  
  // Update active route when pathname changes
  useEffect(() => {
    setActiveRoute(pathname);
  }, [pathname, setActiveRoute]);
  
  // Handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-collapse sidebar on small screens
      if (window.innerWidth < 1024 && sidebarExpanded) {
        setSidebarExpanded(false);
      }
      
      // Auto-close mobile sidebar when resizing to desktop
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false);
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
  }, [sidebarExpanded, setSidebarExpanded, sidebarOpen, setSidebarOpen]);
  
  // Default components if not explicitly provided
  const defaultSidebar = !withoutNavigation ? <SidebarNavigation /> : null;
  const defaultHeader = !withoutNavigation ? <TopBar /> : null;
  const defaultMobileNav = !withoutNavigation ? <MobileNavigation /> : null;
  
  // Use provided components or defaults
  const sidebarComponent = sidebar || defaultSidebar;
  const headerComponent = header || defaultHeader;
  const mobileNavComponent = mobileNav || defaultMobileNav;
  
  // Mobile sidebar backdrop with animation
  const SidebarBackdrop = () => {
    if (!isMobile) return null;
    
    return (
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    );
  };
  
  // Dynamic sidebar animation variants
  const sidebarVariants = {
    expanded: { 
      width: 240,
      transition: springs.responsive
    },
    collapsed: { 
      width: 70,
      transition: springs.responsive
    },
    closed: {
      x: '-100%',
      transition: { duration: 0.3, ease: bezierCurves.standard }
    },
    open: {
      x: 0,
      transition: { duration: 0.3, ease: bezierCurves.standard }
    }
  };
  
  // Content area animation variants
  const contentVariants = {
    withExpandedSidebar: { 
      marginLeft: 240,
      transition: springs.responsive
    },
    withCollapsedSidebar: { 
      marginLeft: 70,
      transition: springs.responsive
    },
    withoutSidebar: {
      marginLeft: 0,
      transition: springs.responsive
    }
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Header - always visible */}
      {headerComponent && (
        <header className="z-50 flex-shrink-0 sticky top-0">
          {headerComponent}
        </header>
      )}
      
      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar backdrop with animation */}
        <SidebarBackdrop />
        
        {/* Sidebar - with enhanced animations */}
        {sidebarComponent && (
          <motion.aside
            initial={false}
            animate={
              isMobile
                ? sidebarOpen ? 'open' : 'closed'
                : sidebarExpanded ? 'expanded' : 'collapsed'
            }
            variants={isMobile ? { open: sidebarVariants.open, closed: sidebarVariants.closed } : sidebarVariants}
            className={cn(
              "h-full flex-shrink-0 z-40",
              // Mobile positioning
              isMobile ? "fixed inset-y-0 left-0 w-64" : "relative",
            )}
            style={{ overflow: 'hidden' }} // Add direct style to fix overflow issue
          >
            {sidebarComponent}
          </motion.aside>
        )}
        
        {/* Main content area with smooth transitions */}
        <motion.main 
          initial={false}
          animate={
            !isMobile && sidebarComponent && sidebarExpanded 
              ? 'withExpandedSidebar' 
              : !isMobile && sidebarComponent 
                ? 'withCollapsedSidebar' 
                : 'withoutSidebar'
          }
          variants={contentVariants}
          className={cn(
            "flex-1 h-full overflow-y-auto",
            "bg-white dark:bg-gray-900",
            "rounded-tl-xl shadow-inner",
            // Add bottom padding on mobile for the navigation bar
            isMobile ? "pb-16" : "",
          )}
        >
          <div className="container mx-auto p-4 md:p-6 h-full">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </motion.main>
      </div>
      
      {/* Mobile Navigation - only visible on mobile */}
      {mobileNavComponent && isMobile && (
        <motion.nav 
          className="md:hidden fixed bottom-0 left-0 z-40 w-full"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3, ...springs.responsive }}
        >
          {mobileNavComponent}
        </motion.nav>
      )}
    </div>
  );
}
