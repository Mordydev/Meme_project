import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';

// Initialize Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Success Kid Platform',
    default: 'Success Kid Platform',
  },
  description: 'A vibrant ecosystem for crypto enthusiasts and meme lovers',
  viewport: 'width=device-width, initial-scale=1',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Providers>
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
