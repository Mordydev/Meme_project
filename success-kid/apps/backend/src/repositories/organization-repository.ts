/**
 * Organization Repository
 * 
 * Handles data access for organizations
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Organization, 
  NewOrganizationInput, 
  OrganizationUpdateInput,
  OrganizationMember,
  OrganizationWithMemberCount
} from '../models/organization';
import { logger } from '../lib/logger';

export class OrganizationRepository extends BaseRepository<Organization> {
  constructor(db: Pool) {
    super(db, 'organizations', 'id');
  }

  /**
   * Create a new organization
   */
  async createOrganization(input: NewOrganizationInput, creatorId: string): Promise<Organization> {
    try {
      const now = new Date();
      
      // Generate a URL-friendly slug from the name
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Create the organization in a transaction
      return await this.executeTransaction(async (client) => {
        // Create the organization
        const orgResult = await client.query<Organization>(`
          INSERT INTO organizations 
            (name, slug, description, logo_url, settings, created_at, updated_at)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          input.name,
          slug,
          input.description || null,
          input.logo_url || null,
          input.settings ? JSON.stringify(input.settings) : null,
          now,
          now
        ]);
        
        const organization = orgResult.rows[0];
        
        // Add the creator as an owner
        await client.query(`
          INSERT INTO organization_members
            (organization_id, user_id, role, joined_at)
          VALUES
            ($1, $2, $3, $4)
        `, [
          organization.id,
          creatorId,
          'owner',
          now
        ]);
        
        return organization;
      });
    } catch (error) {
      logger.error('Error creating organization', { error, input });
      throw error;
    }
  }

  /**
   * Find organization by slug
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    try {
      const query = 'SELECT * FROM organizations WHERE slug = $1';
      const result = await this.db.query<Organization>(query, [slug]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding organization by slug', { error, slug });
      throw error;
    }
  }

  /**
   * Update an organization
   */
  async updateOrganization(id: string, input: OrganizationUpdateInput): Promise<Organization | null> {
    try {
      // Start with empty update data
      const updateData: Record<string, any> = {
        updated_at: new Date()
      };
      
      // Add fields that are present in the input
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.logo_url !== undefined) updateData.logo_url = input.logo_url;
      
      // Handle settings update with merge
      if (input.settings) {
        // Get current organization to merge settings
        const currentOrg = await this.findById(id);
        if (!currentOrg) return null;
        
        updateData.settings = JSON.stringify({
          ...(currentOrg.settings || {}),
          ...input.settings
        });
      }
      
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error updating organization', { error, id, input });
      throw error;
    }
  }

  /**
   * Add a member to an organization
   */
  async addMember(organizationId: string, userId: string, role: string): Promise<OrganizationMember> {
    try {
      const query = `
        INSERT INTO organization_members
          (organization_id, user_id, role, joined_at)
        VALUES
          ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await this.db.query<OrganizationMember>(
        query, 
        [organizationId, userId, role, new Date()]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding organization member', { error, organizationId, userId });
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(organizationId: string, userId: string, role: string): Promise<OrganizationMember | null> {
    try {
      const query = `
        UPDATE organization_members
        SET role = $3
        WHERE organization_id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await this.db.query<OrganizationMember>(query, [organizationId, userId, role]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating member role', { error, organizationId, userId });
      throw error;
    }
  }

  /**
   * Remove a member from an organization
   */
  async removeMember(organizationId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM organization_members
        WHERE organization_id = $1 AND user_id = $2
      `;
      
      const result = await this.db.query(query, [organizationId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error removing organization member', { error, organizationId, userId });
      throw error;
    }
  }

  /**
   * Get organization members
   */
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      const query = `
        SELECT * FROM organization_members
        WHERE organization_id = $1
        ORDER BY role, joined_at
      `;
      
      const result = await this.db.query<OrganizationMember>(query, [organizationId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting organization members', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const query = `
        SELECT o.* FROM organizations o
        JOIN organization_members m ON o.id = m.organization_id
        WHERE m.user_id = $1
        ORDER BY o.name
      `;
      
      const result = await this.db.query<Organization>(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user organizations', { error, userId });
      throw error;
    }
  }

  /**
   * Check if user is a member of an organization
   */
  async isMember(organizationId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_id = $1 AND user_id = $2
        ) AS is_member
      `;
      
      const result = await this.db.query<{ is_member: boolean }>(query, [organizationId, userId]);
      return result.rows[0]?.is_member || false;
    } catch (error) {
      logger.error('Error checking organization membership', { error, organizationId, userId });
      throw error;
    }
  }

  /**
   * Get member role in organization
   */
  async getMemberRole(organizationId: string, userId: string): Promise<string | null> {
    try {
      const query = `
        SELECT role FROM organization_members
        WHERE organization_id = $1 AND user_id = $2
      `;
      
      const result = await this.db.query<{ role: string }>(query, [organizationId, userId]);
      return result.rows[0]?.role || null;
    } catch (error) {
      logger.error('Error getting member role', { error, organizationId, userId });
      throw error;
    }
  }

  /**
   * Get organizations with member count
   */
  async getOrganizationsWithMemberCount(limit: number = 10, offset: number = 0): Promise<OrganizationWithMemberCount[]> {
    try {
      const query = `
        SELECT 
          o.*,
          (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id) as member_count
        FROM organizations o
        ORDER BY o.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await this.db.query<OrganizationWithMemberCount>(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting organizations with member count', { error });
      throw error;
    }
  }
}
