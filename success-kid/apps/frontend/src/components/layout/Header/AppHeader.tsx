'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { useAppShell } from '../AppShell';

interface AppHeaderProps {
  logo: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  showSearch?: boolean;
  backUrl?: string;
  className?: string;
}

export function AppHeader({
  logo,
  title,
  actions,
  showSearch = false,
  backUrl,
  className
}: AppHeaderProps) {
  const pathname = usePathname();
  const { isMobile, toggleSidebar, sidebarOpen } = useAppShell();
  
  return (
    <div className={cn("flex h-16 items-center px-4", className)}>
      {/* Back button (only if backUrl is provided) */}
      {backUrl && (
        <Link
          href={backUrl}
          className="mr-4 flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
          aria-label="Go back"
        >
          <BackIcon className="h-5 w-5" />
        </Link>
      )}
      
      {/* Menu toggle (only on desktop) */}
      {!isMobile && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="mr-4 flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted lg:hidden"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      )}
      
      {/* Logo (only show on mobile or if sidebar is closed) */}
      {(isMobile || !sidebarOpen) && (
        <Link href="/" className="flex items-center">
          {logo}
        </Link>
      )}
      
      {/* Title (if provided) */}
      {title && (
        <h1 className="px-4 text-lg font-semibold">{title}</h1>
      )}
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Actions area (right side) */}
      <div className="flex items-center space-x-2">
        {/* Custom actions */}
        {actions}
        
        {/* User button */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}

// Simple icon components
function BackIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="3" x2="21" y1="6" y2="6" />
      <line x1="3" x2="21" y1="12" y2="12" />
      <line x1="3" x2="21" y1="18" y2="18" />
    </svg>
  );
}
