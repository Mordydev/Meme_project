'use client';

import React, { useMemo } from 'react';
import { ContentFormData } from '@/types/content-creation';
import { Card } from '@/components/ui/card';
import { TrendingUp, Award, Lightbulb } from 'lucide-react';
import CoinIcon from '@/components/ui/icons/CoinIcon';

interface RewardsPreviewProps {
  formData: ContentFormData;
}

export function RewardsPreview({ formData }: RewardsPreviewProps) {
  // Calculate potential points based on content quality and type
  const potentialPoints = useMemo(() => {
    // Base points for different content types
    const basePoints = {
      text: 10,
      image: 15,
      link: 10,
      poll: 20
    };
    
    let points = basePoints[formData.type] || 10;
    
    // Additional points for longer content (text posts)
    if (formData.type === 'text' && formData.body) {
      const textLength = formData.body.replace(/<[^>]*>/g, '').length; // Remove HTML tags
      if (textLength > 500) points += 10;
      else if (textLength > 200) points += 5;
    }
    
    // Points for adding media
    if (formData.media && formData.media.length > 0) {
      points += Math.min(formData.media.length * 2, 10); // Up to 10 extra points for media
    }
    
    // Points for adding tags
    if (formData.tags && formData.tags.length > 0) {
      points += formData.tags.length; // 1 point per tag
    }
    
    // Consider poll options
    if (formData.type === 'poll' && formData.pollOptions && formData.pollOptions.length > 2) {
      points += (formData.pollOptions.length - 2) * 2; // 2 points per additional option
    }
    
    // Points for having a title
    if (formData.title && formData.title.trim().length > 10) {
      points += 5;
    }
    
    return points;
  }, [formData]);
  
  // Quality factors that would influence points
  const qualityFactors = useMemo(() => {
    const factors = [];
    
    if (formData.title && formData.title.length > 20) {
      factors.push({ label: 'Descriptive title', points: 5 });
    }
    
    if (formData.body && formData.body.length > 200) {
      factors.push({ label: 'Substantial content', points: 5 });
    }
    
    if (formData.media && formData.media.length > 0) {
      factors.push({ label: 'Added media', points: formData.media.length * 2 });
    }
    
    if (formData.tags && formData.tags.length > 2) {
      factors.push({ label: 'Well-tagged', points: formData.tags.length });
    }
    
    if (formData.categoryId) {
      factors.push({ label: 'Categorized', points: 5 });
    }
    
    if (formData.type === 'poll' && formData.pollOptions && formData.pollOptions.length > 3) {
      factors.push({ label: 'Multiple poll options', points: (formData.pollOptions.length - 2) * 2 });
    }
    
    return factors;
  }, [formData]);
  
  // Tips for improving rewards based on current content
  const improvementTips = useMemo(() => {
    const tips = [];
    
    if (!formData.title || formData.title.length < 20) {
      tips.push('Add a more descriptive title');
    }
    
    if (formData.type === 'text' && (!formData.body || formData.body.length < 200)) {
      tips.push('Expand your content with more details');
    }
    
    if (!formData.media || formData.media.length === 0) {
      tips.push('Add relevant images to enhance engagement');
    }
    
    if (!formData.tags || formData.tags.length < 3) {
      tips.push('Add more tags to improve discovery');
    }
    
    if (!formData.categoryId) {
      tips.push('Select a category for your content');
    }
    
    if (formData.type === 'poll' && formData.pollOptions && formData.pollOptions.length < 4) {
      tips.push('Add more poll options for better engagement');
    }
    
    return tips;
  }, [formData]);
  
  return (
    <Card className="p-4 border-primary-100 bg-primary-50">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-primary-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Potential Rewards
          </h3>
          <div className="flex items-baseline mt-2">
            <span className="text-2xl font-bold text-primary">{potentialPoints}</span>
            <span className="ml-1 text-sm text-primary-800">Success Points</span>
          </div>
        </div>
        <div className="bg-white p-2 rounded-full border border-primary-100">
          <CoinIcon className="h-6 w-6 text-secondary" />
        </div>
      </div>
      
      {qualityFactors.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-primary-900 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Quality Factors
          </h4>
          <ul className="mt-1 space-y-1">
            {qualityFactors.map((factor, index) => (
              <li key={index} className="text-xs text-primary-800 flex justify-between">
                <span>{factor.label}</span>
                <span>+{factor.points} pts</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {improvementTips.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-primary-900 flex items-center gap-1">
            <Lightbulb className="h-4 w-4" />
            Tips to Earn More
          </h4>
          <ul className="mt-1 space-y-1">
            {improvementTips.map((tip, index) => (
              <li key={index} className="text-xs text-primary-800 flex items-start gap-1">
                <span>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
