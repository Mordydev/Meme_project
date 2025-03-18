import { Metadata } from 'next';
import { baseMetadata } from './meta';
import MarketingPage from './(marketing)/page';

// Export metadata
export const metadata: Metadata = {
  ...baseMetadata,
  title: 'Success Kid Community Platform - Earn Crypto Through Engagement',
  description: 'Join a vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and earn real rewards. Turn your community contributions into SKC tokens!',
  openGraph: {
    ...baseMetadata.openGraph,
    title: 'Success Kid Community Platform - Earn Crypto Through Engagement',
    description: 'Join a vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and earn real rewards.',
    images: ['/images/og-home.jpg'],
  },
  twitter: {
    ...baseMetadata.twitter,
    title: 'Success Kid Community Platform',
    description: 'Join a vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and earn real rewards.',
    images: ['/images/og-home.jpg'],
  },
};

// Use the Marketing Page directly
export default MarketingPage;

