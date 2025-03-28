'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Link, 
  Image as ImageIcon,
  AtSign,
  SmilePlus,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  parentId?: string;
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
  minHeight?: number;
}

export function CommentForm({
  onSubmit,
  parentId,
  placeholder = 'Add a comment...',
  initialValue = '',
  autoFocus = false,
  className = '',
  disabled = false,
  minHeight = 100
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle textarea auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
    };
    
    adjustHeight();
    
    textarea.addEventListener('input', adjustHeight);
    window.addEventListener('resize', adjustHeight);
    
    return () => {
      textarea.removeEventListener('input', adjustHeight);
      window.removeEventListener('resize', adjustHeight);
    };
  }, [content, minHeight]);
  
  // Focus textarea when autoFocus is true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || disabled || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      onSubmit(content.trim());
      setContent('');
      setIsFocused(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setContent('');
    setIsFocused(false);
    textareaRef.current?.blur();
  };
  
  // Text formatting helpers
  const formatText = (formatType: 'bold' | 'italic' | 'link' | 'mention') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    let newCursorPos = 0;
    
    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        newCursorPos = start + 2 + selectedText.length;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        newCursorPos = start + 1 + selectedText.length;
        break;
      case 'link':
        formattedText = selectedText ? `[${selectedText}](url)` : '[Link text](url)';
        newCursorPos = start + selectedText.length + 7;
        break;
      case 'mention':
        formattedText = `@${selectedText}`;
        newCursorPos = start + 1 + selectedText.length;
        break;
    }
    
    const newContent = 
      content.substring(0, start) + 
      formattedText + 
      content.substring(end);
    
    setContent(newContent);
    
    // Focus and set cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            U
          </div>
        </div>
        
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "resize-none transition-all duration-200 min-h-[40px]",
                isFocused && "min-h-[100px]"
              )}
              style={{ 
                minHeight: isFocused ? `${minHeight}px` : '40px',
              }}
              onFocus={() => setIsFocused(true)}
              disabled={disabled || isSubmitting}
            />
            
            {/* Formatting toolbar - only visible when focused */}
            {isFocused && (
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => formatText('bold')}
                    tabIndex={-1}
                  >
                    <Bold size={15} />
                    <span className="sr-only">Bold</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => formatText('italic')}
                    tabIndex={-1}
                  >
                    <Italic size={15} />
                    <span className="sr-only">Italic</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => formatText('link')}
                    tabIndex={-1}
                  >
                    <Link size={15} />
                    <span className="sr-only">Link</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => formatText('mention')}
                    tabIndex={-1}
                  >
                    <AtSign size={15} />
                    <span className="sr-only">Mention</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    tabIndex={-1}
                  >
                    <SmilePlus size={15} />
                    <span className="sr-only">Emoji</span>
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7"
                    disabled={!content.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
      
      {/* Character count - only visible when content exists */}
      {content.length > 0 && isFocused && (
        <div className="text-xs text-muted-foreground text-right">
          {content.length} characters
        </div>
      )}
    </div>
  );
}
