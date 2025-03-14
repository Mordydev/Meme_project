'use client';

import React, { useState, useCallback } from 'react';

interface MediaOptimizerProps {
  file: File;
  onOptimized: (optimizedFile: File) => void;
  onCancel: () => void;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maintainAspectRatio?: boolean;
}

/**
 * Component for optimizing media files before upload
 */
export function MediaOptimizer({
  file,
  onOptimized,
  onCancel,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85,
  maintainAspectRatio = true,
}: MediaOptimizerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState({
    width: maxWidth,
    height: maxHeight,
    quality,
  });

  // Create preview of the original file
  React.useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, [file]);

  // Update quality setting
  const handleQualityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuality = Number(e.target.value) / 100;
    setOptimizationSettings((prev) => ({
      ...prev,
      quality: newQuality,
    }));
  }, []);

  // Optimize the image
  const optimizeImage = useCallback(async () => {
    if (!file || !preview) return;
    setIsOptimizing(true);
    setError(null);

    try {
      // Create an image element to get dimensions
      const img = new Image();
      img.src = preview;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Calculate new dimensions
      let newWidth = img.width;
      let newHeight = img.height;

      if (maintainAspectRatio) {
        const aspectRatio = img.width / img.height;

        if (newWidth > optimizationSettings.width) {
          newWidth = optimizationSettings.width;
          newHeight = Math.round(newWidth / aspectRatio);
        }

        if (newHeight > optimizationSettings.height) {
          newHeight = optimizationSettings.height;
          newWidth = Math.round(newHeight * aspectRatio);
        }
      } else {
        newWidth = Math.min(optimizationSettings.width, img.width);
        newHeight = Math.min(optimizationSettings.height, img.height);
      }

      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Draw the image to canvas with new dimensions
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to blob with specified quality
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Could not create image blob'));
            }
          },
          file.type,
          optimizationSettings.quality
        );
      });

      // Create a new File from the blob
      const optimizedFile = new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });

      onOptimized(optimizedFile);
    } catch (err) {
      console.error('Error optimizing image:', err);
      setError('Failed to optimize image. Please try again or upload the original.');
    } finally {
      setIsOptimizing(false);
    }
  }, [file, preview, maintainAspectRatio, onOptimized, optimizationSettings]);

  if (!preview) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold mb-4">Optimize Image</h3>

      {error && (
        <div className="p-3 bg-alert/10 border border-alert/20 rounded-md text-alert text-sm">
          {error}
        </div>
      )}

      {/* Image preview */}
      <div className="flex justify-center mb-4">
        <div className="relative border rounded-md overflow-hidden max-w-full max-h-[300px]">
          <img
            src={preview}
            alt="Preview"
            className="max-h-[300px] object-contain"
          />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
            {file.name.split('.').pop()?.toUpperCase()} • {Math.round(file.size / 1024)} KB
          </div>
        </div>
      </div>

      {/* Optimization settings */}
      <div className="space-y-3">
        <div>
          <label htmlFor="quality" className="block text-sm font-medium mb-1">
            Quality: {Math.round(optimizationSettings.quality * 100)}%
          </label>
          <input
            id="quality"
            type="range"
            min="30"
            max="100"
            value={Math.round(optimizationSettings.quality * 100)}
            onChange={handleQualityChange}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Lower quality = smaller file size. Recommended: 85%
          </p>
        </div>

        {/* Size limit warning if file is large */}
        {file.size > 1024 * 1024 * 2 && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>

            <span>
              This image is {(file.size / (1024 * 1024)).toFixed(1)}MB. Optimizing is
              recommended for faster loading and better user experience.
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isOptimizing}
          className="px-4 py-2 border rounded-md text-muted-foreground hover:text-foreground"
        >
          Skip Optimization
        </button>
        <button
          type="button"
          onClick={optimizeImage}
          disabled={isOptimizing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center"
        >
          {isOptimizing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Optimizing...
            </>
          ) : (
            'Optimize & Continue'
          )}
        </button>
      </div>
    </div>
  );
}

export default MediaOptimizer;
