'use client';

import React, { useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  toolbarOptions?: EditorToolbarOption[];
  minHeight?: string;
  maxHeight?: string;
}

// Available toolbar options
export type EditorToolbarOption = 
  | 'bold' 
  | 'italic' 
  | 'underline' 
  | 'link'
  | 'list';

/**
 * Simple rich text editor component
 * 
 * This is a simplified version. In a real implementation,
 * you would use a library like TipTap, Slate, or DraftJS.
 */
export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Write your post here...',
  toolbarOptions = ['bold', 'italic', 'underline', 'link', 'list'],
  minHeight = '200px',
  maxHeight = '500px'
}: RichTextEditorProps) {
  // Track if editor has focus
  const [isFocused, setIsFocused] = useState(false);
  
  // For a simple implementation, we're just using a textarea
  // A real rich text editor would use a contenteditable div or a library
  return (
    <div className="border rounded-md bg-card overflow-hidden">
      {/* Toolbar */}
      <div className={`flex items-center px-3 py-2 border-b gap-1 ${isFocused ? 'border-primary/30' : 'border-border'}`}>
        {toolbarOptions.includes('bold') && (
          <button
            type="button"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Bold"
            onClick={() => {
              // In a real implementation, this would apply bold formatting
              // For this example, we'll just surround selected text with **
              const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = value.substring(start, end);
                const newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
                onChange(newText);
                
                // Restore focus after the action
                setTimeout(() => {
                  textarea.focus();
                  textarea.setSelectionRange(start + 2, end + 2);
                }, 0);
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </button>
        )}
        
        {toolbarOptions.includes('italic') && (
          <button
            type="button"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Italic"
            onClick={() => {
              // Add italic formatting (simplified)
              const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = value.substring(start, end);
                const newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
                onChange(newText);
                
                setTimeout(() => {
                  textarea.focus();
                  textarea.setSelectionRange(start + 1, end + 1);
                }, 0);
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        )}
        
        {toolbarOptions.includes('underline') && (
          <button
            type="button"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Underline"
            onClick={() => {
              // Add underline formatting (simplified)
              const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = value.substring(start, end);
                const newText = value.substring(0, start) + `__${selectedText}__` + value.substring(end);
                onChange(newText);
                
                setTimeout(() => {
                  textarea.focus();
                  textarea.setSelectionRange(start + 2, end + 2);
                }, 0);
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          </button>
        )}
        
        {toolbarOptions.includes('link') && (
          <button
            type="button"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Link"
            onClick={() => {
              // Add link formatting (simplified)
              const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = value.substring(start, end);
                const url = prompt('Enter link URL:', 'https://');
                
                if (url) {
                  const newText = value.substring(0, start) + `[${selectedText}](${url})` + value.substring(end);
                  onChange(newText);
                  
                  setTimeout(() => {
                    textarea.focus();
                  }, 0);
                }
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </button>
        )}
        
        {toolbarOptions.includes('list') && (
          <button
            type="button"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="List"
            onClick={() => {
              // Add list formatting (simplified)
              const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
              if (textarea) {
                const start = textarea.selectionStart;
                const selected = value.substring(start, textarea.selectionEnd);
                
                // Split selected text by line
                const lines = selected.split('\n');
                const bulletList = lines.map(line => `- ${line}`).join('\n');
                
                const newText = value.substring(0, start) + bulletList + value.substring(textarea.selectionEnd);
                onChange(newText);
                
                setTimeout(() => {
                  textarea.focus();
                }, 0);
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Editor */}
      <textarea
        id="rich-text-editor"
        className="w-full p-3 focus:outline-none bg-card resize-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          minHeight,
          maxHeight,
        }}
      />
      
      {/* Bottom bar with character count */}
      <div className="flex justify-end px-3 py-2 text-xs text-muted-foreground border-t">
        {value.length} characters
      </div>
    </div>
  );
}

export default RichTextEditor;
