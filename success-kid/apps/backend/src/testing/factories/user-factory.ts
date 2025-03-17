/**
 * User Factory
 * 
 * Provides functions for creating test users
 */
import { v4 as uuid } from 'uuid';

// Counter for generating unique values
let counter = 1;

/**
 * User creation parameters
 */
export interface CreateUserParams {
  id?: string;
  email?: string;
  displayName?: string;
  profileImage?: string;
  level?: number;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: string[];
  status?: 'active' | 'inactive' | 'suspended';
}

/**
 * Create a test user
 */
export async function createUser(params: CreateUserParams = {}): Promise<any> {
  const id = params.id || uuid();
  const currentCounter = counter++;
  
  const user = {
    id,
    email: params.email || `test-user-${currentCounter}@example.com`,
    display_name: params.displayName || `Test User ${currentCounter}`,
    profile_image: params.profileImage || `https://placekitten.com/200/200?user=${id}`,
    level: params.level || 1,
    title: params.title || 'Newcomer',
    created_at: params.createdAt || new Date(),
    updated_at: params.updatedAt || new Date(),
    roles: params.roles || ['user'],
    status: params.status || 'active',
  };
  
  return user;
}

/**
 * Create multiple test users
 */
export async function createUsers(count: number, baseParams: CreateUserParams = {}): Promise<any[]> {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    users.push(await createUser(baseParams));
  }
  
  return users;
}
