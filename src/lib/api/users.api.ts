import { apiClient } from './client';

export interface BranchUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  branchId?: string | null;
  isActive: boolean;
  roles?: string[];
  branch?: { id: string; name: string; branchCode: string } | null;
}

export interface AccessPermission {
  id: string;
  name: string;
  description?: string | null;
  module: string;
  action: 'read' | 'write' | 'delete' | string;
}

export interface AccessRole {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  rolePermissions: { permission: AccessPermission }[];
}

export const usersApi = {
  getAll: (params?: { branchId?: string; search?: string }) =>
    apiClient<{ data: BranchUser[]; success: boolean }>('/users', { params }),

  getRoles: () => apiClient<{ data: AccessRole[]; success: boolean }>('/users/roles'),

  getPermissions: () =>
    apiClient<{ data: AccessPermission[]; success: boolean }>('/users/permissions'),

  createRole: (data: { name: string; description?: string; permissionIds: string[] }) =>
    apiClient<{ data: AccessRole; success: boolean }>('/users/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRole: (id: string, data: { name: string; description?: string; permissionIds: string[] }) =>
    apiClient<{ data: AccessRole; success: boolean }>(`/users/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRole: (id: string) =>
    apiClient<{ data: { id: string; name: string }; success: boolean }>(`/users/roles/${id}`, {
      method: 'DELETE',
    }),

  update: (
    id: string,
    data: { password?: string; roleNames?: string[]; firstName?: string; lastName?: string }
  ) =>
    apiClient<{ data: BranchUser; success: boolean }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiClient<{ data: { id: string; email: string }; success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  create: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    branchId?: string;
    roleNames: string[];
  }) =>
    apiClient<{ data: BranchUser; success: boolean }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
