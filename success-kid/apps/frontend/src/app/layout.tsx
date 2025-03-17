import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers/Providers';

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
    <html lang="en" className="h-full">
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
