
import React from 'react';

export default function CommunityLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      {children}
    </div>
  );
}
