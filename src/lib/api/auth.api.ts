import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  branchId?: string | null;
  branch?: {
    id: string;
    branchCode: string;
    name: string;
    currency: string;
    timezone: string;
    country: string;
    city: string;
  } | null;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export const authApi = {
  login: (data: LoginCredentials) =>
    apiClient<{ data: AuthResponse; success: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () =>
    apiClient<{ data: UserProfile; success: boolean }>('/auth/me'),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    apiClient('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiClient('/auth/logout', {
      method: 'POST',
    }),
};
