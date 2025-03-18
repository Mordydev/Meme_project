'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import { registerServiceWorker } from '../lib/pwa/service-worker-registration';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register service worker for PWA functionality
    registerServiceWorker();
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1E88E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Success Kid" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
      </head>
      <body className={`${inter.variable} font-body`}>
        {children}
      </body>
    </html>
  );
}
