'use client';

import { ReactNode } from 'react';
import { 
  AppShell, 
  SidebarNavigation, 
  MobileNavigation, 
  TopBar 
} from '@/components/layout';
import { AuthGuard } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';

interface PlatformLayoutProps {
  children: ReactNode;
}

/**
 * Platform Layout - Enhanced with premium animations and visual effects
 * Provides the main application shell for authenticated platform routes
 * Protected by AuthGuard to prevent unauthorized access
 */
export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const { isLoading } = useAuth();

  // If still loading auth state, show minimal loading indicator
  // This prevents a potential flash of the full layout before redirect
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <AuthGuard
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-gray-500">Verifying authentication...</p>
          </div>
        </div>
      }
    >
      <AppShell
        sidebar={<SidebarNavigation />}
        mobileNav={<MobileNavigation />}
        header={<TopBar />}
      >
        {children}
      </AppShell>
    </AuthGuard>
  );
}
