'use client';

import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { 
  AppShellProvider, 
  MainLayout, 
  NavigationContainer, 
  ContentContainer 
} from '@/components/layout/AppShell';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/Header';
import { PageTransition } from '@/components/layout/PageTransition';
import { NavigationSync } from '@/components/layout/NavigationSync';
import { Notifications } from '@/components/features/notifications';
import { PointsDisplay } from '@/components/features/points';

// Navigation items
const navigationItems = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        id: 'community',
        label: 'Community',
        href: '/community',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
          </svg>
        ),
        badgeCount: 3, // Example badge
      },
      {
        id: 'market',
        label: 'Market',
        href: '/market',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
          </svg>
        ),
      }
    ]
  },
  {
    id: 'user',
    label: 'User',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
          </svg>
        ),
      }
    ]
  }
];

// Transform sidebar groups to bottom tab items
const bottomTabItems = navigationItems.flatMap(group => 
  group.items.map(item => ({
    id: item.id,
    label: item.label,
    href: item.href,
    icon: item.icon,
    badgeCount: item.badgeCount
  }))
);

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication on the server
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Logo component
  const Logo = () => (
    <div className="flex items-center space-x-2">
      <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">
        SK
      </div>
      <span className="text-xl font-bold">Success Kid</span>
    </div>
  );

  // Header actions
  const headerActions = (
    <div className="flex items-center space-x-4">
      <PointsDisplay />
      <Notifications />
    </div>
  );

  return (
    <AppShellProvider>
      {/* Synchronize navigation state */}
      <NavigationSync />
      
      {/* Main Layout */}
      <MainLayout
        navigation={
          <>
            {/* Mobile Bottom Navigation */}
            <BottomTabBar items={bottomTabItems} />
            
            {/* Desktop Sidebar Navigation */}
            <NavigationContainer>
              <Sidebar 
                groups={navigationItems} 
                logo={<Logo />}
              />
            </NavigationContainer>
          </>
        }
        header={
          <AppHeader
            logo={<Logo />}
            actions={headerActions}
          />
        }
      >
        {/* Main Content with Transition */}
        <ContentContainer>
          <PageTransition>
            {children}
          </PageTransition>
        </ContentContainer>
      </MainLayout>
    </AppShellProvider>
  );
}
