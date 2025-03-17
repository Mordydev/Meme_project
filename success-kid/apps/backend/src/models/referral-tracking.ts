/**
 * Referral Tracking Model
 * Represents tracking data for referral link visits and conversions
 */
import { z } from 'zod';

// Referral tracking schema with validation
export const referralTrackingSchema = z.object({
  id: z.string().uuid(),
  referral_code: z.string(),
  referrer_id: z.string(),
  visitor_id: z.string().optional(),
  ip_hash: z.string(),
  user_agent: z.string(),
  landing_page: z.string(),
  created_at: z.coerce.date(),
  converted_user_id: z.string().nullable(),
  conversion_date: z.coerce.date().nullable(),
  utm_source: z.string().nullable(),
  utm_medium: z.string().nullable(),
  utm_campaign: z.string().nullable()
});

// TypeScript type derived from schema
export type ReferralTracking = z.infer<typeof referralTrackingSchema>;

// Input DTOs with validation
export const createReferralTrackingSchema = z.object({
  referral_code: z.string(),
  referrer_id: z.string(),
  visitor_id: z.string().optional(),
  ip_hash: z.string(),
  user_agent: z.string(),
  landing_page: z.string(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional()
});

export type CreateReferralTrackingDto = z.infer<typeof createReferralTrackingSchema>;

export const updateReferralTrackingSchema = z.object({
  converted_user_id: z.string().nullable().optional(),
  conversion_date: z.coerce.date().nullable().optional()
});

export type UpdateReferralTrackingDto = z.infer<typeof updateReferralTrackingSchema>;

// Visitor data for tracking
export const visitorDataSchema = z.object({
  visitor_id: z.string().optional(),
  ip_address: z.string(),
  user_agent: z.string(),
  landing_page: z.string(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
});

export type VisitorData = z.infer<typeof visitorDataSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const referralTrackingDbMapping = {
  id: 'id',
  referral_code: 'referral_code',
  referrer_id: 'referrer_id',
  visitor_id: 'visitor_id',
  ip_hash: 'ip_hash',
  user_agent: 'user_agent',
  landing_page: 'landing_page',
  created_at: 'created_at',
  converted_user_id: 'converted_user_id',
  conversion_date: 'conversion_date',
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign'
};
