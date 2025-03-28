// components/media/MediaUploader.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button'; // Using the defined '@/' alias
import { Progress } from '@/components/ui/progress'; // Using the defined '@/' alias
import Image from 'next/image';
import { Upload } from 'lucide-react'; // Assuming lucide-react is installed

interface MediaUploaderProps {
  onUploadComplete: (result: { id: string; url: string; path: string; }) => void; // Added path to result
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function MediaUploader({
  onUploadComplete,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] // Added gif based on backend service
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type and size
    if (!acceptedTypes.includes(selectedFile.type)) {
      setError(`File type not supported. Please use: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`);
      return;
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setPreview(null); // Reset preview on new file selection

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => { // Use onloadend to ensure result is ready
          if (reader.result) {
             setPreview(reader.result as string);
          } else {
             setError("Could not generate image preview.");
             setFile(null); // Clear file if preview fails
          }
      };
       reader.onerror = () => {
           setError("Error reading file for preview.");
           setFile(null);
       };
      reader.readAsDataURL(selectedFile);
    } else {
        // Handle non-image file previews if necessary, or just show filename
        setPreview(null);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null); // Clear previous errors
      setProgress(10); // Initial progress indicator

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress updates (replace with actual progress if available)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      // --- API Call ---
      // Assuming an API endpoint '/api/media/upload' exists
      // This endpoint should handle receiving the file, calling the backend BlobService,
      // creating the media record in the DB via MediaRepository, and returning the result.
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
        // Headers might be needed depending on API setup (e.g., Authorization)
      });

      clearInterval(progressInterval); // Stop simulation

      if (!response.ok) {
        // Try to parse error message from backend
        let errorMsg = 'Upload failed. Please try again.';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (parseError) {
            // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }

      setProgress(100);
      const result = await response.json(); // Expecting { data: { id, url, path } }

      // --- Upload Complete ---
      if (result.data && result.data.id && result.data.url && result.data.path) {
        // Notify parent component
        onUploadComplete({
          id: result.data.id,
          url: result.data.url,
          path: result.data.path // Pass path back if needed
        });

        // Reset state after a short delay
        setTimeout(() => {
          setUploading(false);
          setFile(null);
          setPreview(null);
          setProgress(0);
        }, 500);
      } else {
          throw new Error("Invalid response received from server.");
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMsg);
      setUploading(false);
      setProgress(0); // Reset progress on error
    }
  };

  const resetState = () => {
      setFile(null);
      setPreview(null);
      setError(null);
      setUploading(false);
      setProgress(0);
      // Also clear the input value if possible, requires ref
      // const input = document.getElementById('file-upload') as HTMLInputElement;
      // if (input) input.value = '';
  }

  return (
    <div className="w-full p-4 border rounded-lg shadow-sm">
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors duration-200">
          <input
            type="file"
            id="file-upload"
            className="sr-only"
            onChange={handleFileChange}
            accept={acceptedTypes.join(',')}
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className="h-12 w-12 text-gray-400" />
            <span className="mt-2 text-sm font-medium text-gray-700">
              Drop your file here, or{' '}
              <span className="text-primary font-semibold">browse</span>
            </span>
            <span className="mt-1 text-xs text-gray-500">
              Max {maxSizeMB}MB. Formats: {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File preview */}
          {preview ? (
            <div className="relative h-48 bg-gray-100 rounded overflow-hidden">
              <Image
                src={preview}
                alt="Upload preview"
                fill
                className="object-contain rounded"
              />
            </div>
          ) : (
             <div className="h-48 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                No preview available for this file type.
             </div>
          )}

          {/* File info */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700 truncate pr-2">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetState}
              disabled={uploading}
              className="text-gray-600 hover:text-red-600"
            >
              Cancel
            </Button>
          </div>

          {/* Upload progress */}
          {uploading && <Progress value={progress} className="h-2 [&>div]:bg-primary" />}

          {/* Error message */}
          {error && (
            <div className="text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || !!error} // Disable if uploading or if there's an error shown
            className="w-full bg-primary hover:bg-primary/90"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      )}
    </div>
  );
}
