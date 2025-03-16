/**
 * Clerk Client Wrapper
 * 
 * Provides a wrapper around Clerk API client for server-side interactions
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../../config/environment';
import { logger } from '../../lib/logger';
import { ClerkUser } from './types';

// Clerk configuration
const CLERK_API_KEY = env.CLERK_API_KEY;
const CLERK_API_BASE = 'https://api.clerk.dev/v1';
const CLERK_JWKS_URL = `${CLERK_API_BASE}/jwks`;
const CLERK_ISSUER = env.CLERK_ISSUER || 'https://clerk.success-kid.com';
const CLERK_AUDIENCE = env.CLERK_AUDIENCE || 'success-kid-platform';

// Create a JWKS client for the Clerk public keys
const jwks = createRemoteJWKSet(new URL(CLERK_JWKS_URL));

/**
 * Verify a JWT issued by Clerk
 * @param token The JWT token to verify
 * @returns The decoded user information or null if invalid
 */
export async function verifyClerkJWT(token: string): Promise<ClerkUser | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: CLERK_ISSUER,
      audience: CLERK_AUDIENCE,
    });
    
    if (!payload.sub) {
      throw new Error('Missing subject in token');
    }
    
    // Extract standard fields from Clerk JWT
    return {
      id: payload.sub as string,
      email: payload.email as string,
      emailVerified: payload.email_verified as boolean,
      firstName: payload.given_name as string,
      lastName: payload.family_name as string,
      username: payload.username as string,
      imageUrl: payload.picture as string,
      metadata: payload.metadata || {},
      publicMetadata: payload.public_metadata || {},
      privateMetadata: payload.private_metadata || {},
      organizationId: payload.org_id as string,
    };
  } catch (error) {
    logger.error('JWT verification error', { error });
    return null;
  }
}

/**
 * Get Clerk user by ID directly from Clerk API
 * This is useful for server-side operations that need to verify or get user data
 */
export async function getClerkUser(userId: string): Promise<ClerkUser | null> {
  try {
    if (!CLERK_API_KEY) {
      logger.error('CLERK_API_KEY not configured');
      return null;
    }
    
    const response = await fetch(`${CLERK_API_BASE}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clerk API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    // Map Clerk API response to our ClerkUser type
    return {
      id: data.id,
      email: data.email_addresses?.[0]?.email_address,
      emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username,
      imageUrl: data.image_url,
      metadata: data.metadata || {},
      publicMetadata: data.public_metadata || {},
      privateMetadata: data.private_metadata || {},
    };
  } catch (error) {
    logger.error('Error getting Clerk user', { error, userId });
    return null;
  }
}

/**
 * Update Clerk user metadata
 * This allows us to store platform-specific information in Clerk
 */
export async function updateClerkUserMetadata(
  userId: string, 
  metadata: Record<string, any>
): Promise<boolean> {
  try {
    if (!CLERK_API_KEY) {
      logger.error('CLERK_API_KEY not configured');
      return false;
    }
    
    const response = await fetch(`${CLERK_API_BASE}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metadata })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clerk API error: ${response.status} ${errorText}`);
    }
    
    return true;
  } catch (error) {
    logger.error('Error updating Clerk user metadata', { error, userId });
    return false;
  }
}

/**
 * Check if a Clerk user exists by email
 */
export async function checkClerkUserExists(email: string): Promise<boolean> {
  try {
    if (!CLERK_API_KEY) {
      logger.error('CLERK_API_KEY not configured');
      return false;
    }
    
    const response = await fetch(`${CLERK_API_BASE}/users?email_address=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clerk API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data.total_count > 0;
  } catch (error) {
    logger.error('Error checking if Clerk user exists', { error, email });
    return false;
  }
}

/**
 * Revoke a Clerk user session
 */
export async function revokeClerkSession(sessionId: string): Promise<boolean> {
  try {
    if (!CLERK_API_KEY) {
      logger.error('CLERK_API_KEY not configured');
      return false;
    }
    
    const response = await fetch(`${CLERK_API_BASE}/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  } catch (error) {
    logger.error('Error revoking Clerk session', { error, sessionId });
    return false;
  }
}

/**
 * Create a magic link for passwordless sign-in
 */
export async function createClerkMagicLink(email: string, redirectUrl?: string): Promise<string | null> {
  try {
    if (!CLERK_API_KEY) {
      logger.error('CLERK_API_KEY not configured');
      return null;
    }
    
    const response = await fetch(`${CLERK_API_BASE}/sign_in_tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: email,
        redirect_url: redirectUrl
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clerk API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data.url || null;
  } catch (error) {
    logger.error('Error creating Clerk magic link', { error, email });
    return null;
  }
}

/**
 * Create a Clerk user invitation
 */
export async function createClerkInvitation(email: string): Promise<string | null> {
  try {
    if (!CLERK_API_KEY) {
      logger.error('CLERK_API_KEY not configured');
      return null;
    }
    
    const response = await fetch(`${CLERK_API_BASE}/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: email,
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clerk API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data.id || null;
  } catch (error) {
    logger.error('Error creating Clerk invitation', { error, email });
    return null;
  }
}
