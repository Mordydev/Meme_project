'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ContentType } from '@/types/community';
import { AlignLeft, Image, Link, BarChart2 } from 'lucide-react';

interface ContentTypeOption {
  id: ContentType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const contentTypes: ContentTypeOption[] = [
  {
    id: 'text',
    label: 'Text Post',
    description: 'Share your thoughts, ideas, or stories with the community.',
    icon: <AlignLeft className="h-6 w-6" />
  },
  {
    id: 'image',
    label: 'Image Post',
    description: 'Share photos, screenshots, memes, or other visual content.',
    icon: <Image className="h-6 w-6" />
  },
  {
    id: 'link',
    label: 'Link Post',
    description: 'Share an interesting link with your thoughts.',
    icon: <Link className="h-6 w-6" />
  },
  {
    id: 'poll',
    label: 'Poll',
    description: 'Ask a question and let the community vote on options.',
    icon: <BarChart2 className="h-6 w-6" />
  }
];

interface ContentTypeSelectorProps {
  selected: ContentType | null;
  onSelect: (type: ContentType) => void;
}

export function ContentTypeSelector({ selected, onSelect }: ContentTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Choose Content Type</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contentTypes.map((type) => (
          <Card 
            key={type.id}
            className={`
              p-4 cursor-pointer hover:border-primary transition-colors
              ${selected === type.id ? 'border-primary bg-primary-50' : ''}
            `}
            onClick={() => onSelect(type.id)}
          >
            <div className="flex items-start space-x-3">
              <div className={`
                flex-shrink-0 p-2 rounded-full 
                ${selected === type.id ? 'bg-primary-100 text-primary' : 'bg-gray-100 text-gray-600'}
              `}>
                {type.icon}
              </div>
              <div>
                <h3 className="font-medium">{type.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
