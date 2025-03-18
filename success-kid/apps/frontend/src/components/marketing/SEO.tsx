'use client';

import React from 'react';
import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: string | string[];
}

/**
 * SEO component for adding structured data to the page
 * Note: This is a client component, as most metadata should be handled by
 * Next.js metadata API in the layout.tsx files. This is for specific
 * structured data that needs to be added dynamically.
 */
export function SEO({
  structuredData,
}: SEOProps) {
  const structuredDataArray = Array.isArray(structuredData)
    ? structuredData
    : structuredData
    ? [structuredData]
    : [];

  return (
    <Head>
      {/* Add structured data */}
      {structuredDataArray.map((data, index) => (
        <script
          key={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: data }}
        />
      ))}
    </Head>
  );
}
