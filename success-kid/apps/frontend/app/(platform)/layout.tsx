import { ReactNode } from 'react';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* We would typically include navigation and other platform UI here */}
      <main>{children}</main>
    </div>
  );
}
