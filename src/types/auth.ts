import { LocationPost } from './assessment';

export type UserRole = 'volunteer' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber: string;
  assignedPost?: LocationPost;
  title: string;
  phone?: string;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
  targetRole?: UserRole;
}

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (role: UserRole) => void;
  logout: () => void;
}
