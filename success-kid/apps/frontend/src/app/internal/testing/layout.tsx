import React from 'react';
import Link from 'next/link';

// Nav items for the internal testing section
const NAV_ITEMS = [
  { path: '/internal/testing/cross-platform', label: 'Cross-Platform' },
  { path: '/internal/testing/performance', label: 'Performance' },
  { path: '/internal/testing/accessibility', label: 'Accessibility' },
];

export default function TestingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between">
          <div className="font-bold text-xl">
            <Link href="/">Success Kid Platform</Link>
            <span className="text-gray-400 ml-2 text-sm">
              Internal Testing
            </span>
          </div>
          
          <nav className="space-x-4">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm">
          Internal Testing Dashboard • Success Kid Platform • For Development Use Only
        </div>
      </footer>
    </div>
  );
}
