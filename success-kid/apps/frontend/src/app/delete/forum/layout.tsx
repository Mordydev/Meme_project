/**
 * Forum Layout
 * 
 * Provides layout for all forum pages
 */
import React, { ReactNode } from 'react';

interface ForumLayoutProps {
  children: ReactNode;
}

export default function ForumLayout({ children }: ForumLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {children}
      </div>
    </div>
  );
}
