'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Image, Upload, Camera, FileText, Plus } from 'lucide-react';

export interface MediaFile {
  id: string;
  file: File;
  previewUrl: string;
  uploading: boolean;
  progress: number;
  error?: string;
  uploaded?: boolean;
  url?: string;
}

interface MediaUploadProps {
  files: MediaFile[];
  onChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string;
}

export function MediaUpload({ 
  files, 
  onChange, 
  maxFiles = 5, 
  acceptedTypes = "image/*"
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    // Don't exceed max files limit
    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) return;
    
    const filesToProcess = Array.from(selectedFiles).slice(0, remainingSlots);
    
    const newFiles: MediaFile[] = filesToProcess.map(file => {
      const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        id,
        file,
        previewUrl: URL.createObjectURL(file),
        uploading: false,
        progress: 0
      };
    });
    
    onChange([...files, ...newFiles]);
  };
  
  const removeFile = (id: string) => {
    const newFiles = files.filter(file => file.id !== id);
    // Revoke the object URL to avoid memory leaks
    const fileToRemove = files.find(file => file.id === id);
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    onChange(newFiles);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Drag & drop area */}
      <div 
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-300'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        role="button"
        tabIndex={0}
        aria-label="Upload media"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple={maxFiles > 1}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-10 w-10 text-gray-400 mb-3" />
          <p className="font-medium text-sm">Drag and drop your files here</p>
          <p className="text-gray-500 text-xs mt-1">or click to browse</p>
          <p className="text-gray-400 text-xs mt-2">
            {files.length}/{maxFiles} files • {acceptedTypes.replace('/*', ' files')}
          </p>
        </div>
      </div>
      
      {/* Preview area */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="relative rounded-md border overflow-hidden group"
            >
              {file.file.type.startsWith('image/') ? (
                <img 
                  src={file.previewUrl} 
                  alt="Preview" 
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
              )}
              
              {file.uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-full px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-white text-xs text-center mt-1">
                      {Math.round(file.progress)}%
                    </p>
                  </div>
                </div>
              )}
              
              {file.error && (
                <div className="absolute bottom-0 inset-x-0 bg-red-500 text-white text-xs p-1 text-center">
                  {file.error}
                </div>
              )}
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white 
                           opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {files.length < maxFiles && (
            <button
              type="button"
              onClick={triggerFileInput}
              className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center h-32 
                        hover:border-primary-300 transition-colors"
              aria-label="Add more files"
            >
              <Plus className="h-6 w-6 text-gray-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
