import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export interface UserRole {
  id: string;
  code: string;
  name: string;
}

export interface UserProfile {
  id: string;
  loginId: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  status: string;
  roles: UserRole[];
  activeRole: string;
}

export interface DemoUser {
  role: string;
  roleName: string;
  loginId: string;
  name: string;
  department: string;
  passwordHint: string;
}

interface AuthContextType {
  user: UserProfile | null;
  activeRole: string | null;
  loading: boolean;
  demoUsers: DemoUser[];
  login: (loginId: string, password: string, requestedRole: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchActiveRole: (role: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);

  const fetchSession = async () => {
    try {
      const res = await apiFetch<any>('/api/auth/me');
      if (res.success && res.data) {
        const userData: UserProfile = res.data.user || res.data;
        const role = userData.activeRole || userData.roles?.[0]?.code || 'STUDENT';
        userData.activeRole = role;
        setUser(userData);
        setActiveRole(role);
      } else {
        setUser(null);
        setActiveRole(null);
      }
    } catch {
      setUser(null);
      setActiveRole(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoUsers = async () => {
    try {
      const res = await apiFetch<DemoUser[]>('/api/auth/demo-users');
      if (res.success && res.data) {
        setDemoUsers(res.data);
      }
    } catch (e) {
      console.error('Failed to load demo users', e);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchDemoUsers();
  }, []);

  const login = async (loginId: string, password: string, requestedRole: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ loginId, password, requestedRole }),
      });

      if (res.success && res.data) {
        const userData: UserProfile = res.data.user || res.data;
        const role = userData.activeRole || requestedRole || userData.roles?.[0]?.code || 'STUDENT';
        userData.activeRole = role;
        setUser(userData);
        setActiveRole(role);
        return { success: true };
      }
      return { success: false, error: res.error?.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setActiveRole(null);
    }
  };

  const switchActiveRole = async (newRole: string) => {
    try {
      const res = await apiFetch<any>('/api/auth/active-role', {
        method: 'POST',
        body: JSON.stringify({ roleCode: newRole }),
      });
      if (res.success && res.data) {
        const userData: UserProfile = res.data.user || res.data;
        const role = userData.activeRole || newRole;
        userData.activeRole = role;
        setUser(userData);
        setActiveRole(role);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        loading,
        demoUsers,
        login,
        logout,
        switchActiveRole,
        refreshUser: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
