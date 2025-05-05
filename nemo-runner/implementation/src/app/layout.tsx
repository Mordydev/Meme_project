import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NEMO Runner - Underwater Endless Runner',
  description: 'An underwater endless runner game inspired by Finding Nemo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="w-full min-h-screen">{children}</main>
      </body>
    </html>
  );
}