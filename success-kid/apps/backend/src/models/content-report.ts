/**
 * Content Report Model
 * Represents a user report of content for moderation
 */
import { z } from 'zod';

// Define the report status enum
export const ReportStatusEnum = z.enum(['pending', 'reviewed', 'resolved', 'dismissed']);
export type ReportStatus = z.infer<typeof ReportStatusEnum>;

// Define the report reason enum
export const ReportReasonEnum = z.enum([
  'spam',
  'harassment',
  'hate_speech',
  'violence',
  'nudity',
  'misinformation',
  'impersonation',
  'copyright',
  'other'
]);
export type ReportReason = z.infer<typeof ReportReasonEnum>;

// Define the target type enum
export const ReportTargetTypeEnum = z.enum(['content', 'comment', 'user']);
export type ReportTargetType = z.infer<typeof ReportTargetTypeEnum>;

// Content report schema with validation
export const contentReportSchema = z.object({
  id: z.string().uuid(),
  reporter_id: z.string().uuid(),
  target_id: z.string().uuid(),
  target_type: ReportTargetTypeEnum,
  reason: ReportReasonEnum,
  description: z.string().max(1000).optional(),
  status: ReportStatusEnum,
  reviewer_id: z.string().uuid().nullable(),
  reviewed_at: z.coerce.date().nullable(),
  resolution_notes: z.string().max(1000).nullable(),
  created_at: z.coerce.date()
});

// TypeScript type derived from schema
export type ContentReport = z.infer<typeof contentReportSchema>;

// Input DTOs with validation
export const createContentReportSchema = z.object({
  reporter_id: z.string().uuid(),
  target_id: z.string().uuid(),
  target_type: ReportTargetTypeEnum,
  reason: ReportReasonEnum,
  description: z.string().max(1000).optional(),
});

export type CreateContentReportDto = z.infer<typeof createContentReportSchema>;

export const reviewReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  resolution_notes: z.string().max(1000).optional(),
});

export type ReviewReportDto = z.infer<typeof reviewReportSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const contentReportDbMapping = {
  id: 'id',
  reporter_id: 'reporter_id',
  target_id: 'target_id',
  target_type: 'target_type',
  reason: 'reason',
  description: 'description',
  status: 'status',
  reviewer_id: 'reviewer_id',
  reviewed_at: 'reviewed_at',
  resolution_notes: 'resolution_notes',
  created_at: 'created_at'
};
