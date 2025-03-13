'use client';

import React from 'react';
import { 
  AppShellProvider, 
  MainLayout, 
  NavigationContainer, 
  ContentContainer,
  useAppShell
} from './AppShell';
import { BottomTabBar, NavItem } from './BottomTabBar';
import { Sidebar, SidebarGroup } from './Sidebar';
import { AppHeader } from './Header';
import { PageTransition } from './PageTransition';
import { NavigationSync } from './NavigationSync';

interface AppLayoutProps {
  children: React.ReactNode;
  navigationGroups: SidebarGroup[];
  mobileNavItems: NavItem[];
  logo: React.ReactNode;
  footerContent?: React.ReactNode;
}

/**
 * App Navigation component that renders either mobile or desktop navigation
 * based on the current screen size
 */
function AppNavigation({ 
  navigationGroups, 
  mobileNavItems, 
  logo, 
  footerContent 
}: {
  navigationGroups: SidebarGroup[];
  mobileNavItems: NavItem[];
  logo: React.ReactNode;
  footerContent?: React.ReactNode;
}) {
  const { isMobile } = useAppShell();
  
  if (isMobile) {
    return <BottomTabBar items={mobileNavItems} />;
  }
  
  return (
    <Sidebar 
      groups={navigationGroups} 
      logo={logo}
      footerContent={footerContent}
    />
  );
}

/**
 * AppLayout - Main application layout component that handles responsive navigation
 * 
 * Combines AppShell, navigation components, and page transition
 */
export function AppLayout({
  children,
  navigationGroups,
  mobileNavItems,
  logo,
  footerContent
}: AppLayoutProps) {
  return (
    <AppShellProvider>
      <NavigationSync />
      
      <MainLayout
        navigation={
          <NavigationContainer>
            <AppNavigation
              navigationGroups={navigationGroups}
              mobileNavItems={mobileNavItems}
              logo={logo}
              footerContent={footerContent}
            />
          </NavigationContainer>
        }
        header={
          <AppHeader logo={logo} />
        }
      >
        <ContentContainer>
          <PageTransition>
            {children}
          </PageTransition>
        </ContentContainer>
      </MainLayout>
    </AppShellProvider>
  );
}
