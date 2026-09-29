import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { User, UserRole, LoginCredentials, AuthContextType, NewUserInput } from '../types/auth';
import { LocationPost } from '../types/assessment';

const STORAGE_KEY_AUTH = 'rapidmind_auth_session';
const STORAGE_KEY_CUSTOM_USERS = 'rapidmind_custom_users_v2';
const STORAGE_KEY_USER_PASSWORDS = 'rapidmind_user_passwords_v2';
const STORAGE_KEY_USER_POST_OVERRIDES = 'rapidmind_user_post_overrides_v1';

export const MOCK_VOLUNTEER: User = {
  id: 'user-vol-042',
  username: 'volunteer',
  email: 'volunteer@rapidmind.org',
  name: 'Siti Rahma, S.Psi',
  role: 'volunteer',
  badgeNumber: 'VOL-042',
  assignedPost: 'Posko A',
  title: 'Field Psychological Volunteer',
  phone: '+62 812-3456-7890',
};

export const MOCK_ADMIN: User = {
  id: 'user-adm-001',
  username: 'admin',
  email: 'admin@rapidmind.org',
  name: 'dr. Sarah Amanda, Sp.KJ',
  role: 'admin',
  badgeNumber: 'ADM-001',
  assignedPost: 'Posko A',
  title: 'Incident Psychological Coordinator',
  phone: '+62 811-9876-5432',
};

export const MOCK_HOSPITAL: User = {
  id: 'user-rs-001',
  username: 'rumahsakit',
  email: 'rumahsakit@rapidmind.org',
  name: 'dr. Budi Santoso, Sp.KJ',
  role: 'hospital',
  badgeNumber: 'RS-001',
  assignedHospital: 'RSUD Dr. Soetomo (Pusat Rujukan Jiwa)',
  title: 'Hospital Psychiatric Triage & Referral Specialist',
  phone: '+62 813-1122-3344',
};

const DEFAULT_USERS: User[] = [MOCK_ADMIN, MOCK_VOLUNTEER, MOCK_HOSPITAL];

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

  const allUsers = useMemo(() => {
    return [...DEFAULT_USERS, ...customUsers].map((u) => {
      if (postOverrides[u.id]) {
        return { ...u, assignedPost: postOverrides[u.id] };
      }
      return u;
    });
  }, [customUsers, postOverrides]);

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
    // Artificial brief network delay (300ms) for realistic UX feel
    await new Promise((resolve) => setTimeout(resolve, 300));

    const identifier = credentials.usernameOrEmail.trim().toLowerCase();
    const pass = credentials.password.trim();

    // 1. Check Admin credentials
    if (
      (identifier === 'admin' || identifier === 'admin@rapidmind.org') &&
      pass === 'admin123'
    ) {
      saveUserSession(MOCK_ADMIN);
      return { success: true };
    }

    // 2. Check Volunteer credentials
    if (
      (identifier === 'volunteer' || identifier === 'volunteer@rapidmind.org') &&
      pass === 'volunteer123'
    ) {
      saveUserSession(MOCK_VOLUNTEER);
      return { success: true };
    }

    // 3. Check Hospital credentials
    if (
      (identifier === 'rumahsakit' ||
        identifier === 'hospital' ||
        identifier === 'rumahsakit@rapidmind.org' ||
        identifier === 'rs.rujukan@rapidmind.org') &&
      (pass === 'rumahsakit123' || pass === 'hospital123')
    ) {
      saveUserSession(MOCK_HOSPITAL);
      return { success: true };
    }

    // 4. Role-specific fallback check if user entered role explicitly
    if (credentials.targetRole === 'admin' && pass === 'admin123') {
      saveUserSession(MOCK_ADMIN);
      return { success: true };
    }

    if (credentials.targetRole === 'volunteer' && pass === 'volunteer123') {
      saveUserSession(MOCK_VOLUNTEER);
      return { success: true };
    }

    if (credentials.targetRole === 'hospital' && (pass === 'rumahsakit123' || pass === 'hospital123')) {
      saveUserSession(MOCK_HOSPITAL);
      return { success: true };
    }

    // 5. Check custom users added by Admin
    const passwords = getStoredPasswords();
    const matchedCustomUser = customUsers.find(
      (u) =>
        u.username.toLowerCase() === identifier ||
        u.email.toLowerCase() === identifier
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
      error: 'Invalid credentials. Please check your username/password.',
    };
  };

  const quickLogin = (role: UserRole) => {
    if (role === 'admin') {
      saveUserSession(MOCK_ADMIN);
    } else if (role === 'hospital') {
      saveUserSession(MOCK_HOSPITAL);
    } else {
      saveUserSession(MOCK_VOLUNTEER);
    }
  };

  const logout = () => {
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

    // Check username uniqueness
    const exists = allUsers.some(
      (u) => u.username.toLowerCase() === cleanUsername
    );
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

    // Save custom user password
    const passwords = getStoredPasswords();
    passwords[cleanUsername] = input.password?.trim() || 'password123';
    saveStoredPasswords(passwords);

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

    if (DEFAULT_USERS.some((u) => u.id === userId)) {
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

    // Also update customUsers if user is in customUsers
    const customIdx = customUsers.findIndex((u) => u.id === userId);
    if (customIdx >= 0) {
      const updatedCustom = [...customUsers];
      updatedCustom[customIdx] = { ...updatedCustom[customIdx], assignedPost: newPost };
      setCustomUsers(updatedCustom);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CUSTOM_USERS, JSON.stringify(updatedCustom));
      }
    }

    // If currently logged in user is this user, update session too
    if (currentUser?.id === userId) {
      saveUserSession({ ...currentUser, assignedPost: newPost });
    }

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
