'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { Notifications } from '@/components/features/notifications';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Community',
    href: '/community',
  },
  {
    label: 'Discover',
    href: '/discover',
  },
  {
    label: 'Search',
    href: '/search',
  },
  {
    label: 'Profile',
    href: '/profile',
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold">Success Kid</span>
        </Link>
        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6 hidden md:block">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith(item.href)
                  ? "text-primary"
                  : "text-gray-500"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Notifications />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
}
