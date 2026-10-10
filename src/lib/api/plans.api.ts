import { apiClient } from './client';

export interface PlanServiceItem {
  id?: string;
  serviceId: string;
  serviceVariantId?: string | null;
  quantity: number;
  service?: { id: string; name: string; code: string };
  serviceVariant?: { id: string; name: string; duration: number };
}

export interface PlanTemplate {
  id: string;
  code: string;
  name: string;
  branchId?: string | null;
  description?: string;
  durationDays: number;
  price: number;
  currency: string;
  status: string;
  branch?: { id: string; name: string; branchCode: string };
  services: PlanServiceItem[];
  _count?: { memberships: number };
}

export const plansApi = {
  getAll: (params?: { branchId?: string; search?: string; status?: string }) =>
    apiClient<{ data: PlanTemplate[]; success: boolean }>('/plans', { params }),

  getById: (id: string) =>
    apiClient<{ data: PlanTemplate; success: boolean }>(`/plans/${id}`),

  create: (data: any) =>
    apiClient<{ data: PlanTemplate; success: boolean }>('/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiClient<{ data: PlanTemplate; success: boolean }>(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deactivate: (id: string) =>
    apiClient(`/plans/${id}`, {
      method: 'DELETE',
    }),
};
