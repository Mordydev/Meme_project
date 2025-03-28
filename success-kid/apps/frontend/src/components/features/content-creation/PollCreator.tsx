'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  X, 
  GripVertical, 
  Clock, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface PollCreatorProps {
  options: string[];
  onChange: (options: string[]) => void;
  duration?: number;
  onDurationChange?: (duration: number) => void;
  errors?: { message: string; field: string }[];
}

export function PollCreator({ 
  options, 
  onChange, 
  duration = 7, 
  onDurationChange,
  errors = []
}: PollCreatorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Update a specific option
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };
  
  // Add a new option
  const addOption = () => {
    onChange([...options, '']);
  };
  
  // Remove an option
  const removeOption = (index: number) => {
    // Ensure we keep at least 2 options
    if (options.length <= 2) return;
    
    const newOptions = [...options];
    newOptions.splice(index, 1);
    onChange(newOptions);
  };
  
  // Handle drag start
  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
  };
  
  // Handle drag over another option
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newOptions = [...options];
    const draggedOption = newOptions[draggedIndex];
    
    // Remove the dragged option
    newOptions.splice(draggedIndex, 1);
    // Insert it at the new position
    newOptions.splice(index, 0, draggedOption);
    
    onChange(newOptions);
    setDraggedIndex(index);
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedIndex(null);
  };
  
  // Get appropriate duration text
  const getDurationText = (days: number): string => {
    if (days === 1) return '1 day';
    if (days === 7) return '1 week';
    if (days === 30) return '1 month';
    return `${days} days`;
  };
  
  // Find poll option error
  const pollOptionError = errors.find(e => e.field === 'pollOptions')?.message;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Poll Options</h3>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div 
              key={index}
              className={`flex items-center gap-2 ${isDragging && draggedIndex === index ? 'opacity-50' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div 
                className="p-2 cursor-grab touch-manipulation" 
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              
              <Input
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-grow"
              />
              
              {index >= 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="text-gray-500"
                  aria-label="Remove option"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {pollOptionError && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {pollOptionError}
            </p>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            className="mt-2 w-full"
            disabled={options.length >= 10}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
          
          <p className="text-xs text-gray-500 mt-1">
            {options.length}/10 options • Drag to reorder
          </p>
        </div>
      </div>
      
      {onDurationChange && (
        <div>
          <h3 className="text-sm font-medium mb-2">Poll Duration</h3>
          <div className="grid grid-cols-3 gap-2">
            {[1, 7, 30].map((days) => (
              <Card 
                key={days}
                className={`p-3 text-center cursor-pointer hover:border-primary transition-colors ${
                  duration === days ? 'border-primary bg-primary-50' : ''
                }`}
                onClick={() => onDurationChange(days)}
              >
                <div className="flex flex-col items-center">
                  <Clock className={`h-5 w-5 mb-1 ${duration === days ? 'text-primary' : 'text-gray-500'}`} />
                  <span className={`text-sm ${duration === days ? 'font-medium text-primary-900' : ''}`}>
                    {getDurationText(days)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1 text-gray-400" />
            Poll will automatically close after the selected duration
          </p>
        </div>
      )}
    </div>
  );
}
