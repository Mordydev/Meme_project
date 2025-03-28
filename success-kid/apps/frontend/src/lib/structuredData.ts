/**
 * Helper functions for generating JSON-LD structured data for SEO
 */

export interface WebsiteStructuredData {
  url: string;
  name: string;
  description: string;
  publisherName: string;
  publisherLogo?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generates Website structured data
 */
export function generateWebsiteStructuredData({
  url,
  name,
  description,
  publisherName,
  publisherLogo = 'https://successkid.community/logo.png', // Default logo URL
}: WebsiteStructuredData): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": url,
    "name": name,
    "description": description,
    "publisher": {
      "@type": "Organization",
      "name": publisherName,
      "logo": {
        "@type": "ImageObject",
        "url": publisherLogo,
      },
    },
  };

  return JSON.stringify(data);
}

/**
 * Generates Organization structured data
 */
export function generateOrganizationStructuredData(): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Success Kid Community",
    "url": "https://successkid.community",
    "logo": "https://successkid.community/logo.png",
    "sameAs": [
      "https://twitter.com/successkid",
      "https://discord.gg/successkid",
      "https://t.me/successkid"
    ],
    "description": "A vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and create value together."
  };

  return JSON.stringify(data);
}

/**
 * Generates Breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(items: BreadcrumbItem[]): string {
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url,
  }));

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": itemListElement,
  };

  return JSON.stringify(data);
}

/**
 * Generates FAQPage structured data
 */
export function generateFaqStructuredData(
  faqs: Array<{ question: string; answer: string }>
): string {
  const mainEntity = faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  }));

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": mainEntity,
  };

  return JSON.stringify(data);
}
