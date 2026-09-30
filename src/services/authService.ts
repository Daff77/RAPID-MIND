import { apiClient } from '../lib/api';
import { User, UserRole, LoginCredentials, NewUserInput } from '../types/auth';
import { LocationPost } from '../types/assessment';
import { DEFAULT_USERS } from '../data/seedUsers';

interface AuthResponse {
  status: string;
  success: boolean;
  token: string;
  user: User;
}

export const authService = {
  /**
   * Login with username/email and password against Laravel Sanctum.
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        usernameOrEmail: credentials.usernameOrEmail,
        password: credentials.password,
        targetRole: credentials.targetRole,
      });

      if (response.token) {
        apiClient.setToken(response.token);
      }

      return { user: response.user, token: response.token };
    } catch (err: any) {
      // Offline fallback: Match against known local default accounts
      const fallbackUser = DEFAULT_USERS.find(
        (u: User) =>
          (u.username === credentials.usernameOrEmail || u.email === credentials.usernameOrEmail) &&
          (!credentials.targetRole || u.role === credentials.targetRole)
      );

      if (fallbackUser && credentials.password === 'password123') {
        return { user: fallbackUser, token: 'offline-emergency-token' };
      }

      throw err;
    }
  },

  /**
   * Fast Field Emergency Authentication.
   */
  async quickLogin(role: UserRole): Promise<{ user: User; token: string }> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/quick-login', { role });
      if (response.token) {
        apiClient.setToken(response.token);
      }
      return { user: response.user, token: response.token };
    } catch {
      // Offline field emergency fallback
      const fallback = DEFAULT_USERS.find((u: User) => u.role === role) || DEFAULT_USERS[0];
      return { user: fallback, token: 'offline-emergency-token' };
    }
  },

  /**
   * Fetch current authenticated user.
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = apiClient.getToken();
      if (!token) return null;
      const res = await apiClient.get<{ user: User }>('/auth/me');
      return res.user;
    } catch {
      return null;
    }
  },

  /**
   * Logout from Laravel Sanctum.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      apiClient.clearToken();
    }
  },

  /**
   * List all registered system users (for admin management).
   */
  async getUsers(): Promise<User[]> {
    try {
      const res = await apiClient.get<{ users: User[] }>('/auth/users');
      return res.users || [];
    } catch {
      return DEFAULT_USERS;
    }
  },

  /**
   * Register a new user account (Admin role).
   */
  async addUser(input: NewUserInput): Promise<User> {
    const res = await apiClient.post<{ user: User }>('/auth/users', input);
    return res.user;
  },

  /**
   * Delete a user account (Admin role).
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/auth/users/${userId}`);
  },

  /**
   * Reassign volunteer to a new disaster post.
   */
  async updateUserPost(userId: string, newPost: LocationPost): Promise<User> {
    const res = await apiClient.patch<{ user: User }>(`/auth/users/${userId}/post`, { post: newPost });
    return res.user;
  },
};
