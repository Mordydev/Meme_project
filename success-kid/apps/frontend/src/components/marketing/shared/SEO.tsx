import React from 'react';
import Head from 'next/head';

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: string;
}

export function SEO({
  title = 'Success Kid Community Platform',
  description = 'Join a vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and create value together.',
  canonicalUrl = 'https://successkid.io',
  ogImage = '/images/success-kid-social.png',
  structuredData
}: SEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Social Media Metadata */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter Metadata */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Structured Data for SEO */}
      {structuredData && (
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
      )}
    </Head>
  );
}

export default SEO;
