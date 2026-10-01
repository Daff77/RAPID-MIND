import { LocationPost } from './assessment';

export type UserRole = 'volunteer' | 'admin' | 'hospital';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber: string;
  assignedPost?: LocationPost;
  assignedHospital?: string;
  title: string;
  phone?: string;
}

export interface NewUserInput {
  name: string;
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  badgeNumber?: string;
  assignedPost?: LocationPost;
  assignedHospital?: string;
  title?: string;
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
  allUsers: User[];
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string; user?: User; role?: UserRole }>;
  quickLogin: (role: UserRole) => void;
  logout: () => void;
  addUser: (input: NewUserInput) => { success: boolean; error?: string; user?: User };
  deleteUser: (userId: string) => { success: boolean; error?: string };
  updateUserPost: (userId: string, newPost: LocationPost) => { success: boolean; error?: string };
}

