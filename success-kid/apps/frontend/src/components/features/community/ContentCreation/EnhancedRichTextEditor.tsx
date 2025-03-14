'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

interface EnhancedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autofocus?: boolean;
  minHeight?: string;
  maxHeight?: string;
  maxLength?: number;
  onDraftSave?: () => void;
}

/**
 * Enhanced Rich Text Editor using TipTap
 * 
 * A more robust rich text editor implementation with proper formatting
 * tools and content management.
 */
export function EnhancedRichTextEditor({
  value,
  onChange,
  placeholder = 'Write your post here...',
  autofocus = false,
  minHeight = '200px',
  maxHeight = '500px',
  maxLength = 10000,
  onDraftSave,
}: EnhancedRichTextEditorProps) {
  // Track if content has been modified for auto-save functionality
  const [modified, setModified] = useState(false);
  
  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-md',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: value,
    autofocus,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setModified(true);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none p-4',
        style: `min-height: ${minHeight}; max-height: ${maxHeight}; overflow-y: auto;`,
      },
    },
  });
  
  // Auto-save functionality
  useEffect(() => {
    if (!modified || !onDraftSave) return;
    
    // Set up auto-save timer
    const timer = setTimeout(() => {
      onDraftSave();
      setModified(false);
    }, 5000); // Auto-save after 5 seconds of inactivity
    
    return () => clearTimeout(timer);
  }, [modified, onDraftSave]);
  
  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);
  
  // Toolbar button component
  const ToolbarButton = useCallback(
    ({ onClick, icon, active, disabled, title }: { 
      onClick: () => void; 
      icon: React.ReactNode; 
      active?: boolean; 
      disabled?: boolean;
      title: string;
    }) => (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 rounded-md transition ${
          active 
            ? 'bg-primary/10 text-primary' 
            : disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        {icon}
      </button>
    ),
    []
  );
  
  if (!editor) {
    return <div className="border rounded-md bg-muted animate-pulse h-44"></div>;
  }
  
  return (
    <div className="border rounded-md overflow-hidden">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center px-3 py-2 border-b gap-1 bg-card">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z" 
                fill="currentColor"/>
            </svg>
          }
        />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15z" fill="currentColor"/>
            </svg>
          }
        />
        
        <div className="w-px h-6 bg-border mx-1"></div>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M17 11V4h2v17h-2v-8H7v8H5V4h2v7z" fill="currentColor"/>
            </svg>
          }
        />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M8 4h13v2H8V4zM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM8 11h13v2H8v-2zm0 7h13v2H8v-2z" 
                fill="currentColor"/>
            </svg>
          }
        />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M8 4h13v2H8V4zM5 3v3h1v1H3V6h1V4H3V3h2zm-2 7h3.25v1.25H4.75v1h1.5V14H3v-1h1.75v-.25H3v-1.5h3v-1H3v-1h3v1zm2 7v3h1v1H3v-1h1v-1H3v-1h2zm7 0h13v2H12v-2zm0-7h13v2H12v-2z" 
                fill="currentColor"/>
            </svg>
          }
        />
        
        <div className="w-px h-6 bg-border mx-1"></div>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" 
                fill="currentColor"/>
            </svg>
          }
        />
        
        <ToolbarButton
          onClick={() => {
            // Prompt for URL
            const url = prompt('Enter link URL:');
            
            // If URL is provided, set the link
            if (url) {
              // Check if link has http/https protocol; add it if missing
              const validUrl = url.startsWith('http://') || url.startsWith('https://')
                ? url
                : `https://${url}`;
              
              editor.chain().focus().setLink({ href: validUrl }).run();
            } else if (url === '') {
              // If empty string, remove the link
              editor.chain().focus().unsetLink().run();
            }
          }}
          active={editor.isActive('link')}
          title="Link"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.828l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07z" 
                fill="currentColor"/>
            </svg>
          }
        />
        
        <div className="w-px h-6 bg-border mx-1"></div>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 1 0 0-12H5.828z" 
                fill="currentColor"/>
            </svg>
          }
        />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M18.172 7H11a6 6 0 1 0 0 12h9v2h-9a8 8 0 1 1 0-16h7.172l-2.536-2.536L17.05 1.05 22 6l-4.95 4.95-1.414-1.414L18.172 7z" 
                fill="currentColor"/>
            </svg>
          }
        />
      </div>
      
      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-card" />
      
      {/* Bubble menu for text selection */}
      {editor && (
        <BubbleMenu editor={editor} className="bg-popover rounded-md shadow-md p-1 border">
          <div className="flex">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z" 
                    fill="currentColor"/>
                </svg>
              }
            />
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15z" fill="currentColor"/>
                </svg>
              }
            />
            
            <ToolbarButton
              onClick={() => {
                const url = prompt('Enter link URL:');
                if (url) {
                  // Check if link has http/https protocol; add it if missing
                  const validUrl = url.startsWith('http://') || url.startsWith('https://')
                    ? url
                    : `https://${url}`;
                  
                  editor.chain().focus().setLink({ href: validUrl }).run();
                }
              }}
              active={editor.isActive('link')}
              title="Link"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-4 h-4">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.828l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07z" 
                    fill="currentColor"/>
                </svg>
              }
            />
          </div>
        </BubbleMenu>
      )}
      
      {/* Character count */}
      <div className="flex justify-between items-center px-3 py-2 text-xs text-muted-foreground border-t">
        <div>
          {editor.storage.characterCount.characters()} / {maxLength} characters
        </div>
        {modified && onDraftSave && (
          <div className="text-success animate-pulse">
            Auto-saving...
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedRichTextEditor;
