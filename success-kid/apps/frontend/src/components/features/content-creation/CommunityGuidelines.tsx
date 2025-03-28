'use client';

import React, { useState, useEffect } from 'react';
import { ContentFormData, ContentGuidelineItem } from '@/types/content-creation';
import { Card } from '@/components/ui/card';
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, CheckCircle, Shield } from 'lucide-react';

// Mock guidelines data
const COMMUNITY_GUIDELINES: ContentGuidelineItem[] = [
  {
    id: 'guide_respect',
    title: 'Be Respectful',
    description: 'Treat all members with respect, even in disagreement. No personal attacks, harassment, or hate speech.',
    category: 'behavior'
  },
  {
    id: 'guide_quality',
    title: 'Prioritize Quality',
    description: 'Focus on creating valuable, well-crafted content that contributes to the community.',
    category: 'content'
  },
  {
    id: 'guide_spam',
    title: 'No Spam or Self-Promotion',
    description: 'Avoid repetitive posting, excessive self-promotion, or content without value.',
    category: 'behavior'
  },
  {
    id: 'guide_illegal',
    title: 'No Illegal Content',
    description: 'Don\'t share content that violates laws or promotes illegal activities.',
    category: 'prohibited'
  },
  {
    id: 'guide_accuracy',
    title: 'Aim for Accuracy',
    description: 'Verify facts when possible and clearly distinguish between facts and opinions.',
    category: 'content'
  },
  {
    id: 'guide_privacy',
    title: 'Respect Privacy',
    description: 'Don\'t share private information about yourself or others without consent.',
    category: 'prohibited'
  }
];

interface CommunityGuidelinesProps {
  formData: ContentFormData;
}

export function CommunityGuidelines({ formData }: CommunityGuidelinesProps) {
  const [expanded, setExpanded] = useState(false);
  const [relevantGuidelines, setRelevantGuidelines] = useState<ContentGuidelineItem[]>([]);
  
  // Mock content analysis to determine most relevant guidelines
  useEffect(() => {
    // In a real implementation, this would analyze the content to find potential issues
    // For now, we'll just show different guidelines based on content type
    
    const guidelines = [];
    
    // Always include the respect guideline
    guidelines.push(COMMUNITY_GUIDELINES.find(g => g.id === 'guide_respect')!);
    
    // Add quality guideline for text posts
    if (formData.type === 'text') {
      guidelines.push(COMMUNITY_GUIDELINES.find(g => g.id === 'guide_quality')!);
    }
    
    // Add accuracy guideline for links
    if (formData.type === 'link') {
      guidelines.push(COMMUNITY_GUIDELINES.find(g => g.id === 'guide_accuracy')!);
    }
    
    // Add spam guideline for polls or if many tags are used
    if (formData.type === 'poll' || (formData.tags && formData.tags.length > 5)) {
      guidelines.push(COMMUNITY_GUIDELINES.find(g => g.id === 'guide_spam')!);
    }
    
    // Simple content analysis (just checking for keywords in this mock version)
    const contentText = formData.body?.toLowerCase() || '';
    if (contentText.includes('private') || contentText.includes('personal')) {
      guidelines.push(COMMUNITY_GUIDELINES.find(g => g.id === 'guide_privacy')!);
    }
    
    if (contentText.includes('illegal') || contentText.includes('hack')) {
      guidelines.push(COMMUNITY_GUIDELINES.find(g => g.id === 'guide_illegal')!);
    }
    
    // Remove duplicates and limit to 3 guidelines for the collapsed view
    const uniqueGuidelines = Array.from(new Set(guidelines));
    setRelevantGuidelines(uniqueGuidelines);
  }, [formData]);
  
  // Helper to get icon based on guideline category
  const getGuidelineIcon = (category: string) => {
    switch (category) {
      case 'prohibited':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'behavior':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'content':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="overflow-hidden border-gray-200">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 border-b"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gray-700" />
          <h3 className="font-medium">Community Guidelines</h3>
        </div>
        <button className="text-gray-500">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>
      
      <div className={`p-4 bg-white transition-all ${expanded ? 'max-h-96 overflow-y-auto' : 'max-h-40 overflow-hidden'}`}>
        {/* Always show most relevant guidelines */}
        <ul className="space-y-3">
          {(expanded ? COMMUNITY_GUIDELINES : relevantGuidelines).map(guideline => (
            <li key={guideline.id} className="flex gap-2">
              {getGuidelineIcon(guideline.category)}
              <div>
                <h4 className="text-sm font-medium">{guideline.title}</h4>
                <p className="text-xs text-gray-600 mt-0.5">{guideline.description}</p>
              </div>
            </li>
          ))}
        </ul>
        
        {!expanded && COMMUNITY_GUIDELINES.length > relevantGuidelines.length && (
          <p className="text-xs text-center text-gray-500 mt-4">
            + {COMMUNITY_GUIDELINES.length - relevantGuidelines.length} more guidelines
          </p>
        )}
      </div>
    </Card>
  );
}
