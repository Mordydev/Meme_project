'use client';

import { useState, useCallback } from 'react';
import { ContentType } from '@/types';

export interface ValidationIssue {
  type: 'prohibited' | 'warning' | 'suggestion';
  field: string;
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

/**
 * Hook for validating content against community guidelines
 */
export function useContentValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<ValidationResult | null>(null);

  /**
   * Validate content against community guidelines
   */
  const validateContent = useCallback(
    async ({
      title,
      content,
      type,
    }: {
      title: string;
      content: string;
      type: ContentType;
    }): Promise<ValidationResult> => {
      setIsValidating(true);

      try {
        // In a real implementation, this would call a backend API
        // We'll simulate an API call with timeout and some basic checks
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Extract plain text from HTML content
        const plainContent = content.replace(/<[^>]*>/g, ' ');

        // Simple validation logic - in production this would be more comprehensive
        const issues: ValidationIssue[] = [];

        // Check title length
        if (title.length < 5) {
          issues.push({
            type: 'warning',
            field: 'title',
            message: 'Titles should be at least 5 characters for better visibility',
          });
        }

        // Check for potentially problematic content
        const prohibitedPatterns = [
          { pattern: /\b(hate|stupid|idiot|dumb)\b/gi, field: 'content', type: 'prohibited' as const },
          { pattern: /\b(scam|spam|fraud)\b/gi, field: 'content', type: 'prohibited' as const },
          { pattern: /\b(wtf|stfu|damn)\b/gi, field: 'content', type: 'warning' as const },
        ];

        prohibitedPatterns.forEach(({ pattern, field, type }) => {
          let match;
          while ((match = pattern.exec(plainContent)) !== null) {
            issues.push({
              type,
              field,
              message: `Potentially ${type === 'prohibited' ? 'inappropriate' : 'concerning'} language detected`,
              position: { start: match.index, end: match.index + match[0].length },
              suggestion: type === 'prohibited' ? 'Please remove this term' : 'Consider using different wording',
            });
          }
        });

        // Check content length based on type
        if (type === 'text' && plainContent.length < 30) {
          issues.push({
            type: 'suggestion',
            field: 'content',
            message: 'Text posts are more engaging with detailed content',
            suggestion: 'Add more context or details to improve engagement',
          });
        }

        // Special check for link type
        if (type === 'link' && !plainContent.includes('http')) {
          issues.push({
            type: 'warning',
            field: 'content',
            message: 'Link posts should include a valid URL',
          });
        }

        const result = {
          isValid: issues.filter((issue) => issue.type === 'prohibited').length === 0,
          issues,
        };

        setLastResult(result);
        return result;
      } catch (error) {
        console.error('Content validation error:', error);
        
        // Return a generic error result
        const errorResult = {
          isValid: false,
          issues: [
            {
              type: 'warning' as const,
              field: 'general',
              message: 'Unable to validate content. Please review it yourself for compliance with guidelines.',
            },
          ],
        };
        
        setLastResult(errorResult);
        return errorResult;
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  return {
    validateContent,
    isValidating,
    lastResult,
  };
}

export default useContentValidation;
