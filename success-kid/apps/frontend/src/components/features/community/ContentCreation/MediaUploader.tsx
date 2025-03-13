'use client';

import React, { useState, useRef } from 'react';

interface MediaUploaderProps {
  onUpload: (files: string[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  acceptedTypes?: string;
  maxSizeMB?: number;
  currentFiles?: string[];
}

/**
 * Component for uploading media files
 * 
 * Note: This is a simplified implementation. In a production environment,
 * you would integrate with a file upload service or backend API.
 */
export function MediaUploader({ 
  onUpload,
  onError,
  maxFiles = 4,
  acceptedTypes = 'image/*',
  maxSizeMB = 5,
  currentFiles = [],
}: MediaUploaderProps) {
  const [files, setFiles] = useState<string[]>(currentFiles);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    // Check if adding these files would exceed the max
    if (files.length + selectedFiles.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    // Process each file
    const newFiles: string[] = [...files];
    const filePromises: Promise<string>[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Validate file type
      if (!file.type.match(acceptedTypes.replace('*', ''))) {
        onError?.(`File type not allowed: ${file.type}`);
        continue;
      }
      
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        onError?.(`File too large: ${file.name}`);
        continue;
      }
      
      // Convert file to data URL for preview
      const filePromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
      
      filePromises.push(filePromise);
    }
    
    // When all files are processed
    Promise.all(filePromises).then((results) => {
      const updatedFiles = [...newFiles, ...results];
      setFiles(updatedFiles);
      onUpload(updatedFiles);
    });
  };
  
  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onUpload(newFiles);
  };
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };
  
  return (
    <div className="space-y-4">
      {/* Drag and drop area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted'}
          ${files.length >= maxFiles ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-muted/50'}
        `}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-muted-foreground">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          
          <div>
            <p className="text-base font-medium">
              {files.length >= maxFiles 
                ? 'Maximum files reached' 
                : 'Drag and drop your images here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {files.length >= maxFiles 
                ? `Remove an image to upload more` 
                : `Or click to select. Maximum ${maxFiles} images (${maxSizeMB}MB each)`}
            </p>
          </div>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple={maxFiles > 1}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={files.length >= maxFiles}
      />
      
      {/* File previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden bg-muted">
                <img 
                  src={file} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="absolute top-2 right-2 p-1 rounded-full bg-foreground/50 text-background hover:bg-foreground group-hover:opacity-100 opacity-0 transition-opacity"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaUploader;
