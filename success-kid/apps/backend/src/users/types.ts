/**
 * User model 
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
 * User creation DTO
 */
export interface CreateUserDto {
  id: string;
  email: string;
  display_name: string;
  auth_provider: string;
  created_at?: Date;
  last_login?: Date;
  status?: 'active' | 'suspended' | 'deleted';
}

/**
 * User update DTO
 */
export interface UpdateUserDto {
  display_name?: string;
  email?: string;
  auth_provider?: string;
  last_login?: Date;
  status?: 'active' | 'suspended' | 'deleted';
}

/**
 * Public user data
 */
export interface PublicUserData {
  id: string;
  displayName: string;
  profileImageUrl?: string;
}

/**
 * Private user data - full user profile for the user themselves
 */
export interface PrivateUserData {
  id: string;
  email: string;
  displayName: string;
  authProvider: string;
  createdAt: Date;
  lastLogin: Date;
  status: 'active' | 'suspended' | 'deleted';
  profileImageUrl?: string;
}

/**
 * Search users request
 */
export interface SearchUsersRequest {
  query?: string;
  status?: 'active' | 'suspended' | 'deleted';
  limit?: number;
  offset?: number;
}

/**
 * User search response
 */
export interface UserSearchResponse {
  users: PublicUserData[];
  total: number;
  limit: number;
  offset: number;
}
