'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, useUser } from '@clerk/nextjs';
import { Avatar } from '@/components/ui/avatar';

interface CommentEditorProps {
  contentId: string;
  parentCommentId?: string;
  onSubmit: (text: string, parentCommentId?: string) => Promise<boolean>;
  onCancel?: () => void;
}

export function CommentEditor({
  contentId,
  parentCommentId,
  onSubmit,
  onCancel,
}: CommentEditorProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isSignedIn) {
    return null;
  }
  
  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const success = await onSubmit(text, parentCommentId);
      
      if (success) {
        setText('');
        if (onCancel) {
          onCancel();
        }
      } else {
        setError('Failed to post comment. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error submitting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex gap-3">
      <Avatar
        src={user?.imageUrl}
        alt={user?.username || 'User'}
        fallback={(user?.username?.[0] || user?.firstName?.[0] || 'U').toUpperCase()}
        className="h-8 w-8 flex-shrink-0"
      />
      
      <div className="flex-1 space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Drop your thoughts..."
          className="min-h-[100px] w-full"
          disabled={isSubmitting}
        />
        
        {error && <p className="text-sm text-roast-red">{error}</p>}
        
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          
          <Button
            onClick={handleSubmit}
            size="sm"
            disabled={isSubmitting || !text.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
