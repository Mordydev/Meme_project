import { Metadata } from 'next';

const DEFAULT_TITLE = 'Success Kid Community Platform';
const DEFAULT_DESCRIPTION = 'Join the Success Kid community platform where crypto enthusiasts and meme lovers connect, engage, and create value together.';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://successkid.io';

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${DEFAULT_TITLE}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'crypto', 
    'community', 
    'blockchain', 
    'meme coin', 
    'success kid', 
    'token', 
    'web3',
    'defi',
    'cryptocurrency',
    'digital assets',
  ],
  authors: [{ name: 'Success Kid Team' }],
  creator: 'Success Kid Community',
  publisher: 'Success Kid Platform',
  openGraph: {
    type: 'website',
    url: BASE_URL,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: 'Success Kid Platform',
    images: [
      {
        url: `${BASE_URL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Success Kid Community Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [`${BASE_URL}/images/twitter-image.jpg`],
    creator: '@SuccessKidCoin',
    site: '@SuccessKidCoin',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#1E88E5',
  category: 'technology',
  formatDetection: {
    telephone: false,
  },
};

export default metadata;
