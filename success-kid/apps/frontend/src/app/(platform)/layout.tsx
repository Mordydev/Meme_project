'use client';

import { ReactNode } from 'react';
import { 
  AppShell, 
  SidebarNavigation, 
  MobileNavigation, 
  TopBar 
} from '@/components/layout';

interface PlatformLayoutProps {
  children: ReactNode;
}

/**
 * Platform Layout - Enhanced with premium animations and visual effects
 * Provides the main application shell for authenticated platform routes
 */
export default function PlatformLayout({ children }: PlatformLayoutProps) {
  return (
    <AppShell
      sidebar={<SidebarNavigation />}
      mobileNav={<MobileNavigation />}
      header={<TopBar />}
    >
      {children}
    </AppShell>
  );
}
