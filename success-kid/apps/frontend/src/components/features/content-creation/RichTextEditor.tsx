'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  Heading, 
  Link as LinkIcon, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  Quote
} from 'lucide-react';

interface ToolbarButtonProps {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function ToolbarButton({ active, icon, label, onClick }: ToolbarButtonProps) {
  return (
    <Button 
      type="button"
      variant="ghost" 
      size="sm" 
      className={`h-8 px-2 text-gray-700 ${active ? 'bg-gray-200' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </Button>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Write something...', 
  minHeight = '200px',
  className = '' 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Basic formatting commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateValue();
  };
  
  const updateValue = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  // Initialize with value
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);
  
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateValue();
  };
  
  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };
  
  const insertImage = () => {
    // In a real implementation, this would open a media selector
    // For now, just prompt for a URL
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };
  
  return (
    <div className={`border rounded-md ${isFocused ? 'ring-2 ring-primary-200' : ''} ${className}`}>
      <div className="flex flex-wrap items-center border-b p-1 bg-gray-50">
        <ToolbarButton 
          icon={<Bold size={16} />} 
          label="Bold" 
          onClick={() => execCommand('bold')} 
        />
        <ToolbarButton 
          icon={<Italic size={16} />} 
          label="Italic" 
          onClick={() => execCommand('italic')} 
        />
        <ToolbarButton 
          icon={<Heading size={16} />} 
          label="Heading" 
          onClick={() => execCommand('formatBlock', '<h2>')} 
        />
        <ToolbarButton 
          icon={<List size={16} />} 
          label="Bullet List" 
          onClick={() => execCommand('insertUnorderedList')} 
        />
        <ToolbarButton 
          icon={<AlignLeft size={16} />} 
          label="Align Left" 
          onClick={() => execCommand('justifyLeft')} 
        />
        <ToolbarButton 
          icon={<AlignCenter size={16} />} 
          label="Align Center" 
          onClick={() => execCommand('justifyCenter')} 
        />
        <ToolbarButton 
          icon={<Quote size={16} />} 
          label="Quote" 
          onClick={() => execCommand('formatBlock', '<blockquote>')} 
        />
        <ToolbarButton 
          icon={<LinkIcon size={16} />} 
          label="Insert Link" 
          onClick={insertLink} 
        />
        <ToolbarButton 
          icon={<ImageIcon size={16} />} 
          label="Insert Image" 
          onClick={insertImage} 
        />
      </div>
      
      <div
        ref={editorRef}
        className="p-3 focus:outline-none prose prose-sm max-w-none"
        style={{ minHeight }}
        contentEditable
        onBlur={() => {
          setIsFocused(false);
          updateValue();
        }}
        onFocus={() => setIsFocused(true)}
        onInput={updateValue}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        aria-label="Content editor"
        data-placeholder={placeholder}
      />
    </div>
  );
}
