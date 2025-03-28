// Common metadata for the Success Kid Community Platform

import { Metadata } from 'next';

// Base metadata that will be used as defaults
export const baseMetadata: Metadata = {
  title: {
    template: '%s | Success Kid Community',
    default: 'Success Kid Community Platform',
  },
  description: 'Join a vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and create value together.',
  applicationName: 'Success Kid Community Platform',
  authors: [{ name: 'Success Kid Team' }],
  creator: 'Success Kid Team',
  publisher: 'Success Kid Community',
  metadataBase: new URL('https://successkid.community'), // Replace with actual domain
  keywords: [
    'Success Kid', 
    'cryptocurrency', 
    'community platform', 
    'engagement rewards', 
    'meme token', 
    'crypto community',
    'SKC token',
    'Success Points',
    'web3',
    'blockchain'
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    siteName: 'Success Kid Community',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@successkid',
    site: '@successkid',
  },
  // Note: viewport and themeColor should be configured in the viewport export instead of metadata
  // See app/layout.tsx for the correct implementation
  category: 'technology',
};

// Helper function to generate page-specific metadata with proper overrides
export function generateMetadata(
  pageData: {
    title: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
    keywords?: string[];
  }
): Metadata {
  const { title, description, ogImage, canonical, keywords = [] } = pageData;
  
  return {
    ...baseMetadata,
    title,
    description: description || baseMetadata.description,
    keywords: [...(baseMetadata.keywords as string[]), ...keywords],
    alternates: canonical ? {
      canonical: canonical,
    } : undefined,
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description: description || baseMetadata.description as string,
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        }
      ] : undefined,
    },
    twitter: {
      ...baseMetadata.twitter,
      title,
      description: description || baseMetadata.description as string,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
