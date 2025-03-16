/**
 * Organization Model
 * Represents an organization in the system
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  created_at: Date;
  updated_at: Date;
  settings?: OrganizationSettings;
}

/**
 * Organization Settings
 */
export interface OrganizationSettings {
  visibility: 'public' | 'private';
  join_type: 'open' | 'invite' | 'request';
  allowed_domains?: string[];
  features?: Record<string, boolean>;
  theme?: {
    primary_color?: string;
    logo_url?: string;
  };
}

/**
 * Organization Member
 */
export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: string;
  joined_at: Date;
  invited_by?: string;
}

/**
 * New Organization Input
 */
export interface NewOrganizationInput {
  name: string;
  description?: string;
  logo_url?: string;
  settings?: Partial<OrganizationSettings>;
}

/**
 * Organization Update Input
 */
export interface OrganizationUpdateInput {
  name?: string;
  description?: string;
  logo_url?: string;
  settings?: Partial<OrganizationSettings>;
}

/**
 * Organization Member Input
 */
export interface OrganizationMemberInput {
  user_id: string;
  role: string;
}

/**
 * Organization with Member Count
 */
export interface OrganizationWithMemberCount extends Organization {
  member_count: number;
}

/**
 * Organization Invitation
 */
export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  token: string;
  invited_by: string;
  created_at: Date;
  expires_at: Date;
  accepted_at?: Date;
}
