import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Markets | Data & Insights | Success Kid Community',
  description: 'Explore real-time market metrics, performance, tokenomics, and transaction data with our interactive dashboard.',
  keywords: 'SKC token, crypto market data, tokenomics, Success Kid Community, token utility, market cap, blockchain transparency',
  openGraph: {
    title: 'Markets | Data & Insights | Success Kid Community',
    description: 'Interactive dashboards showing real-time market metrics, performance, tokenomics, and complete transaction transparency.',
    images: [{ url: '/images/og-market.jpg', width: 1200, height: 630, alt: 'Success Kid Market Data' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Markets | Real-Time Data & Insights',
    description: 'Interactive dashboards showing real-time market metrics, performance, and complete transaction transparency.',
    images: ['/images/og-market.jpg'],
  },
};

export default metadata;
