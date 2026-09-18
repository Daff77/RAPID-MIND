import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, LoginCredentials, AuthContextType } from '../types/auth';

const STORAGE_KEY_AUTH = 'rapidmind_auth_session';

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

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; error?: string }> => {
    // Artificial brief network delay (300ms) for realistic UX feel
    await new Promise((resolve) => setTimeout(resolve, 300));

    const identifier = credentials.usernameOrEmail.trim().toLowerCase();
    const pass = credentials.password.trim();

    // Check Admin credentials
    if (
      (identifier === 'admin' || identifier === 'admin@rapidmind.org') &&
      pass === 'admin123'
    ) {
      saveUserSession(MOCK_ADMIN);
      return { success: true };
    }

    // Check Volunteer credentials
    if (
      (identifier === 'volunteer' || identifier === 'volunteer@rapidmind.org') &&
      pass === 'volunteer123'
    ) {
      saveUserSession(MOCK_VOLUNTEER);
      return { success: true };
    }

    // Role-specific fallback check if user entered role explicitly
    if (credentials.targetRole === 'admin' && pass === 'admin123') {
      saveUserSession(MOCK_ADMIN);
      return { success: true };
    }

    if (credentials.targetRole === 'volunteer' && pass === 'volunteer123') {
      saveUserSession(MOCK_VOLUNTEER);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please check your username/password.',
    };
  };

  const quickLogin = (role: UserRole) => {
    if (role === 'admin') {
      saveUserSession(MOCK_ADMIN);
    } else {
      saveUserSession(MOCK_VOLUNTEER);
    }
  };

  const logout = () => {
    saveUserSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        quickLogin,
        logout,
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
