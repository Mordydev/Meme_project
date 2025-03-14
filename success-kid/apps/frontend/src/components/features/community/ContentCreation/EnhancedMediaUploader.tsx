'use client';

import React, { useState, useRef } from 'react';
import { MediaOptimizer } from './MediaOptimizer';

interface EnhancedMediaUploaderProps {
  onUpload: (files: string[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  acceptedTypes?: string;
  maxSizeMB?: number;
  currentFiles?: string[];
}

/**
 * Enhanced media uploader with optimization features
 */
export function EnhancedMediaUploader({
  onUpload,
  onError,
  maxFiles = 4,
  acceptedTypes = 'image/*',
  maxSizeMB = 5,
  currentFiles = [],
}: EnhancedMediaUploaderProps) {
  const [files, setFiles] = useState<string[]>(currentFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [fileToOptimize, setFileToOptimize] = useState<File | null>(null);
  const [optimizationVisible, setOptimizationVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
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
    Array.from(selectedFiles).forEach((file) => {
      // Validate file type
      if (!file.type.match(acceptedTypes.replace('*', ''))) {
        onError?.(`File type not allowed: ${file.type}`);
        return;
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        onError?.(`File too large: ${file.name}`);
        return;
      }

      // If it's an image and over 1MB, offer optimization
      if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
        setFileToOptimize(file);
        setOptimizationVisible(true);
      } else {
        // Otherwise, process normally
        processFile(file);
      }
    });
  };

  // Process file (convert to data URL)
  const processFile = (file: File) => {
    const fileId = `file_${Date.now()}`;
    setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const currentProgress = prev[fileId] || 0;
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          return prev;
        }
        const newProgress = Math.min(currentProgress + 10, 95);
        return { ...prev, [fileId]: newProgress };
      });
    }, 200);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        clearInterval(progressInterval);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
        
        setTimeout(() => {
          const newFiles = [...files, e.target!.result as string];
          setFiles(newFiles);
          onUpload(newFiles);
          setUploadProgress((prev) => {
            const { [fileId]: _, ...rest } = prev;
            return rest;
          });
        }, 300);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle optimized file
  const handleOptimizedFile = (optimizedFile: File) => {
    processFile(optimizedFile);
    setFileToOptimize(null);
    setOptimizationVisible(false);
  };

  // Cancel optimization
  const handleCancelOptimization = () => {
    if (fileToOptimize) {
      processFile(fileToOptimize);
    }
    setFileToOptimize(null);
    setOptimizationVisible(false);
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

  // Render optimization dialog
  if (optimizationVisible && fileToOptimize) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <MediaOptimizer
          file={fileToOptimize}
          onOptimized={handleOptimizedFile}
          onCancel={handleCancelOptimization}
          maxWidth={1600}
          maxHeight={1600}
          quality={0.85}
        />
      </div>
    );
  }

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

      {/* Progress indicators */}
      {Object.entries(uploadProgress).map(([id, progress]) => (
        <div key={id} className="bg-muted/50 rounded-md overflow-hidden">
          <div className="flex items-center p-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm">Uploading image...</span>
                <span className="text-sm">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full overflow-hidden h-2">
                <div
                  className="bg-primary h-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

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

export default EnhancedMediaUploader;
