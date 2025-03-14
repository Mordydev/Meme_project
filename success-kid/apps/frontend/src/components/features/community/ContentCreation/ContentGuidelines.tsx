'use client';

import React, { useState } from 'react';

// Types for guidelines
export interface GuidelineItem {
  id: string;
  title: string;
  description: string;
  category: GuidelineCategory;
}

export type GuidelineCategory = 'content' | 'behavior' | 'formatting' | 'legal';

export interface ValidationResult {
  isValid: boolean;
  issues: {
    type: 'prohibited' | 'warning' | 'suggestion';
    field: string;
    message: string;
    position?: { start: number; end: number };
    suggestion?: string;
  }[];
}

interface ContentGuidelinesProps {
  contentType?: 'text' | 'image' | 'link' | 'poll';
  onValidationComplete?: (result: ValidationResult) => void;
  compact?: boolean;
}

/**
 * Community content guidelines component that displays rules and
 * helps validate content against community standards
 */
export function ContentGuidelines({
  contentType = 'text',
  onValidationComplete,
  compact = false,
}: ContentGuidelinesProps) {
  const [expandedCategory, setExpandedCategory] = useState<GuidelineCategory | null>(
    compact ? null : 'content'
  );

  // Sample guidelines - in a real implementation, these would come from the backend
  const guidelines: GuidelineItem[] = [
    {
      id: 'content-1',
      title: 'Keep it positive',
      description: 'Focus on constructive and positive contributions that align with the Success Kid ethos.',
      category: 'content',
    },
    {
      id: 'content-2',
      title: 'No spamming',
      description: 'Avoid repetitive posting or excessive self-promotion that doesn\'t add value to the community.',
      category: 'content',
    },
    {
      id: 'content-3',
      title: 'Authentic content',
      description: 'Share your original thoughts and ideas. Avoid plagiarism and properly attribute any external content.',
      category: 'content',
    },
    {
      id: 'behavior-1',
      title: 'Be respectful',
      description: 'Treat others with respect. No harassment, bullying, or personal attacks.',
      category: 'behavior',
    },
    {
      id: 'behavior-2',
      title: 'Inclusive atmosphere',
      description: 'Help create a welcoming environment for all community members regardless of background.',
      category: 'behavior',
    },
    {
      id: 'formatting-1',
      title: 'Clear headings',
      description: 'Use headings to organize longer content, making it easier for others to read and understand.',
      category: 'formatting',
    },
    {
      id: 'formatting-2',
      title: 'Quality media',
      description: 'Use clear, high-quality images that are relevant to your content.',
      category: 'formatting',
    },
    {
      id: 'legal-1',
      title: 'No illegal content',
      description: 'Do not post anything that violates laws or regulations.',
      category: 'legal',
    },
    {
      id: 'legal-2',
      title: 'Respect intellectual property',
      description: 'Only share content you have the rights to share.',
      category: 'legal',
    },
  ];

  // Filter guidelines by content type
  const filteredGuidelines = guidelines.filter((guideline) => {
    if (contentType === 'image' && guideline.id === 'formatting-2') return true;
    if (contentType === 'link' && guideline.id === 'content-3') return true;
    return guideline.category === 'content' || guideline.category === 'behavior' || guideline.category === 'legal';
  });

  // Group guidelines by category
  const groupedGuidelines = filteredGuidelines.reduce(
    (acc, guideline) => {
      if (!acc[guideline.category]) {
        acc[guideline.category] = [];
      }
      acc[guideline.category].push(guideline);
      return acc;
    },
    {} as Record<GuidelineCategory, GuidelineItem[]>
  );

  // Toggle category expansion
  const toggleCategory = (category: GuidelineCategory) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Get category icon
  const getCategoryIcon = (category: GuidelineCategory) => {
    switch (category) {
      case 'content':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        );
      case 'behavior':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        );
      case 'formatting':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
        );
      case 'legal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get category title
  const getCategoryTitle = (category: GuidelineCategory) => {
    switch (category) {
      case 'content':
        return 'Content Guidelines';
      case 'behavior':
        return 'Community Behavior';
      case 'formatting':
        return 'Formatting Tips';
      case 'legal':
        return 'Legal Requirements';
      default:
        return '';
    }
  };

  // If compact, just show a summary button
  if (compact) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setExpandedCategory(expandedCategory ? null : 'content')}
          className="text-sm text-primary hover:text-primary/80 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          {expandedCategory ? 'Hide' : 'View'} Community Guidelines
        </button>

        {expandedCategory && (
          <div className="mt-3 bg-muted/30 rounded-md p-3 text-sm">
            <h4 className="font-medium mb-2">Quick Guidelines</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Keep content positive and constructive</li>
              <li>Be respectful to all community members</li>
              <li>Share authentic, original content</li>
              <li>Respect intellectual property rights</li>
              <li>Avoid repetitive posting or spam</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Full guidelines display
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Community Guidelines</h3>
      <p className="text-muted-foreground text-sm">
        Our community thrives on positive, constructive contributions. 
        Please review these guidelines before posting.
      </p>

      {Object.entries(groupedGuidelines).map(([category, items]) => (
        <div key={category} className="border rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => toggleCategory(category as GuidelineCategory)}
            className="w-full p-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition"
          >
            <div className="flex items-center">
              <span className="mr-2 text-primary">
                {getCategoryIcon(category as GuidelineCategory)}
              </span>
              <span className="font-medium">{getCategoryTitle(category as GuidelineCategory)}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${
                expandedCategory === category ? 'transform rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedCategory === category && (
            <div className="p-3 space-y-3 border-t">
              {items.map((guideline) => (
                <div key={guideline.id} className="flex">
                  <div className="mr-2 text-success mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{guideline.title}</h4>
                    <p className="text-sm text-muted-foreground">{guideline.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="text-sm text-muted-foreground pt-2">
        Repeated violations of community guidelines may result in content removal or account restrictions.
      </div>
    </div>
  );
}

export default ContentGuidelines;
