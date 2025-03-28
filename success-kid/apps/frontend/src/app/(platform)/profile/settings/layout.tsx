/**
 * Settings Layout
 */
import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

/**
 * Settings Layout Component
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card className="p-0">
            <nav className="p-4">
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/profile/settings/account" 
                    className="block px-3 py-2 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    Account
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/profile/settings/notifications" 
                    className="block px-3 py-2 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    Notifications
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/profile/settings/privacy" 
                    className="block px-3 py-2 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/profile/settings/wallet" 
                    className="block px-3 py-2 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    Wallet
                  </Link>
                </li>
              </ul>
            </nav>
          </Card>
        </div>
        
        {/* Content */}
        <div className="md:col-span-3">
          <Card className="p-6">
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
}
