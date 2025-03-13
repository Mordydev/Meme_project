'use client';

import React from 'react';
import Link from 'next/link';
import { NotificationButton } from '@/components/ui/notification-button';
import { UserButton } from '@clerk/nextjs';

export function DemoNav() {
  return (
    <nav className="sticky top-0 z-10 border-b border-neutral-200 bg-white py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
            SK
          </span>
          <span className="text-lg font-bold">Success Kid</span>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="#" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
            Dashboard
          </Link>
          <Link href="#" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
            Market
          </Link>
          <Link href="#" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
            Community
          </Link>
          <Link href="#" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
            Achievements
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationButton />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}

export default DemoNav;
