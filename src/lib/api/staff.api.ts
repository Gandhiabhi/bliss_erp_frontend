import { apiClient } from './client';

export interface Staff {
  id: string;
  staffCode: string;
  branchId: string;
  name: string;
  phone?: string;
  email?: string;
  gender?: string;
  position?: string;
  specialization?: string;
  joiningDate?: string;
  notes?: string;
  status: string;
  branch?: {
    id: string;
    name: string;
    branchCode: string;
    city: string;
  };
  user?: {
    id: string;
    email: string;
    isActive: boolean;
  };
  _count?: {
    appointments: number;
    visitServices: number;
  };
}

export const staffApi = {
  getAll: (params?: { branchId?: string; search?: string; status?: string }) =>
    apiClient<{ data: Staff[]; success: boolean }>('/staff', { params }),

  getById: (id: string) =>
    apiClient<{ data: Staff; success: boolean }>(`/staff/${id}`),

  create: (data: Partial<Staff>) =>
    apiClient<{ data: Staff; success: boolean }>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Staff>) =>
    apiClient<{ data: Staff; success: boolean }>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deactivate: (id: string) =>
    apiClient(`/staff/${id}`, {
      method: 'DELETE',
    }),
};
