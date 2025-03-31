/**
 * Types for the Drafts API
 */
import { Draft, DraftResponseDto } from '../../database/schema/drafts';
import { CreateDraftDto, UpdateDraftDto } from '../../services/content/drafts';

// Response for a single draft
export interface DraftResponse {
  data: DraftResponseDto;
  meta: {
    timestamp: string;
  };
}

// Response for multiple drafts
export interface DraftsResponse {
  data: DraftResponseDto[];
  meta: {
    timestamp: string;
    total?: number;
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Response for draft deletion
export interface DeleteDraftResponse {
  data: {
    success: boolean;
  };
  meta: {
    timestamp: string;
  };
}

// Response for draft publication
export interface PublishDraftResponse {
  data: {
    contentId: string;
    // Other potential content fields
  };
  meta: {
    timestamp: string;
  };
}

// Export the DTOs for use in the API layer
export { CreateDraftDto, UpdateDraftDto };
