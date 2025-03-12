import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { MainNav } from '@/components/layout/main-nav';
import { MobileNav } from '@/components/layout/mobile-nav';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();

  if (!userId) {
    redirect('/(auth)/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop navigation */}
      <div className="hidden md:block">
        <MainNav />
      </div>
      
      {/* Main content */}
      <main className="flex-1 px-4 md:px-6 py-4 md:py-6">
        {children}
      </main>
      
      {/* Mobile navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
