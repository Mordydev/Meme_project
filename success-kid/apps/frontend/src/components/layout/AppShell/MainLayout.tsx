'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppShell } from './AppShellProvider';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  navigation: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function MainLayout({
  navigation,
  header,
  children,
  footer,
  className
}: MainLayoutProps) {
  const { sidebarOpen, isMobile, collapsed } = useAppShell();
  
  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {header}
        </header>
        
        {/* Main content area */}
        <main className={cn("flex-1 pb-16", className)}>
          {children}
        </main>
        
        {/* Mobile navigation (fixed at bottom) */}
        <div className="fixed bottom-0 left-0 z-40 w-full">
          {navigation}
        </div>
        
        {/* Footer (optional) */}
        {footer && (
          <footer className="border-t">
            {footer}
          </footer>
        )}
      </div>
    );
  }
  
  // Desktop layout with sidebar
  return (
    <div className="flex min-h-screen">
      {/* Sidebar navigation */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: collapsed ? 80 : 280,
              opacity: 1
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ 
              duration: 0.2,
              ease: [0.3, 0.0, 0.2, 1.0]
            }}
            className="sticky top-0 z-30 h-screen flex-shrink-0 overflow-y-auto border-r"
          >
            {navigation}
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Main content area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          {header}
        </header>
        
        {/* Content */}
        <main className={cn("flex-1", className)}>
          {children}
        </main>
        
        {/* Footer (optional) */}
        {footer && (
          <footer className="border-t">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
