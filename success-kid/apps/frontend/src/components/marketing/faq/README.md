# FAQ Page Components

This directory contains components specifically designed for the Success Kid marketing FAQ page. This directory is prepared for future components that will be created specifically for the FAQ page.

## Future Components

Components that could be added to this directory in the future:

- `FaqAccordion` - Interactive accordion for frequently asked questions
- `FaqSearch` - Search functionality for finding specific questions
- `FaqCategories` - Category filter for FAQ topics
- `FaqContactSection` - Contact section for additional questions
- `FaqRelatedQuestions` - Related questions suggestions
- `QuestionSubmissionForm` - Form for users to submit new questions

Currently, the FAQ page is implemented directly in the route file at `/app/(marketing)/faq/page.tsx`. As the page grows in complexity, components should be extracted and placed in this directory.

## Implementation Guide

When creating components for the FAQ page, follow these guidelines:

1. Prioritize user experience and easy information finding
2. Create accessible, keyboard-navigable components
3. Design for clarity and readability
4. Include animations that enhance rather than distract
5. Consider search and filtering for larger FAQ collections
6. Implement analytics tracking for identifying common questions

Example component structure:

```tsx
// components/marketing/faq/FaqAccordion.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

export interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
  defaultOpenIndex?: number;
  allowMultiple?: boolean;
}

export function FaqAccordion({ 
  items, 
  className = '',
  defaultOpenIndex = -1,
  allowMultiple = false
}: FaqAccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>(
    defaultOpenIndex >= 0 ? [defaultOpenIndex] : []
  );

  const toggleFaq = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index) 
          : [...prev, index]
      );
    } else {
      setOpenIndexes(prev => 
        prev.includes(index) ? [] : [index]
      );
    }
  };

  const isOpen = (index: number) => openIndexes.includes(index);

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((faq, index) => (
        <div 
          key={index}
          className="border border-gray-200 rounded-lg bg-white overflow-hidden"
        >
          <button
            className="flex justify-between items-center w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => toggleFaq(index)}
            aria-expanded={isOpen(index)}
            aria-controls={`faq-content-${index}`}
          >
            <span className="font-medium text-gray-900">{faq.question}</span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isOpen(index) ? 'transform rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence>
            {isOpen(index) && (
              <motion.div
                id={`faq-content-${index}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 pb-4 pt-0"
              >
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
```

## Usage Example

```tsx
import { FaqAccordion } from '@/components/marketing/faq';

export default function FaqPage() {
  const faqs = [
    {
      question: "What is the Success Kid Community Platform?",
      answer: "The Success Kid Community Platform is a digital ecosystem built around the Success Kid meme and token. It combines a vibrant community with tangible rewards, allowing members to earn Success Points through engagement that can be redeemed for SKC tokens.",
      category: "general"
    },
    {
      question: "How do I earn Success Points (SP)?",
      answer: "You can earn Success Points through various forms of participation including creating content, commenting on posts, receiving upvotes, daily logins, completing challenges, and referring new users. Each activity has a specific point value and daily earning caps.",
      category: "points"
    },
    // More questions...
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
        <FaqAccordion items={faqs} className="max-w-3xl mx-auto" />
      </div>
    </div>
  );
}
```
