'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

interface BottomTabBarProps {
  items: NavItem[];
  className?: string;
}

export function BottomTabBar({ items, className }: BottomTabBarProps) {
  const pathname = usePathname();
  
  return (
    <div className={cn(
      "flex h-16 bg-background border-t border-border",
      className
    )}>
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center relative",
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={item.label}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="bottom-tab-indicator"
                className="absolute top-0 h-1 w-12 bg-primary rounded-b-md"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            
            {/* Icon */}
            <div className="relative">
              {item.icon}
              
              {/* Badge */}
              {item.badgeCount && item.badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
                  {item.badgeCount > 99 ? '99+' : item.badgeCount}
                </span>
              )}
            </div>
            
            {/* Label */}
            <span className="mt-1 text-xs font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
