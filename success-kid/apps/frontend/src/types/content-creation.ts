import { ContentType } from './community';
import { MediaFile } from '@/components/features/content-creation/MediaUpload';

export interface ContentFormData {
  id?: string; // Draft ID
  type: ContentType;
  title: string;
  body: string;
  categoryId: string;
  tags: string[];
  media: MediaFile[];
  link?: string; // For link type posts
  pollOptions?: string[]; // For poll type posts
}

export interface DraftItem {
  id: string;
  type: ContentType;
  title: string;
  preview: string;
  thumbnailUrl?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type FormMode = 'create' | 'edit' | 'preview';

export interface ContentGuidelineItem {
  id: string;
  title: string;
  description: string;
  category: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: {
    type: 'prohibited' | 'warning' | 'suggestion';
    field: string;
    message: string;
    position?: {start: number, end: number};
    suggestion?: string;
  }[];
  guidelines: ContentGuidelineItem[];
}
