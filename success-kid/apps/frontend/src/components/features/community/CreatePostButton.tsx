'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface CreatePostButtonProps {
  categoryId?: string;
  compact?: boolean;
  className?: string;
}

export function CreatePostButton({ 
  categoryId, 
  compact = false,
  className 
}: CreatePostButtonProps) {
  // Construct the URL with optional category param
  const href = categoryId
    ? `/community/create?categoryId=${categoryId}`
    : '/community/create';
  
  if (compact) {
    return (
      <Link href={href}>
        <Button 
          size="icon" 
          aria-label="Create post"
          className={className}
        >
          <PlusCircle size={20} />
        </Button>
      </Link>
    );
  }
  
  return (
    <Link href={href}>
      <Button 
        className={className}
      >
        <PlusCircle size={18} className="mr-2" />
        Create Post
      </Button>
    </Link>
  );
}
