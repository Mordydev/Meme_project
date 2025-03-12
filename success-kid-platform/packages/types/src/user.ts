export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserCreate = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UserUpdate = Partial<UserCreate>;
