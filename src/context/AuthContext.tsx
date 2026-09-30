import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User, UserRole, LoginCredentials, AuthContextType, NewUserInput } from '../types/auth';
import { LocationPost } from '../types/assessment';
import { authService } from '../services/authService';
import { DEFAULT_USERS, MOCK_ADMIN, MOCK_VOLUNTEER, MOCK_HOSPITAL } from '../data/seedUsers';

const STORAGE_KEY_AUTH = 'rapidmind_auth_session';
const STORAGE_KEY_CUSTOM_USERS = 'rapidmind_custom_users_v2';
const STORAGE_KEY_USER_PASSWORDS = 'rapidmind_user_passwords_v2';
const STORAGE_KEY_USER_POST_OVERRIDES = 'rapidmind_user_post_overrides_v1';

export { MOCK_ADMIN, MOCK_VOLUNTEER, MOCK_HOSPITAL };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        return JSON.parse(stored) as User;
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user', e);
    }
    return null;
  });

  const [customUsers, setCustomUsers] = useState<User[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_USERS);
      if (stored) {
        return JSON.parse(stored) as User[];
      }
    } catch (e) {
      console.warn('Failed to parse custom users', e);
    }
    return [];
  });

  const [postOverrides, setPostOverrides] = useState<Record<string, LocationPost>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER_POST_OVERRIDES);
      if (stored) {
        return JSON.parse(stored) as Record<string, LocationPost>;
      }
    } catch (e) {
      console.warn('Failed to parse post overrides', e);
    }
    return {};
  });

  const saveUserSession = (user: User | null) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
      }
    }
  };

  // Try validating current session with Laravel Sanctum on startup
  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (user) {
        saveUserSession(user);
      }
    }).catch(() => {});
  }, []);

  const allUsers = useMemo(() => {
    return [...DEFAULT_USERS, ...customUsers].map((u) => {
      if (postOverrides[u.id]) {
        return { ...u, assignedPost: postOverrides[u.id] };
      }
      return u;
    });
  }, [customUsers, postOverrides]);

  const getStoredPasswords = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER_PASSWORDS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveStoredPasswords = (passwords: Record<string, string>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USER_PASSWORDS, JSON.stringify(passwords));
    }
  };

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // First attempt Laravel Sanctum authentication
      const result = await authService.login(credentials);
      saveUserSession(result.user);
      return { success: true };
    } catch (apiErr: any) {
      // Fallback local authentication
      const identifier = credentials.usernameOrEmail.trim().toLowerCase();
      const pass = credentials.password.trim();

      if ((identifier === 'admin' || identifier === 'admin@rapidmind.org') && pass === 'admin123') {
        saveUserSession(MOCK_ADMIN);
        return { success: true };
      }
      if ((identifier === 'volunteer' || identifier === 'volunteer@rapidmind.org') && pass === 'volunteer123') {
        saveUserSession(MOCK_VOLUNTEER);
        return { success: true };
      }
      if (
        (identifier === 'rumahsakit' || identifier === 'hospital' || identifier === 'rumahsakit@rapidmind.org') &&
        (pass === 'rumahsakit123' || pass === 'hospital123')
      ) {
        saveUserSession(MOCK_HOSPITAL);
        return { success: true };
      }

      // Check custom users
      const passwords = getStoredPasswords();
      const matchedCustomUser = customUsers.find(
        (u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
      );

      if (matchedCustomUser) {
        const storedPass = passwords[matchedCustomUser.username] || 'password123';
        if (pass === storedPass) {
          saveUserSession(matchedCustomUser);
          return { success: true };
        }
      }

      return {
        success: false,
        error: apiErr?.message || 'Kredensial tidak valid. Silakan periksa username dan password.',
      };
    }
  };

  const quickLogin = async (role: UserRole) => {
    try {
      const res = await authService.quickLogin(role);
      saveUserSession(res.user);
    } catch {
      if (role === 'admin') {
        saveUserSession(MOCK_ADMIN);
      } else if (role === 'hospital') {
        saveUserSession(MOCK_HOSPITAL);
      } else {
        saveUserSession(MOCK_VOLUNTEER);
      }
    }
  };

  const logout = () => {
    authService.logout().catch(() => {});
    saveUserSession(null);
  };

  /**
   * Only Admin user can add new users!
   */
  const addUser = (input: NewUserInput): { success: boolean; error?: string; user?: User } => {
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        error: 'Akses ditolak: Hanya akun Admin yang berwenang menambahkan user baru.',
      };
    }

    const cleanUsername = input.username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, error: 'Username wajib diisi.' };
    }

    if (!input.name.trim()) {
      return { success: false, error: 'Nama pengguna wajib diisi.' };
    }

    const exists = allUsers.some((u) => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return {
        success: false,
        error: `Username "${cleanUsername}" sudah digunakan. Silakan gunakan username lain.`,
      };
    }

    const idPrefix = input.role === 'admin' ? 'adm' : input.role === 'hospital' ? 'rs' : 'vol';
    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    const badgeDefault =
      input.role === 'admin'
        ? `ADM-${randomSuffix}`
        : input.role === 'hospital'
        ? `RS-${randomSuffix}`
        : `VOL-${randomSuffix}`;

    const titleDefault =
      input.role === 'admin'
        ? 'Crisis Response Administrator'
        : input.role === 'hospital'
        ? 'Hospital Referral Specialist'
        : 'Field Psychological Volunteer';

    const newUser: User = {
      id: `user-${idPrefix}-${Date.now().toString(36)}`,
      username: cleanUsername,
      name: input.name.trim(),
      email: input.email.trim() || `${cleanUsername}@rapidmind.org`,
      role: input.role,
      badgeNumber: input.badgeNumber?.trim() || badgeDefault,
      assignedPost: input.assignedPost,
      assignedHospital:
        input.assignedHospital ||
        (input.role === 'hospital' ? 'RSUD Rujukan Daerah' : undefined),
      title: input.title?.trim() || titleDefault,
      phone: input.phone?.trim() || '+62 812-0000-0000',
    };

    const updatedCustom = [...customUsers, newUser];
    setCustomUsers(updatedCustom);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CUSTOM_USERS, JSON.stringify(updatedCustom));
    }

    const passwords = getStoredPasswords();
    passwords[cleanUsername] = input.password?.trim() || 'password123';
    saveStoredPasswords(passwords);

    // Call Laravel API in background if online
    authService.addUser(input).catch(() => {});

    return {
      success: true,
      user: newUser,
    };
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        error: 'Akses ditolak: Hanya akun Admin yang berwenang menghapus user.',
      };
    }

    if (DEFAULT_USERS.some((u: User) => u.id === userId)) {
      return {
        success: false,
        error: 'Pengguna default sistem tidak dapat dihapus.',
      };
    }

    const updated = customUsers.filter((u) => u.id !== userId);
    setCustomUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CUSTOM_USERS, JSON.stringify(updated));
    }

    // Call Laravel API in background
    authService.deleteUser(userId).catch(() => {});

    return { success: true };
  };

  const updateUserPost = (userId: string, newPost: LocationPost): { success: boolean; error?: string } => {
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        error: 'Akses ditolak: Hanya akun Admin yang berwenang menugaskan posko relawan.',
      };
    }

    const updatedOverrides = { ...postOverrides, [userId]: newPost };
    setPostOverrides(updatedOverrides);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USER_POST_OVERRIDES, JSON.stringify(updatedOverrides));
    }

    const customIdx = customUsers.findIndex((u) => u.id === userId);
    if (customIdx >= 0) {
      const updatedCustom = [...customUsers];
      updatedCustom[customIdx] = { ...updatedCustom[customIdx], assignedPost: newPost };
      setCustomUsers(updatedCustom);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CUSTOM_USERS, JSON.stringify(updatedCustom));
      }
    }

    if (currentUser?.id === userId) {
      saveUserSession({ ...currentUser, assignedPost: newPost });
    }

    authService.updateUserPost(userId, newPost).catch(() => {});

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        allUsers,
        login,
        quickLogin,
        logout,
        addUser,
        deleteUser,
        updateUserPost,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
