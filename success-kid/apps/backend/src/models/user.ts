/**
 * User Model
 * Represents a user in the system
 */
export interface User {
  id: string;
  email: string;
  display_name: string;
  auth_provider: string;
  created_at: Date;
  last_login: Date;
  status: 'active' | 'suspended' | 'deleted';
}

/**
 * New User Input for creating a user
 */
export interface NewUserInput {
  id: string;
  email: string;
  display_name: string;
  auth_provider: string;
}

/**
 * User Update Input for updating a user
 */
export interface UserUpdateInput {
  display_name?: string;
  email?: string;
  status?: 'active' | 'suspended' | 'deleted';
}
