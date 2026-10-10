import { apiClient } from './client';

export interface Branch {
  id: string;
  branchCode: string;
  name: string;
  country: string;
  state?: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  openingTime?: string;
  closingTime?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  _count?: {
    customers: number;
    staff: number;
    memberships: number;
    visits: number;
  };
}

export const branchesApi = {
  getAll: (params?: { search?: string; status?: string }) =>
    apiClient<{ data: Branch[]; success: boolean }>('/branches', { params }),

  getById: (id: string) =>
    apiClient<{ data: Branch; success: boolean }>(`/branches/${id}`),

  create: (data: Partial<Branch>) =>
    apiClient<{ data: Branch; success: boolean }>('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Branch>) =>
    apiClient<{ data: Branch; success: boolean }>(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deactivate: (id: string) =>
    apiClient(`/branches/${id}`, {
      method: 'DELETE',
    }),
};
