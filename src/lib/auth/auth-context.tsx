'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi, UserProfile, LoginCredentials } from '../api/auth.api';

export type BranchView = NonNullable<UserProfile['branch']>;

interface AuthContextType {
  user: UserProfile | null;
  currentBranch: BranchView | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  activeBranchId: string | null;
  setActiveBranchId: (id: string | null, branch?: BranchView | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null);
  const [viewingBranch, setViewingBranch] = useState<BranchView | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const setActiveBranchId = (id: string | null, branch?: BranchView | null) => {
    setActiveBranchIdState(id);
    if (!id) {
      setViewingBranch(null);
    } else if (branch) {
      setViewingBranch(branch);
    }
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('active_branch_id', id);
        if (branch) {
          localStorage.setItem('active_branch', JSON.stringify(branch));
        }
      } else {
        localStorage.removeItem('active_branch_id');
        localStorage.removeItem('active_branch');
      }
    }
  };

  const loadUserProfile = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const res = await authApi.getProfile();
      if (res?.data) {
        setUser(res.data);
        const storedBranchId = localStorage.getItem('active_branch_id');
        const storedBranchRaw = localStorage.getItem('active_branch');
        if (res.data.branch) {
          setActiveBranchIdState(res.data.branch.id);
          setViewingBranch(res.data.branch);
        } else if (storedBranchId) {
          setActiveBranchIdState(storedBranchId);
          if (storedBranchRaw) {
            try {
              setViewingBranch(JSON.parse(storedBranchRaw) as BranchView);
            } catch {
              setViewingBranch(null);
            }
          }
        }
      }
    } catch {
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res?.data?.accessToken) {
        localStorage.setItem('access_token', res.data.accessToken);
        setUser(res.data.user);
        if (res.data.user.branchId) {
          setActiveBranchId(res.data.user.branchId);
        }
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout network error
    } finally {
        localStorage.removeItem('access_token');
      localStorage.removeItem('active_branch_id');
      localStorage.removeItem('active_branch');
      setUser(null);
      setViewingBranch(null);
      router.push('/login');
    }
  };

  const isSuperAdmin = Boolean(user?.roles?.includes('SUPER_ADMIN'));

  const hasRole = (role: string) => {
    if (isSuperAdmin) return true;
    return Boolean(user?.roles?.includes(role));
  };

  const hasPermission = (permission: string) => {
    if (isSuperAdmin) return true;
    return Boolean(user?.permissions?.includes(permission));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentBranch: user?.branch || viewingBranch,
        isLoading,
        isAuthenticated: Boolean(user),
        isSuperAdmin,
        activeBranchId,
        setActiveBranchId,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
