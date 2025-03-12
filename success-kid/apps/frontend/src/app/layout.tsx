import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Success Kid Community Platform',
  description: 'A vibrant ecosystem for crypto enthusiasts and meme lovers',
  keywords: ['crypto', 'community', 'meme', 'success kid', 'token', 'blockchain'],
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
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
