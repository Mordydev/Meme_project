// Re-export shared types
// This file exports all shared types for use across the platform

// Common data models
export interface User {
  id: string;
  email: string;
  display_name: string;
  auth_provider: string;
  created_at: Date;
  last_login?: Date;
  status: 'active' | 'suspended' | 'deleted';
}

export interface Profile {
  user_id: string;
  bio?: string;
  avatar_url?: string;
  level: number;
  title?: string;
  social_links?: Record<string, string>;
  preferences?: Record<string, any>;
}

// Points system types
export interface PointsTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  reference_id?: string;
  created_at: Date;
  description?: string;
}

// Content types
export interface Content {
  id: string;
  user_id: string;
  type: 'text' | 'image' | 'link' | 'poll';
  content_text: string;
  media_urls?: string[];
  created_at: Date;
  updated_at?: Date;
  status: 'active' | 'deleted' | 'flagged';
}

// Re-export all API types
export * from './api-types';
