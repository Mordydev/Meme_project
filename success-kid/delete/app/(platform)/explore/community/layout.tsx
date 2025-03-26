/**
 * Community Layout
 * 
 * Provides layout for all community pages
 */
import React, { ReactNode } from 'react';

interface CommunityLayoutProps {
  children: ReactNode;
}

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div>
        {/* Community Header Banner */}
        <div className="bg-primary/10 py-8">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold">Success Kid Community</h1>
            <p className="text-muted-foreground mt-2">Connect, share, and earn with the Success Kid community</p>
          </div>
        </div>
        
        {/* Main Content */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
