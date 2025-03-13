'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { PointsDisplay } from '@/components/features/points';

interface PlatformLayoutProps {
  children: ReactNode;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const pathname = usePathname();
  
  // Check if link is active
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  // Nav link styling
  const getLinkClasses = (path: string) => {
    return `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
      isActive(path)
        ? 'bg-primary-50 text-primary-900'
        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
    }`;
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Left: Logo and brand */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Success Kid
            </Link>
          </div>
          
          {/* Center: Main navigation */}
          <nav className="hidden space-x-4 md:flex">
            <Link href="/dashboard" className={getLinkClasses('/dashboard')}>
              Dashboard
            </Link>
            <Link href="/community" className={getLinkClasses('/community')}>
              Community
            </Link>
            <Link href="/points" className={getLinkClasses('/points')}>
              Points
            </Link>
            <Link href="/market" className={getLinkClasses('/market')}>
              Market
            </Link>
            <Link href="/profile" className={getLinkClasses('/profile')}>
              Profile
            </Link>
          </nav>
          
          {/* Right: Account & Points */}
          <div className="flex items-center gap-4">
            <PointsDisplay />
            <ConnectWalletButton size="sm" showConnectedState />
          </div>
        </div>
      </header>
      
      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 z-10 w-full border-t border-neutral-200 bg-white md:hidden">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex flex-col items-center">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/community" className="flex flex-col items-center">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs">Community</span>
          </Link>
          <Link href="/points" className="flex flex-col items-center">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Points</span>
          </Link>
          <Link href="/market" className="flex flex-col items-center">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-xs">Market</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 bg-neutral-50 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
