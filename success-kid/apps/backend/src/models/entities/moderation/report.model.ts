/**
 * Report Model
 * 
 * Defines the Report entity, validation schemas, and related data transfer objects.
 * Reports are user-submitted content moderation requests.
 */
import { z } from 'zod';

// Report Reason Enum
export const ReportReasonEnum = z.enum([
  'inappropriate',  // Inappropriate content
  'offensive',      // Offensive or harmful content
  'spam',           // Spam or advertising
  'misinformation', // False or misleading information
  'copyright',      // Copyright violation
  'impersonation',  // Impersonation of another user
  'harassment',     // Harassment or bullying
  'other'           // Other reasons
]);
export type ReportReason = z.infer<typeof ReportReasonEnum>;

// Report Status Enum
export const ReportStatusEnum = z.enum([
  'pending',    // Awaiting review
  'reviewing',  // Under review by moderator
  'resolved',   // Reviewed and resolved
  'rejected'    // Reviewed and rejected
]);
export type ReportStatus = z.infer<typeof ReportStatusEnum>;

// Report Entity Type Enum
export const ReportEntityTypeEnum = z.enum([
  'content',  // Report for content post
  'comment',  // Report for comment
  'user'      // Report for user profile
]);
export type ReportEntityType = z.infer<typeof ReportEntityTypeEnum>;

// Resolution Action Enum
export const ResolutionActionEnum = z.enum([
  'no_action',         // No action needed
  'warning',           // Warning to user
  'content_removed',   // Content removed
  'comment_removed',   // Comment removed
  'user_suspended',    // User account suspended
  'user_banned'        // User account banned
]);
export type ResolutionAction = z.infer<typeof ResolutionActionEnum>;

// Report Zod Schema
export const reportSchema = z.object({
  id: z.string().uuid({ message: 'Invalid report ID format' }),
  reporter_id: z.string().uuid({ message: 'Invalid reporter user ID format' }),
  entity_type: ReportEntityTypeEnum,
  entity_id: z.string().uuid({ message: 'Invalid entity ID format' }),
  reason: ReportReasonEnum,
  description: z.string().max(1000, { message: 'Description cannot exceed 1000 characters' }).optional(),
  status: ReportStatusEnum.default('pending'),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  
  // Resolution fields (populated when resolved)
  moderator_id: z.string().uuid({ message: 'Invalid moderator user ID format' }).optional(),
  resolution_action: ResolutionActionEnum.optional(),
  resolution_notes: z.string().max(1000, { message: 'Resolution notes cannot exceed 1000 characters' }).optional(),
  resolved_at: z.coerce.date().optional(),
});

// TypeScript Report Type derived from Zod schema
export type Report = z.infer<typeof reportSchema>;

// Create Report Input Schema
export const createReportSchema = reportSchema
  .omit({ 
    id: true, 
    status: true,
    created_at: true, 
    updated_at: true,
    moderator_id: true,
    resolution_action: true,
    resolution_notes: true,
    resolved_at: true
  })
  .partial({
    description: true
  })
  .required({
    reporter_id: true,
    entity_type: true,
    entity_id: true,
    reason: true
  });

// Create Report DTO Type
export type CreateReportDto = z.infer<typeof createReportSchema>;

// Update Report Input Schema
export const updateReportSchema = z.object({
  status: ReportStatusEnum.optional(),
  moderator_id: z.string().uuid({ message: 'Invalid moderator ID format' }).optional(),
  resolution_action: ResolutionActionEnum.optional(),
  resolution_notes: z.string().max(1000, { message: 'Resolution notes cannot exceed 1000 characters' }).optional(),
  resolved_at: z.coerce.date().optional(),
});

// Update Report DTO Type
export type UpdateReportDto = z.infer<typeof updateReportSchema>;

// Report Resolution Schema
export const reportResolutionSchema = z.object({
  resolution_action: ResolutionActionEnum,
  resolution_notes: z.string().max(1000, { message: 'Resolution notes cannot exceed 1000 characters' }).optional(),
});

// Report Resolution DTO Type
export type ReportResolutionDto = z.infer<typeof reportResolutionSchema>;

// Report with Entity Details
export interface ReportWithDetails extends Report {
  reporter: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  entity_details: any; // Content or comment details
  moderator?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}
