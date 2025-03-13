'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarFooterProps {
  children: React.ReactNode;
  collapsed: boolean;
  className?: string;
}

export function SidebarFooter({
  children,
  collapsed,
  className
}: SidebarFooterProps) {
  return (
    <div className={cn(
      "border-t py-2 px-4",
      collapsed ? "items-center" : "",
      className
    )}>
      {children}
    </div>
  );
}
