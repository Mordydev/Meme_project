'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useAppShell } from '../AppShell';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { NavigationGroup } from './NavigationGroup';

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

export interface SidebarGroup {
  id: string;
  label?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  groups: SidebarGroup[];
  logo: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
}

export function Sidebar({
  groups,
  logo,
  footerContent,
  className
}: SidebarProps) {
  const { collapsed, setCollapsed } = useAppShell();
  
  return (
    <div className={cn(
      "flex h-full flex-col",
      className
    )}>
      {/* Sidebar Header with Logo */}
      <SidebarHeader 
        logo={logo} 
        collapsed={collapsed} 
        onToggleCollapse={() => setCollapsed(!collapsed)} 
      />
      
      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {groups.map((group) => (
          <NavigationGroup 
            key={group.id}
            groupId={group.id}
            label={group.label}
            items={group.items}
            collapsed={collapsed}
          />
        ))}
      </div>
      
      {/* Footer Content (if provided) */}
      {footerContent && (
        <SidebarFooter collapsed={collapsed}>
          {footerContent}
        </SidebarFooter>
      )}
    </div>
  );
}
