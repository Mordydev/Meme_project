import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { AppShell, Header, MobileNavigation, SidebarNavigation } from '@/components/layout';

export const metadata: Metadata = {
  title: 'Success Kid Community Platform',
  description: 'A vibrant ecosystem for crypto enthusiasts and meme lovers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="h-full">
          <Providers>
            <AppShell
              header={<Header showSearch={true} />}
              sidebar={<SidebarNavigation />}
              mobileNav={<MobileNavigation />}
            >
              {children}
            </AppShell>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
