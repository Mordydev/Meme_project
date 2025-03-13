'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SidebarHeaderProps {
  logo: React.ReactNode;
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function SidebarHeader({
  logo,
  collapsed,
  onToggleCollapse,
  className
}: SidebarHeaderProps) {
  return (
    <div className={cn(
      "flex h-16 items-center border-b px-4",
      className
    )}>
      {/* Logo Section */}
      <Link href="/" className="flex items-center">
        {logo}
      </Link>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Collapse Button */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </motion.div>
      </button>
    </div>
  );
}

// Simple chevron icon component
function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
